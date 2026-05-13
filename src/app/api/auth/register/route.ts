import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

export async function POST(req: NextRequest) {
  try {
    const { email, password, nickname } = await req.json();

    if (!email || !password || !nickname) {
      return NextResponse.json({ detail: '모든 필드를 입력해주세요.' }, { status: 400 });
    }

    // 이메일 형식 검증
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ detail: '올바른 이메일 형식을 입력해주세요.' }, { status: 400 });
    }

    // 비밀번호 검증
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { detail: '비밀번호는 영문+숫자 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 백엔드 v2: JSON body
    const res = await fetch(`${BACKEND_URL}/api/v2/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname }),
    });

    let data: Record<string, unknown>;
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { detail: '백엔드 응답을 해석할 수 없습니다. 서버 상태를 확인해주세요.' },
        { status: 502 }
      );
    }

    if (!res.ok) {
      const detail =
        typeof data.detail === 'string'
          ? data.detail
          : Array.isArray(data.detail)
            ? String((data.detail[0] as { msg?: string })?.msg ?? data.detail[0])
            : typeof data.error === 'string'
              ? data.error
              : '회원가입에 실패했습니다.';
      return NextResponse.json({ detail }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { detail: '서버 연결에 실패했습니다.' },
      { status: 500 }
    );
  }
}
