import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/fmp';

export async function GET() {
  // 현재 FMP 구독에서 사용 가능한 심볼
  const symbols = ['GCUSD', 'AAPL', 'NVDA', 'TSLA', 'META', 'MSFT', 'AMZN', 'SPY', 'QQQ'];
  const data = await getQuotes(symbols);
  return NextResponse.json(data);
}
