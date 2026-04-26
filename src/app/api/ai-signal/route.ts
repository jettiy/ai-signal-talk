import { NextRequest, NextResponse } from 'next/server';
import { generateSignal } from '@/lib/ai';
import { searchFinancialNews } from '@/lib/zai-web-search';
import { FUTURES_SYMBOLS } from '@/lib/types';

// 메모리 기반 일일 카운터
const dailyCounts = new Map<string, { date: string; count: number }>();
const DAILY_LIMIT = 10;

function checkDailyLimit(ip: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const entry = dailyCounts.get(ip);
  if (!entry || entry.date !== today) {
    dailyCounts.set(ip, { date: today, count: 0 });
  }
  const current = dailyCounts.get(ip)!;
  current.count++;
  return { allowed: current.count <= DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - current.count) };
}

export async function POST(req: NextRequest) {
  // IP 체크
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { allowed, remaining } = checkDailyLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: '일일 요청 횟수 제한 초과', remaining },
      { status: 429 }
    );
  }

  try {
    const { symbol, price, changePct, news, timeframe } = await req.json();

    // Twelve Data 기술적 지표 조회
    let indicators = null;
    try {
      const tf = timeframe || '15min';
      const indicatorRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/indicators?symbol=${symbol}&timeframe=${tf}`
      );
      if (indicatorRes.ok) indicators = await indicatorRes.json();
    } catch {}

    // Z.AI 웹검색으로 뉴스 보강
    let webSearchResults: import('@/lib/types').WebSearchResult[] = [];
    try {
      const label = Object.values(FUTURES_SYMBOLS).find(
        (f) => f.symbol === symbol
      )?.label || symbol;
      webSearchResults = await searchFinancialNews(symbol, label);
    } catch {
      // 웹검색 실패해도 시그널 생성은 진행
    }

    const result = await generateSignal(
      symbol,
      price,
      news || [],
      changePct || 0,
      timeframe || '1hour',
      webSearchResults,
      indicators,
    );

    return NextResponse.json({ ...result, remaining });
  } catch (e) {
    return NextResponse.json({ error: 'AI 분석 실패' }, { status: 500 });
  }
}
