import { NextRequest, NextResponse } from 'next/server';
import { fetchBloombergNews, fetchSeekingAlphaNews, fetchYahooNews } from '@/lib/rss-news';
import { translateNewsToKorean } from '@/lib/zai-web-search';
import type { NewsItem } from '@/lib/types';

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || '';
  const category = searchParams.get('category') || ''; // 인터페이스 유지
  const mode = searchParams.get('mode') || 'column';
  void category;

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

  // ── 4. 한국어 번역 ──────────────────────────────────
  const translatedNews = await translateNewsToKorean(filteredNews);

  // ── 5. URL 최종 검증 — 유효한 URL만 남김 ────────────
  const enriched = translatedNews
    .filter((item) => item.url && item.url.startsWith('http'));

  // ── 6. 캐시 ──────────────────────────────────────────
  const cacheMaxAge = mode === 'breaking' ? 300 : 3600;

  return NextResponse.json(enriched.slice(0, 20), {
    headers: {
      'Cache-Control': `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 2}`,
    },
  });
}
