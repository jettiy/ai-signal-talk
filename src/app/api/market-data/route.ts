import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/fmp';

export async function GET() {
  // 선물 + 주식 주요 심볼
  const symbols = ['GCUSD', 'CLUSD', 'NQUSD', 'AAPL', 'NVDA', 'TSLA', 'META', 'SPY', 'QQQ'];
  const data = await getQuotes(symbols);
  return NextResponse.json(data);
}
