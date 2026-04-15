import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/fmp';

export async function GET() {
  const symbols = ['AAPL','NVDA','TSLA','META','SPY','QQQ','GLD','CL=F'];
  const data = await getQuotes(symbols);
  return NextResponse.json(data);
}