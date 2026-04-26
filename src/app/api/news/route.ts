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
//  GDELT 뉴스 가져오기
// ═══════════════════════════════════════════════════════════
async function getGdeltNews(): Promise<NewsItem[]> {
  try {
    const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=financial OR economic OR stock OR market OR trading OR futures&mode=artlist&maxrecords=10&timespan=1d&format=json';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.articles) return [];
    
    return data.articles.map((a: any) => ({
      symbol: 'MARKET',
      publishedDate: a.seendate,
      title: a.title,
      text: '',
      source: a.source || 'GDELT',
      image: '',
      url: a.url,
      _importance: (a.title.toLowerCase().match(/breaking|crash|fed|inflation|cpi|gdp/i)) ? 
                   (a.title.toLowerCase().match(/breaking|crash|fed/i) ? 'critical' : 'high') : 'normal'
    }));
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════
//  시장 영향 키워드 필터 (Breaking News용)
// ═══════════════════════════════════════════════════════════
const BREAKING_KEYWORDS = [
  'fed', 'fomc', 'rate cut', 'rate hike', 'interest rate', 'federal reserve',
  'ecb', 'boj', 'bank of japan', 'powell', 'yellen',
  '기준금리', '금리', '연준', '인하', '동결',
  'gdp', 'cpi', 'ppi', 'inflation', 'deflation', 'recession',
  'unemployment', 'jobs', 'nonfarm', 'employment', 'retail sales',
  '경제성장률', '물가지수', '고용', '실업률',
  'war', 'conflict', 'sanction', 'tariff', 'trade war', 'nuclear',
  'israel', 'iran', 'russia', 'ukraine', 'china', 'north korea',
  '지정학', '전쟁', '제재', '관세', '무역',
  'crash', 'surge', 'rally', 'plunge', 'record high', 'record low',
  'halt', 'circuit breaker', 'flash crash',
  '급락', '급등', '폭락', '돌파', '사상최고', '최저',
  'opec', 'oil price', 'gold price', 'gold hit', 'crude',
  '산유', '원유', '골드', '금값',
  'nvidia', 'apple', 'tesla', 'microsoft', 'google', 'meta',
  'ai chip', 'semiconductor', 'tech layoff',
  '엔비디아', '테슬라', '반도체',
  'bitcoin', 'ethereum', 'crypto', 'sec', 'etf approval',
  '비트코인', '암호화폐',
];

const CRITICAL_KW = ['fed', 'fomc', 'rate cut', 'rate hike', 'circuit breaker', 'crash', '비트코인'];

function isMarketMoving(title: string, text: string): boolean {
  const content = `${title} ${text}`.toLowerCase();
  let matchCount = 0;
  for (const kw of BREAKING_KEYWORDS) {
    if (content.includes(kw)) {
      matchCount++;
      if (matchCount >= 2) return true;
    }
  }
  for (const kw of CRITICAL_KW) {
    if (content.includes(kw)) return true;
  }
  return false;
}

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
  const mode = searchParams.get('mode') || 'column';

  // ── 1. FMP 뉴스 ──────────────────────────────────────
  let fmpNews: NewsItem[] = [];
  let fmpNewsAll: NewsItem[] = [];
  try {
    fmpNews = await getNews(symbol);
    // 추가 종목별 뉴스 병렬 수집
    if (!symbol) {
      const extraSymbols = ['NVDA', 'AAPL', 'TSLA', 'META', 'CLUSD', 'GCUSD'];
      const extraResults = await Promise.allSettled(
        extraSymbols.map(s => getNews(s))
      );
      fmpNewsAll = [
        ...fmpNews,
        ...extraResults
          .filter(r => r.status === 'fulfilled')
          .flatMap(r => (r as PromiseFulfilledResult<NewsItem[]>).value),
      ];
      // 중복 제거 (title로)
      const seenTitles = new Set<string>();
      fmpNewsAll = fmpNewsAll.filter(n => {
        const key = n.title.slice(0, 50);
        if (seenTitles.has(key)) return false;
        seenTitles.add(key);
        return true;
      });
    }
  } catch {}
  // fmpNews = fmpNewsAll 길면 사용
  if (fmpNewsAll.length > 0) fmpNews = fmpNewsAll;

  // ── 2. 웹검색 & GDELT 보강 ────────────────────────────
  let webResults: WebSearchResult[] = [];
  let gdeltNews: NewsItem[] = [];
  try {
    if (mode === 'breaking') {
      if (fmpNews.length < 10) gdeltNews = await getGdeltNews();
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      // 여러 검색어를 병렬로 실행해서 더 많은 뉴스 수집
      const searchTasks = [
        webSearch(`시장 뉴스 Fed 금리 원유 골드 나스닥 비트코인 ${dateStr}`, 10),
        webSearch(`글로벌 경제 주요 뉴스 ${dateStr}`, 10),
        webSearch(`stock market news today ${dateStr}`, 10),
        webSearch(`breaking financial news commodities ${dateStr}`, 10),
      ];
      const searchResults = await Promise.allSettled(searchTasks);
      webResults = searchResults
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => (r as PromiseFulfilledResult<WebSearchResult[]>).value)
        .filter((r, i, arr) => arr.findIndex(x => x.title?.slice(0,40) === r.title?.slice(0,40)) === i);
    } else if (category) {
      const ct = category as 'macro' | 'commodity' | 'tech' | 'crypto';
      webResults = await searchMarketNews(ct);
      // 같은 카테고리로 추가 검색
      const extraQuery = ct === 'macro' ? '미국 경제 지표 뉴스' :
        ct === 'commodity' ? '원자재 가격 동향' :
        ct === 'tech' ? '테크 기업 실적 뉴스' : '가상자산 시장 뉴스';
      const extraResults = await webSearch(extraQuery, 8);
      webResults = [...webResults, ...extraResults]
        .filter((r, i, arr) => arr.findIndex(x => x.title?.slice(0,40) === r.title?.slice(0,40)) === i);
    } else if (symbol) {
      const label = searchParams.get('label') || symbol;
      webResults = await searchFinancialNews(symbol, label);
    } else {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      webResults = await webSearch(
        `글로벌 경제 뉴스 Fed 금리 원유 골드 나스닥 AI 비트코인 ${dateStr}`,
        20
      );
    }
  } catch {}

  const webNewsItems: NewsItem[] = webResults.map((r) => ({
    symbol: symbol || 'MARKET',
    publishedDate: r.publishedDate || new Date().toISOString(),
    title: r.title,
    text: r.snippet,
    source: r.siteName,
    image: '',
    url: r.url,
  }));

  // 병합 + 중복 제거 (url 기준)
  const allNews = [...fmpNews, ...webNewsItems, ...gdeltNews];
  const seenUrls = new Set<string>();
  const uniqueNews = allNews.filter((n) => {
    if (!n.url || n.url === '#') return true;
    if (seenUrls.has(n.url)) return false;
    seenUrls.add(n.url);
    return true;
  });

  // ── 3. Breaking 모드: 시장 영향 뉴스만 선별 ──────────
  let filteredNews = uniqueNews;
  if (mode === 'breaking') {
    const scored = uniqueNews
      .map(n => ({ ...n, _impactScore: calcImpact(n.title, n.text || '') }))
      .filter(n => (n as any)._impactScore >= 1 || isMarketMoving(n.title, n.text || ''))
      .sort((a, b) => (b as any)._impactScore - (a as any)._impactScore);
    filteredNews = scored.length > 0 ? scored.slice(0, 15) : uniqueNews.slice(0, 10);
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
