import { NextRequest, NextResponse } from 'next/server';
import { getNews } from '@/lib/fmp';
import { searchMarketNews, searchFinancialNews } from '@/lib/zai-web-search';
import type { WebSearchResult } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || '';
  const category = searchParams.get('category') || '';

  // 1. FMP 뉴스 (기본)
  const fmpNews = await getNews(symbol);

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
    }
  } catch {
    // 웹검색 실패해도 FMP 뉴스는 반환
  }

  // 웹검색 결과를 NewsItem 형식으로 변환해서 병합
  const webNewsItems = webResults.map((r) => ({
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

  return NextResponse.json(uniqueNews.slice(0, 20));
}
