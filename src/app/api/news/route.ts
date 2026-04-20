import { NextRequest, NextResponse } from 'next/server';
import { getNews } from '@/lib/fmp';
import { webSearch, searchMarketNews, searchFinancialNews, translateNewsToKorean } from '@/lib/zai-web-search';
import type { NewsItem, WebSearchResult } from '@/lib/types';

/** 출처별 기본 URL 매핑 */
const SOURCE_DEFAULT_URLS: Record<string, string> = {
  reuters: 'https://www.reuters.com',
  bloomberg: 'https://www.bloomberg.com',
  cnbc: 'https://www.cnbc.com',
  'market watch': 'https://www.marketwatch.com',
  'investing.com': 'https://www.investing.com',
  yahoo: 'https://finance.yahoo.com',
};

/** 출처 이름으로 기본 URL 찾기 (대소문자 무시, 부분 매칭) */
function getDefaultUrl(source: string): string {
  const lower = source.toLowerCase();
  for (const [key, url] of Object.entries(SOURCE_DEFAULT_URLS)) {
    if (lower.includes(key)) return url;
  }
  return '';
}

/** Z.AI 웹검색 결과에서 제목이 비슷한 아이템의 URL 찾기 */
function findUrlFromWebResults(
  title: string,
  webResults: WebSearchResult[]
): string {
  const lower = title.toLowerCase();
  for (const r of webResults) {
    if (r.url && r.title.toLowerCase().slice(0, 40) === lower.slice(0, 40)) {
      return r.url;
    }
  }
  return '';
}

/** FMP 뉴스 아이템의 URL 보강 */
function ensureUrl(
  item: NewsItem,
  webResults: WebSearchResult[]
): NewsItem {
  const hasValidUrl = item.url && item.url !== '#' && item.url !== '';
  if (hasValidUrl) return item;

  // 1) 웹검색 결과에서 매칭 시도
  const matched = findUrlFromWebResults(item.title, webResults);
  if (matched) return { ...item, url: matched };

  // 2) 출처별 기본 URL
  const fallback = getDefaultUrl(item.source);
  return { ...item, url: fallback };
}

/** 발행 시간을 상대 시간으로 포맷 */
function formatRelativeTime(dateStr: string): string {
  try {
    const now = Date.now();
    const published = new Date(dateStr).getTime();
    const diffMs = now - published;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    return dateStr.slice(0, 10);
  } catch {
    return dateStr;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || '';
  const category = searchParams.get('category') || '';

  // ── 1. FMP 뉴스 (영어 원문) ─────────────────────────────
  let fmpNews: NewsItem[] = [];
  try {
    fmpNews = await getNews(symbol);
  } catch {
    // FMP 실패해도 웹검색은 계속 진행
  }

  // ── 2. Z.AI 웹검색 보강 (한국어 검색 결과) ──────────────
  let webResults: WebSearchResult[] = [];
  try {
    if (category) {
      webResults = await searchMarketNews(
        category as 'macro' | 'commodity' | 'tech' | 'crypto'
      );
    } else if (symbol) {
      const label = searchParams.get('label') || symbol;
      webResults = await searchFinancialNews(symbol, label);
    } else {
      // 글로벌 마켓 뉴스 — 매번 다른 결과를 위해 현재 시간 포함
      const now = new Date();
      const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
      webResults = await webSearch(
        `글로벌 경제 시장 뉴스 ${dateStr} Fed 금리 원유 골드 나스닥 최신`,
        10
      );
    }
  } catch {
    // 웹검색 실패해도 FMP 뉴스는 반환
  }

  // 웹검색 결과를 NewsItem 형식으로 변환
  const webNewsItems: NewsItem[] = webResults.map((r) => ({
    symbol: symbol || 'MARKET',
    publishedDate: r.publishedDate || new Date().toISOString(),
    title: r.title,
    text: r.snippet,
    source: r.siteName,
    image: '',
    url: r.url,
  }));

  // FMP 뉴스 + 웹검색 뉴스 병합 (중복 제거)
  const allNews = [...fmpNews, ...webNewsItems];
  const seen = new Set<string>();
  const uniqueNews = allNews.filter((n) => {
    const key = n.title.slice(0, 50).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ── 3. 영어 뉴스 → GLM-4.5-Air 한국어 배치 번역 ────────
  const translatedNews = await translateNewsToKorean(uniqueNews);

  // ── 4. URL 보강 + 이미지 보강 ───────────────────────────
  const enriched = translatedNews.map((item) => {
    const withUrl = ensureUrl(item, webResults);
    return { ...withUrl, image: withUrl.image || '' };
  });

  // ── 5. 캐시 헤더 (no-store: 항상 최신 뉴스) ─────────────
  return NextResponse.json(enriched.slice(0, 20), {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
