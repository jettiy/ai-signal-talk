import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });

  try {
    const res = await fetch(`${BACKEND_URL}/api/v2/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: '백엔드 연결 실패' }, { status: 502 });
  }
}
