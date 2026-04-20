import { NextRequest, NextResponse } from 'next/server';

const BACKEND = 'https://ai-signal-talk-backend.onrender.com';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '20';
  const search = searchParams.get('search') || '';

  const params = new URLSearchParams({ page, limit });
  if (search) params.set('search', search);

  try {
    const res = await fetch(`${BACKEND}/api/v2/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: '백엔드 연결 실패' }, { status: 502 });
  }
}
