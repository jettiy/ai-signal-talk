import { NextRequest, NextResponse } from 'next/server';
import { generateAiSignal } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { symbol, price, changePct, news } = await req.json();
    const result = await generateAiSignal({ symbol, price, changePct, news });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'AI 분석 실패' }, { status: 500 });
  }
}