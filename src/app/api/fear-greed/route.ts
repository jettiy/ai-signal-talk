import { NextRequest, NextResponse } from 'next/server';
import { getFearGreedIndex } from '@/lib/fmp';

export async function GET(req: NextRequest) {
  const data = await getFearGreedIndex();

  // ISR 캐싱: 5분마다 revalidate (Fear & Greed Index는 비교적 느리게 갱신됨)
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
