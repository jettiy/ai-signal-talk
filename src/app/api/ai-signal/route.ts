import { NextRequest, NextResponse } from 'next/server';
import { generateAiSignal } from '@/lib/ai';
import { searchFinancialNews } from '@/lib/zai-web-search';
import { FUTURES_SYMBOLS } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { symbol, price, changePct, news, timeframe } = await req.json();

    // Z.AI 웹검색으로 뉴스 보강
    let webSearchResults: import('@/lib/types').WebSearchResult[] = [];
    try {
      const label = Object.values(FUTURES_SYMBOLS).find(
        (f) => f.symbol === symbol
      )?.label || symbol;
      webSearchResults = await searchFinancialNews(symbol, label);
    } catch {
      // 웹검색 실패해도 시그널 생성은 진행
    }

    const result = await generateAiSignal({
      symbol,
      price,
      changePct,
      news: news || [],
      timeframe: timeframe || '1hour',
      webSearchResults,
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'AI 분석 실패' }, { status: 500 });
  }
}
