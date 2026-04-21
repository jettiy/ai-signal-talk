'use client';
import SignalChartLogo from '@/components/icons/SignalChartLogo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력하세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      // JWT 토큰 저장
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 대시보드로 이동
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <SignalChartLogo iconSize={44} fontSize={26} showText className="justify-center mb-3" />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>실시간 투자 시그널과 트레이더 커뮤니티</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <h1 className="text-xl font-bold text-white mb-1">로그인</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>계정 정보를 입력하여 터미널에 접속하세요.</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(255, 59, 59, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2 text-white">이메일</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>@</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2 text-white">비밀번호</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="password"
                  className="w-full pl-9 pr-12 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {showPw ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 accent-[#00FF41]" />
              <label htmlFor="remember" className="text-sm" style={{ color: 'var(--text-secondary)' }}>로그인 상태 유지</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--accent-green)', color: '#000' }}
            >
              {loading ? '접속 중...' : '터미널 접속하기'}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="flex items-center justify-between mt-4">
            <Link href="/signup" className="text-sm hover:underline" style={{ color: 'var(--accent-green)' }}>
              신규 회원가입
            </Link>
            <a href="#" className="text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>
              아이디/비밀번호 찾기
            </a>
          </div>
        </div>

        {/* Footer Status */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            ENCRYPTED
          </span>
          <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            SYSTEM STABLE
          </span>
        </div>
      </div>
    </div>
  );
}
