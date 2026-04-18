import { NextResponse } from 'next/server';
import { getFearGreedIndex } from '@/lib/fmp';

// 서버 사이드 메모리 캐시 (24시간)
let cachedData: { value: unknown; timestamp: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

export async function GET() {
  // 캐시가 유효하면 반환
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedData.value);
  }

  const data = await getFearGreedIndex();

  // 캐시 업데이트
  cachedData = { value: data, timestamp: Date.now() };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
