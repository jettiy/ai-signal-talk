'use client';

import { useState } from 'react';
import SignalChartLogo from '@/components/icons/SignalChartLogo';
import Link from 'next/link';

export default function LandingPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력하세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: id, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      // JWT 토큰 저장
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 대시보드로 이동
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-sm px-6">
        {/* 로고 */}
        <div className="flex justify-center mb-10">
          <SignalChartLogo size={186} showText />
        </div>

        {/* 로그인 카드 */}
        <div className="card p-8">
          <h1 className="text-xl font-bold text-white text-center mb-1">
            터미널 접속
          </h1>
          <p
            className="text-sm text-center mb-8"
            style={{ color: 'var(--text-secondary)' }}
          >
            계정 정보를 입력하여 접속하세요
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(255, 59, 59, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2 text-white">
                이메일
              </label>
              <input
                type="email"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="name@example.com"
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 text-white">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                required
                className="input"
              />
            </div>

            <button type="submit" className="btn-green" disabled={loading}>
              {loading ? '접속 중...' : '접속하기'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              계정이 없으신가요?{' '}
            </span>
            <Link
              href="/signup"
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--accent-green)' }}
            >
              회원가입
            </Link>
          </div>
        </div>

        {/* 하단 안내 */}
        <div
          className="mt-8 flex items-center justify-center gap-4 text-xs"
          style={{ color: '#444' }}
        >
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full pulse-live"
              style={{ background: 'var(--accent-green)' }}
            />
            SYSTEM ACTIVE
          </span>
          <span>ENCRYPTION: AES-256</span>
        </div>
      </div>
    </div>
  );
}
