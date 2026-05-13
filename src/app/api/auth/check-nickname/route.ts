import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

export async function GET(req: NextRequest) {
  const nickname = req.nextUrl.searchParams.get('nickname') ?? '';
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v2/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`,
      { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' }
    );

    let data: Record<string, unknown>;
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { detail: '백엔드 응답을 해석할 수 없습니다.' },
        { status: 502 }
      );
    }

    if (!res.ok) {
      const detail =
        typeof data.detail === 'string'
          ? data.detail
          : typeof data.error === 'string'
            ? data.error
            : '중복 확인에 실패했습니다.';
      return NextResponse.json({ detail }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ detail: '서버 연결에 실패했습니다.' }, { status: 500 });
  }
}
