import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ai-signal-talk-backend.onrender.com';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력하세요.' },
        { status: 400 }
      );
    }

    // 백엔드는 OAuth2PasswordRequestForm = form-urlencoded 사용
    const formBody = new URLSearchParams();
    formBody.append('username', email);
    formBody.append('password', password);

    const res = await fetch(`${BACKEND_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: res.status }
      );
    }

    // 토큰만 있으면 사용자 정보를 /me에서 가져옴
    let user = null;
    if (data.access_token) {
      try {
        const meRes = await fetch(`${BACKEND_URL}/me`, {
          headers: { 'Authorization': `Bearer ${data.access_token}` },
        });
        if (meRes.ok) {
          user = await meRes.json();
        }
      } catch {
        // /me 실패해도 로그인은 진행
      }
    }

    return NextResponse.json({
      access_token: data.access_token,
      token_type: data.token_type || 'bearer',
      user: user ? {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        level: user.level,
        is_pro: user.is_pro,
      } : { email },
    });
  } catch {
    return NextResponse.json(
      { error: '서버 연결에 실패했습니다.' },
      { status: 500 }
    );
  }
}
