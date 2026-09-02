import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v2/quotes`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json([], { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('[ticker-quotes] 백엔드 시세 fetch 실패:', error);
    return NextResponse.json([], { status: 502 });
  }
}
