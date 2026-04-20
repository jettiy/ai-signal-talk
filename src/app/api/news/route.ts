import { NextRequest, NextResponse } from 'next/server';
import { getNews } from '@/lib/fmp';
import { webSearch, searchMarketNews, searchFinancialNews } from '@/lib/zai-web-search';
import type { NewsItem, WebSearchResult } from '@/lib/types';

/** 출처별 기본 URL 매핑 */
const SOURCE_DEFAULT_URLS: Record<string, string> = {
  reuters: 'https://www.reuters.com',
  bloomberg: 'https://www.bloomberg.com',
  cnbc: 'https://www.cnbc.com',
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || '';
  const category = searchParams.get('category') || '';

  // 1. FMP 뉴스 (기본) — 실패해도 빈 배열로 진행
  let fmpNews: NewsItem[] = [];
  try {
    fmpNews = await getNews(symbol);
  } catch {
    // FMP 실패해도 웹검색은 계속 진행
  }

  // 2. Z.AI 웹검색 보강
  let webResults: WebSearchResult[] = [];
  try {
    if (category) {
      // 카테고리별 마켓 뉴스
      webResults = await searchMarketNews(
        category as 'macro' | 'commodity' | 'tech' | 'crypto'
      );
    } else if (symbol) {
      // 종목별 뉴스
      const label = searchParams.get('label') || symbol;
      webResults = await searchFinancialNews(symbol, label);
    } else {
      // 카테고리/심볼 모두 없을 때: 글로벌 마켓 뉴스
      webResults = await webSearch(
        '글로벌 경제 시장 뉴스 Fed 금리 원유 골드',
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

  // URL 보강: 모든 아이템이 유효한 URL을 갖도록
  const enriched = uniqueNews.map((item) => {
    const withUrl = ensureUrl(item, webResults);
    // 이미지 보강: 이미지가 없으면 빈 문자열 유지
    return { ...withUrl, image: withUrl.image || '' };
  });

  // ISR 캐싱: 1분마다 revalidate (뉴스는 상대적으로 덜 빠르게 갱신됨)
  return NextResponse.json(enriched.slice(0, 20), {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
