import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalChart } from '@/lib/fmp';

// FMP 선물 심볼 + 기존 주식 심볼 화이트리스트
const ALLOWED_SYMBOLS = [
  // 선물 (FMP stable API)
  'GCUSD', 'CLUSD', 'NQUSD',
  // 주식
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'INTC',
  // ETF
  'SPY', 'QQQ', 'DIA', 'IWM', 'GLD', 'SLV', 'USO',
  // Yahoo 스타일 심볼 (하위호환)
  'CL=F', 'NG=F', 'BZ=F',
];

const ALLOWED_INTERVALS = ['1min', '5min', '15min', '30min', '1hour', '4hour', '1day'];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get('symbol') || 'GCUSD';
  const timeframe = searchParams.get('timeframe') || '5min';

  if (!ALLOWED_SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
  }
  if (!ALLOWED_INTERVALS.includes(timeframe)) {
    return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 });
  }

  const data = await getHistoricalChart(symbol, timeframe);
  return NextResponse.json(data);
}
