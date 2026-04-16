import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalChart } from '@/lib/fmp';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get('symbol') || 'AAPL';
  const timeframe = searchParams.get('timeframe') || '30min';

  // 허용된 심볼 화이트리스트 검증
  const allowedSymbols = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'INTC',
    'SPY', 'QQQ', 'DIA', 'IWM', 'GLD', 'SLV', 'USO', 'CL=F', 'NG=F', 'BZ=F',
  ];
  if (!allowedSymbols.includes(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
  }

  const data = await getHistoricalChart(symbol, timeframe);
  return NextResponse.json(data);
}
