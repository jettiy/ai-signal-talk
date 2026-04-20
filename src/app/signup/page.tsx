'use client';
import SignalChartLogo from '@/components/icons/SignalChartLogo';
import Link from 'next/link';
import { useState } from 'react';

export default function SignupPage() {
  const [id, setId] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [pwError, setPwError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pw: string) => {
    if (pw.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (!/[a-zA-Z]/.test(pw)) return '비밀번호에 영문자가 포함되어야 합니다.';
    if (!/[0-9]/.test(pw)) return '비밀번호에 숫자가 포함되어야 합니다.';
    return '';
  };

  const handlePwChange = (v: string) => {
    setPassword(v);
    setPwError(validatePassword(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!id.trim()) { setError('이메일을 입력해주세요.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) { setError('올바른 이메일 형식을 입력해주세요.'); return; }
    if (!nickname.trim()) { setError('닉네임을 입력해주세요.'); return; }
    const err = validatePassword(password);
    if (err) { setPwError(err); return; }
    if (!agreed) { setError('이용약관에 동의해주세요.'); return; }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: id, password, nickname }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.');
      }

      // 성공 → success 페이지로 이동
      window.location.href = '/signup/success';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const isValid = id.trim() && nickname.trim() && password.length >= 8 && agreed && !pwError;

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
          <h1 className="text-xl font-bold text-white mb-1">회원가입</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>신규 계정을 생성하고 터미널에 접속하세요.</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(255, 59, 59, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 */}
            <div>
              <label className="block text-xs font-medium mb-2 text-white">이메일</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>@</span>
                <input
                  type="email"
                  value={id}
                  onChange={e => { setId(e.target.value); setError(''); }}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* 닉네임 */}
            <div>
              <label className="block text-xs font-medium mb-2 text-white">닉네임</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => { setNickname(e.target.value); setError(''); }}
                  placeholder="Trader_X"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-xs font-medium mb-2 text-white">비밀번호</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => handlePwChange(e.target.value)}
                  placeholder="영문+숫자 8자 이상"
                  className="w-full pl-9 pr-12 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-tertiary)', border: `1px solid ${pwError && password ? 'var(--accent-red)' : 'var(--border)'}`, color: 'var(--text-primary)' }}
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
              {/* 비밀번호 규칙 인디케이터 */}
              {password && (
                <div className="mt-2 flex gap-3">
                  <div className="flex items-center gap-1 text-xs" style={{ color: password.length >= 8 ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    <span style={{ color: password.length >= 8 ? '#00FF41' : '#555' }}>●</span> 8자 이상
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: /[a-zA-Z]/.test(password) ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    <span style={{ color: /[a-zA-Z]/.test(password) ? '#00FF41' : '#555' }}>●</span> 영문
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: /[0-9]/.test(password) ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    <span style={{ color: /[0-9]/.test(password) ? '#00FF41' : '#555' }}>●</span> 숫자
                  </div>
                </div>
              )}
              {pwError && password && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{pwError}</p>}
            </div>

            {/* 약관 동의 */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#00FF41] cursor-pointer"
                />
                <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <a href="#" className="underline" style={{ color: 'var(--accent-green)' }}>이용약관</a> 및{' '}
                  <a href="#" className="underline" style={{ color: 'var(--accent-green)' }}>개인정보처리방침</a>에 동의합니다.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
              style={{ background: 'var(--accent-green)', color: '#000' }}
            >
              {loading ? '처리 중...' : '회원가입 완료'}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>이미 계정이 있으시면? </span>
            <Link href="/login" className="text-sm font-semibold hover:underline" style={{ color: 'var(--accent-green)' }}>
              로그인
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>🔒 ENCRYPTED</span>
          <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>🟢 SYSTEM STABLE</span>
        </div>
      </div>
    </div>
  );
}
