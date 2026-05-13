import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/fmp';

export async function GET() {
  // 선물 5종 + 주요 종목 (커뮤니티 패널 `activeAsset`과 심볼 키 일치)
  const symbols = [
    'NQUSD',
    'GCUSD',
    'CLUSD',
    'KOSPI',
    'HSIUSD',
    'AAPL',
    'NVDA',
    'TSLA',
    'META',
    'MSFT',
    'AMZN',
    'SPY',
    'QQQ',
  ];
  const data = await getQuotes(symbols);

  // ISR 캐싱: 30초마다 revalidate (실시간 시세는 빠르게 갱신 필요)
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
