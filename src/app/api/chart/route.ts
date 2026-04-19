import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalChart } from '@/lib/fmp';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'GCUSD';
  const timeframe = searchParams.get('timeframe') || '30min';

  const data = await getHistoricalChart(symbol, timeframe);

  // ISR 캐싱: 1분마다 revalidate (차트 데이터는 상대적으로 덜 중요)
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
