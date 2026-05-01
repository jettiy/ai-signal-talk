import { BACKEND_URL } from './backend';

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

export async function loginBackend(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '로그인에 실패했습니다.');
  }

  return res.json();
}

export async function registerBackend(
  email: string,
  password: string,
  nickname: string
): Promise<RegisterResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v2/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nickname }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '회원가입에 실패했습니다.');
  }

  return res.json();
}
