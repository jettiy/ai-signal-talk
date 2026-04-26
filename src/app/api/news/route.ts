import { NextRequest, NextResponse } from 'next/server';
import { getNews } from '@/lib/fmp';
import { webSearch, searchMarketNews, searchFinancialNews, translateNewsToKorean } from '@/lib/zai-web-search';
import type { NewsItem, WebSearchResult } from '@/lib/types';

// ═══════════════════════════════════════════════════════════
//  강화된 URL 매칭 — 제목으로 실제 기사 URL 찾기
// ═══════════════════════════════════════════════════════════
function findExactUrl(title: string, webResults: WebSearchResult[]): string {
  const lowerTitle = title.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').trim();

  // 1) 정확한 제목 매칭 (공백/특수문자 제거 후)
  for (const r of webResults) {
    if (!r.url) continue;
    const lowerRes = (r.title || '').toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').trim();
    if (lowerRes === lowerTitle) return r.url;
  }

  // 2) 제목 첫 50자 매칭
  for (const r of webResults) {
    if (!r.url) continue;
    const rKey = (r.title || '').toLowerCase().slice(0, 50);
    const tKey = title.toLowerCase().slice(0, 50);
    if (rKey === tKey) return r.url;
  }

  // 3) 한글 제목 → 웹검색 결과에서 제목이 포함된 URL 찾기 (앞 30자 일치)
  for (const r of webResults) {
    if (!r.url) continue;
    if ((r.title || '').toLowerCase().includes(title.toLowerCase().slice(0, 30))) return r.url;
    if (title.toLowerCase().includes((r.title || '').toLowerCase().slice(0, 30))) return r.url;
  }

  return '';
}

function ensureValidUrl(item: NewsItem, webResults: WebSearchResult[]): string {
  // 이미 유효한 URL이면 그대로 사용
  if (item.url && item.url !== '#' && item.url !== '' && item.url.startsWith('http')) return item.url;

  // 웹검색 결과에서 제목으로 실제 URL 찾기
  const matched = findExactUrl(item.title, webResults);
  if (matched) return matched;

  // 찾지 못함 → 이 뉴스는 표시 불가
  return '';
}

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
  const category = searchParams.get('category') || '';
  const mode = searchParams.get('mode') || 'column';

  // ── 1. FMP 뉴스 (종목별 병렬 수집) ────────────────
  let allFmpNews: NewsItem[] = [];
  try {
    const symbolsToFetch = symbol
      ? [symbol]
      : ['', 'NVDA', 'AAPL', 'TSLA', 'META', 'GCUSD', 'CLUSD', 'MSFT', 'AMZN', 'GOOGL'];

    const results = await Promise.allSettled(
      symbolsToFetch.map(s => getNews(s))
    );

    allFmpNews = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<NewsItem[]>).value);

    // 제목 기반 중복 제거
    const seen = new Set<string>();
    allFmpNews = allFmpNews.filter(n => {
      const key = n.title.slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch {}

  // ── 2. 웹검색 & GDELT 보강 ──────────────────────────
  let webResults: WebSearchResult[] = [];
  let gdeltNews: NewsItem[] = [];
  try {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (mode === 'breaking') {
      if (allFmpNews.length < 10) gdeltNews = await getGdeltNews();
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
        .filter((r, i, arr) => arr.findIndex(x => x.title?.slice(0, 40) === r.title?.slice(0, 40)) === i)
        .filter(r => r.url && r.url.startsWith('http'));
    } else if (category) {
      const ct = category as 'macro' | 'commodity' | 'tech' | 'crypto';
      webResults = await searchMarketNews(ct);
      const extraQuery = ct === 'macro' ? '미국 경제 지표 뉴스' :
        ct === 'commodity' ? '원자재 가격 동향' :
        ct === 'tech' ? '테크 기업 실적 뉴스' : '가상자산 시장 뉴스';
      const extraResults = await webSearch(extraQuery, 8);
      webResults = [...webResults, ...extraResults]
        .filter((r, i, arr) => arr.findIndex(x => x.title?.slice(0, 40) === r.title?.slice(0, 40)) === i)
        .filter(r => r.url && r.url.startsWith('http'));
    } else if (symbol) {
      const label = searchParams.get('label') || symbol;
      webResults = await searchFinancialNews(symbol, label);
      webResults = webResults.filter(r => r.url && r.url.startsWith('http'));
    } else {
      webResults = await webSearch(`글로벌 경제 뉴스 Fed 금리 원유 골드 나스닥 AI 비트코인 ${dateStr}`, 20);
      webResults = webResults.filter(r => r.url && r.url.startsWith('http'));
    }
  } catch {}

  const webNewsItems: NewsItem[] = webResults.map((r) => ({
    symbol: symbol || 'MARKET',
    publishedDate: r.publishedDate || new Date().toISOString(),
    title: r.title,
    text: r.snippet || '',
    source: r.siteName || '',
    image: '',
    url: r.url,
  }));

  // ── 3. 병합 + 중복 제거 ─────────────────────────────
  const allNews = [...allFmpNews, ...webNewsItems, ...gdeltNews];
  const seenUrls = new Set<string>();
  const uniqueNews = allNews.filter((n) => {
    if (!n.url || n.url === '#') return false; // URL 없는 뉴스는 아예 제외
    if (seenUrls.has(n.url)) return false;
    seenUrls.add(n.url);
    return true;
  });

  // ── 4. Breaking 모드: 시장 영향 뉴스만 선별 ─────────
  let filteredNews = uniqueNews;
  if (mode === 'breaking') {
    const scored = uniqueNews
      .map(n => ({ ...n, _impactScore: calcImpact(n.title, n.text || '') }))
      .filter(n => (n as any)._impactScore >= 1 || isMarketMoving(n.title, n.text || ''))
      .sort((a, b) => (b as any)._impactScore - (a as any)._impactScore);
    filteredNews = scored.length > 0 ? scored.slice(0, 20) : uniqueNews.slice(0, 15);
  }

  // ── 5. 한국어 번역 ──────────────────────────────────
  const translatedNews = await translateNewsToKorean(filteredNews);

  // ── 6. URL 최종 검증 — 유효한 URL만 남김 ────────────
  const enriched = translatedNews
    .map((item) => {
      const finalUrl = ensureValidUrl(item, webResults);
      if (!finalUrl) return null; // URL을 찾을 수 없으면 제외
      return { ...item, url: finalUrl, image: item.image || '' };
    })
    .filter((n): n is NewsItem => n !== null);

  // ── 7. 캐시 ──────────────────────────────────────────
  const cacheMaxAge = mode === 'breaking' ? 300 : 3600;

  return NextResponse.json(enriched.slice(0, 20), {
    headers: {
      'Cache-Control': `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 2}`,
    },
  });
}
