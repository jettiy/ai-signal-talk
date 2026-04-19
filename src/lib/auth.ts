// SERVER ONLY — do not import from client components

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ai-signal-talk-backend.onrender.com';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

/**
 * 백엔드 로그인 API 호출
 */
export async function loginBackend(email: string, password: string): Promise<LoginResponse> {
  const params = new URLSearchParams({ email, password });
  const res = await fetch(`${BACKEND_URL}/api/auth/login?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '로그인에 실패했습니다.');
  }

  return res.json();
}

/**
 * 백엔드 회원가입 API 호출
 */
export async function registerBackend(
  email: string,
  password: string,
  full_name: string
): Promise<RegisterResponse> {
  const params = new URLSearchParams({ email, password, full_name });
  const res = await fetch(`${BACKEND_URL}/api/users/register?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '회원가입에 실패했습니다.');
  }

  return res.json();
}
