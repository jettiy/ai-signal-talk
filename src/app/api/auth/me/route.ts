import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

const copy = {
  missingToken: '인증 토큰이 필요합니다.',
  serverFailed: '인증 서버 연결에 실패했습니다.',
};

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return NextResponse.json({ error: copy.missingToken }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v2/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || copy.missingToken },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: copy.serverFailed }, { status: 502 });
  }
}
