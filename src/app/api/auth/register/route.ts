import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ai-signal-talk-backend.onrender.com';

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: '모든 필드를 입력하세요.' },
        { status: 400 }
      );
    }

    // 백엔드가 nickname 필드를 기대
    const res = await fetch(`${BACKEND_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname: full_name }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || '회원가입에 실패했습니다.' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: '서버 연결에 실패했습니다.' },
      { status: 500 }
    );
  }
}
