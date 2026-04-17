import { NextResponse } from 'next/server';
import { getFearGreedIndex } from '@/lib/fmp';

export async function GET() {
  const data = await getFearGreedIndex();
  return NextResponse.json(data);
}
