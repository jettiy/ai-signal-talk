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

function getDefaultUrl(source: string): string {
  const lower = source.toLowerCase();
  for (const [key, url] of Object.entries(SOURCE_DEFAULT_URLS)) {
    if (lower.includes(key)) return url;
  }
  return '';
}

function findUrlFromWebResults(title: string, webResults: WebSearchResult[]): string {
  const lower = title.toLowerCase();
  for (const r of webResults) {
    if (r.url && r.title.toLowerCase().slice(0, 40) === lower.slice(0, 40)) return r.url;
  }
  return '';
}

function ensureUrl(item: NewsItem, webResults: WebSearchResult[]): NewsItem {
  const hasValidUrl = item.url && item.url !== '#' && item.url !== '';
  if (hasValidUrl) return item;
  const matched = findUrlFromWebResults(item.title, webResults);
  if (matched) return { ...item, url: matched };
  return { ...item, url: getDefaultUrl(item.source) };
}

// ═══════════════════════════════════════════════════════════
//  시장 영향 키워드 필터 (Breaking News용)
//  금리, Fed, GDP, 인플레이션, 실업, 지정학 등 시장 변동성 유발
// ═══════════════════════════════════════════════════════════
const BREAKING_KEYWORDS = [
  // 금리/중앙은행
  'fed', 'fomc', 'rate cut', 'rate hike', 'interest rate', 'federal reserve',
  'ecb', 'boj', 'bank of japan', 'powell', 'yellen',
  '기준금리', '금리', '연준', '인하', '동결',
  // GDP/경제지표
  'gdp', 'cpi', 'ppi', 'inflation', 'deflation', 'recession',
  'unemployment', 'jobs', 'nonfarm', 'employment', 'retail sales',
  '경제성장률', '물가지수', '고용', '실업률',
  // 지정학/위험
  'war', 'conflict', 'sanction', 'tariff', 'trade war', 'nuclear',
  'israel', 'iran', 'russia', 'ukraine', 'china', 'north korea',
  '지정학', '전쟁', '제재', '관세', '무역',
  // 시장 쇼크
  'crash', 'surge', 'rally', 'plunge', 'record high', 'record low',
  'halt', 'circuit breaker', 'flash crash',
  '급락', '급등', '폭락', '돌파', '사상최고', '최저',
  // 원자재
  'opec', 'oil price', 'gold price', 'gold hit', 'crude',
  '산유', '원유', '골드', '금값',
  // 빅테크/AI
  'nvidia', 'apple', 'tesla', 'microsoft', 'google', 'meta',
  'ai chip', 'semiconductor', 'tech layoff',
  '엔비디아', '테슬라', '반도체',
  // 암호화폐
  'bitcoin', 'ethereum', 'crypto', 'sec', 'etf approval',
  '비트코인', '암호화폐',
];

function isMarketMoving(title: string, text: string): boolean {
  const content = `${title} ${text}`.toLowerCase();
  // 키워드 2개 이상 매칭 → 높은 확률로 시장 영향 뉴스
  let matchCount = 0;
  for (const kw of BREAKING_KEYWORDS) {
    if (content.includes(kw)) {
      matchCount++;
      if (matchCount >= 2) return true;
    }
  }
  // 단일 키워드라도 핵심 키워드면 통과
  const criticalKw = ['fed', 'fomc', 'rate cut', 'rate hike', 'circuit breaker', 'crash', '비트코인'];
  for (const kw of criticalKw) {
    if (content.includes(kw)) return true;
  }
  return false;
}

/** 임팩트 점수 계산 */
function calcImpact(title: string, text: string): number {
  const content = `${title} ${text}`.toLowerCase();
  let score = 0;
  for (const kw of BREAKING_KEYWORDS) {
    if (content.includes(kw)) score++;
  }
  return score;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || '';
  const category = searchParams.get('category') || '';
  const mode = searchParams.get('mode') || 'column'; // 'breaking' | 'column'

  // ── 1. FMP 뉴스 ──────────────────────────────────────
  let fmpNews: NewsItem[] = [];
  try {
    fmpNews = await getNews(symbol);
  } catch {}

  // ── 2. 웹검색 보강 (breaking 모드에서는 생략 → FMP만 사용) ──
  let webResults: WebSearchResult[] = [];
  if (mode !== 'breaking') {
    try {
      if (category) {
        webResults = await searchMarketNews(category as 'macro' | 'commodity' | 'tech' | 'crypto');
      } else if (symbol) {
        const label = searchParams.get('label') || symbol;
        webResults = await searchFinancialNews(symbol, label);
      } else {
        const now = new Date();
        const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
        webResults = await webSearch(`글로벌 경제 시장 뉴스 ${dateStr} Fed 금리 원유 골드 나스닥 최신`, 10);
      }
    } catch {}
  }

  const webNewsItems: NewsItem[] = webResults.map((r) => ({
    symbol: symbol || 'MARKET',
    publishedDate: r.publishedDate || new Date().toISOString(),
    title: r.title,
    text: r.snippet,
    source: r.siteName,
    image: '',
    url: r.url,
  }));

  // 병합 + 중복 제거
  const allNews = [...fmpNews, ...webNewsItems];
  const seen = new Set<string>();
  const uniqueNews = allNews.filter((n) => {
    const key = n.title.slice(0, 50).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ── 3. Breaking 모드: 시장 영향 뉴스만 선별 ──────────
  let filteredNews = uniqueNews;
  if (mode === 'breaking') {
    const scored = uniqueNews
      .map(n => ({ ...n, _impactScore: calcImpact(n.title, n.text || '') }))
      .filter(n => n._impactScore >= 2 || isMarketMoving(n.title, n.text || ''))
      .sort((a, b) => b._impactScore - a._impactScore);
    filteredNews = scored.slice(0, 15);
  }

  // ── 4. 한국어 번역 ────────────────────────────────────
  const translatedNews = await translateNewsToKorean(filteredNews);

  // ── 5. URL 보강 ───────────────────────────────────────
  const enriched = translatedNews.map((item) => ensureUrl(item, webResults));

  // ── 6. 캐시: breaking=5분, column=1시간 ──────────────
  const cacheMaxAge = mode === 'breaking' ? 300 : 3600;

  return NextResponse.json(enriched.slice(0, 20), {
    headers: {
      'Cache-Control': `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 2}`,
    },
  });
}
