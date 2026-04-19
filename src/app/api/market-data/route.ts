import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/fmp';

export async function GET() {
  // 현재 FMP 구독에서 사용 가능한 심볼
  const symbols = ['GCUSD', 'AAPL', 'NVDA', 'TSLA', 'META', 'MSFT', 'AMZN', 'SPY', 'QQQ'];
  const data = await getQuotes(symbols);

  // ISR 캐싱: 30초마다 revalidate (실시간 시세는 빠르게 갱신 필요)
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
