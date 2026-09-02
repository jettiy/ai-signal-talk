import { NextRequest, NextResponse } from 'next/server';
import { fetchBloombergNews, fetchSeekingAlphaNews, fetchYahooNews } from '@/lib/rss-news';
import { translateNewsToKorean } from '@/lib/zai-web-search';
import type { NewsItem } from '@/lib/types';

export const revalidate = 300;

// ═══════════════════════════════════════════════════════════
//  GDELT 뉴스 가져오기
// ═══════════════════════════════════════════════════════════
async function getGdeltNews(): Promise<NewsItem[]> {
  try {
    const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=financial OR economic OR stock OR market OR trading OR futures&mode=artlist&maxrecords=15&timespan=1d&format=json';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.articles) return [];

    return data.articles
      .filter((a: any) => a.url && a.url.startsWith('http'))
      .map((a: any) => ({
        symbol: 'MARKET',
        publishedDate: a.seendate,
        title: a.title,
        text: '',
        source: a.source || 'GDELT',
        image: '',
        url: a.url,
      }));
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════
//  시장 영향 키워드 필터
// ═══════════════════════════════════════════════════════════
const BREAKING_KEYWORDS = [
  'fed', 'fomc', 'rate cut', 'rate hike', 'interest rate', 'federal reserve',
  'ecb', 'boj', 'bank of japan', 'powell', 'yellen',
  'gdp', 'cpi', 'ppi', 'inflation', 'deflation', 'recession',
  'unemployment', 'jobs', 'nonfarm', 'employment', 'retail sales',
  'war', 'conflict', 'sanction', 'tariff', 'trade war', 'nuclear',
  'israel', 'iran', 'russia', 'ukraine', 'china', 'north korea',
  'crash', 'surge', 'rally', 'plunge', 'record high', 'record low',
  'halt', 'circuit breaker', 'flash crash',
  'opec', 'oil price', 'gold price', 'gold hit', 'crude',
  'nvidia', 'apple', 'tesla', 'microsoft', 'google', 'meta',
  'ai chip', 'semiconductor', 'tech layoff',
  'bitcoin', 'ethereum', 'crypto', 'sec', 'etf approval',
];

const CRITICAL_KW = ['fed', 'fomc', 'rate cut', 'rate hike', 'circuit breaker', 'crash'];

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

// ── 카테고리 키워드 필터 (클라이언트 inferCategory와 동일 로직) ──
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  commodity: ['gold', 'oil', 'wti', 'crude', 'commodity', 'opec', 'gcusd', 'clusd'],
  tech: ['aapl', 'nvda', 'tsla', 'meta', 'msft', 'amzn', 'googl', 'ai chip', 'chip', 'semiconductor', 'nvidia', 'apple', 'tesla', 'microsoft', 'google'],
  crypto: ['btcusd', 'ethusd', 'bitcoin', 'ethereum', 'crypto'],
};

function matchesCategory(item: NewsItem, category: string): boolean {
  if (category === 'all' || !category) return true;
  const keywords = CATEGORY_KEYWORDS[category];
  if (!keywords) return true; // 알 수 없는 카테고리는 모두 통과
  const text = `${item.symbol} ${item.title} ${item.text}`.toLowerCase();
  return keywords.some((kw) => text.includes(kw));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || '';
  const category = searchParams.get('category') || '';
  const mode = searchParams.get('mode') || 'column';

  // ── 1. RSS + GDELT 병렬 수집 ────────────────────────
  const results = await Promise.allSettled([
    fetchYahooNews(),
    fetchBloombergNews(),
    fetchSeekingAlphaNews(),
    getGdeltNews(),
  ]);

  const collected: NewsItem[] = results
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  // ── 2. 병합 + URL 기준 중복 제거 ─────────────────────
  const merged = collected
    .map((item) => ({
      ...item,
      symbol: symbol || item.symbol || 'MARKET',
    }))
    .filter((item) => item.title && item.url);

  const seenUrls = new Set<string>();
  const uniqueNews = merged.filter((n) => {
    if (!n.url || n.url === '#') return false;
    if (seenUrls.has(n.url)) return false;
    seenUrls.add(n.url);
    return true;
  });

  // ── 3. Breaking 모드: 시장 영향 뉴스만 선별 ─────────
  let filteredNews = uniqueNews;
  if (mode === 'breaking') {
    const scored = uniqueNews
      .map(n => ({ ...n, _impactScore: calcImpact(n.title, n.text || '') }))
      .filter(n => (n as any)._impactScore >= 1 || isMarketMoving(n.title, n.text || ''))
      .sort((a, b) => (b as any)._impactScore - (a as any)._impactScore);
    filteredNews = scored.length > 0 ? scored.slice(0, 20) : uniqueNews.slice(0, 15);
  }

  // ── 4. 카테고리 필터 (서버 사이드) ─────────────────
  if (category) {
    filteredNews = filteredNews.filter((item) => matchesCategory(item, category));
  }

  // 유효한 URL만
  const enriched = filteredNews.filter((item) => item.url && item.url.startsWith('http'));

  // 최대 20개
  const finalNews = enriched.slice(0, 20);

  // ── 5. GLM 한국어 배치 번역 ────────────────────────
  const translatedNews = await translateNewsToKorean(finalNews);

  // ── 6. 캐시 ──────────────────────────────────────────
  const cacheMaxAge = mode === 'breaking' ? 300 : 3600;

  return NextResponse.json(translatedNews, {
    headers: {
      'Cache-Control': `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 2}`,
    },
  });
}
