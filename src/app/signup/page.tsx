'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function SignupPage() {
  const [id, setId] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [idChecked, setIdChecked] = useState(false);
  const [nickChecked, setNickChecked] = useState(false);
  const [idError, setIdError] = useState('');
  const [nickError, setNickError] = useState('');
  const [pwError, setPwError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pw: string) => {
    if (pw.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (!/[a-zA-Z]/.test(pw)) return '비밀번호에 영문자가 포함되어야 합니다.';
    if (!/[0-9]/.test(pw)) return '비밀번호에 숫자가 포함되어야 합니다.';
    return '';
  };

  const handleIdCheck = () => {
    if (!id.trim()) { setIdError('아이디를 입력하세요.'); return; }
    if (id.length < 4) { setIdError('아이디는 4자 이상이어야 합니다.'); return; }
    setIdError('');
    setIdChecked(true);
  };

  const handleNickCheck = () => {
    if (!nickname.trim()) { setNickError('닉네임을 입력하세요.'); return; }
    if (nickname.length < 2) { setNickError('닉네임은 2자 이상이어야 합니다.'); return; }
    setNickError('');
    setNickChecked(true);
  };

  const handlePwChange = (v: string) => {
    setPassword(v);
    setPwError(validatePassword(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idChecked) { setIdError('아이디 중복확인을 해주세요.'); return; }
    if (!nickChecked) { setNickError('닉네임 중복확인을 해주세요.'); return; }
    const err = validatePassword(password);
    if (err) { setPwError(err); return; }
    if (!agreed) return;
    setLoading(true);
    // TODO: API call
    setTimeout(() => { setLoading(false); window.location.href = '/signup/success'; }, 1500);
  };

  const isValid = idChecked && nickChecked && password.length >= 8 && agreed && !pwError;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M4 26L12 14L20 20L30 6" stroke="#00FF41" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 6L30 6L30 12" stroke="#00FF41" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>
            <span className="text-2xl font-black text-white tracking-tight">AI 시그널톡</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>실시간 투자 시그널과 트레이더 커뮤니티</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <h1 className="text-xl font-bold text-white mb-1">회원가입</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>신규 계정을 생성하고 터미널에 접속하세요.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 아이디 */}
            <div>
              <label className="block text-xs font-medium mb-2 text-white">아이디</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>@</span>
                  <input
                    type="text"
                    value={id}
                    onChange={e => { setId(e.target.value); setIdChecked(false); setIdError(''); }}
                    placeholder="user_id"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-tertiary)', border: `1px solid ${idError ? 'var(--accent-red)' : 'var(--border)'}`, color: 'var(--text-primary)' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleIdCheck}
                  className="px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
                  style={{ background: idChecked ? 'var(--accent-green)' : 'var(--bg-tertiary)', color: idChecked ? '#000' : 'var(--text-secondary)', border: `1px solid ${idChecked ? 'var(--accent-green)' : 'var(--border)'}` }}
                >
                  {idChecked ? '✓ 확인' : '중복확인'}
                </button>
              </div>
              {idError && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{idError}</p>}
            </div>

            {/* 닉네임 */}
            <div>
              <label className="block text-xs font-medium mb-2 text-white">닉네임</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  </span>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => { setNickname(e.target.value); setNickChecked(false); setNickError(''); }}
                    placeholder="Trader_X"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-tertiary)', border: `1px solid ${nickError ? 'var(--accent-red)' : 'var(--border)'}`, color: 'var(--text-primary)' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleNickCheck}
                  className="px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
                  style={{ background: nickChecked ? 'var(--accent-green)' : 'var(--bg-tertiary)', color: nickChecked ? '#000' : 'var(--text-secondary)', border: `1px solid ${nickChecked ? 'var(--accent-green)' : 'var(--border)'}` }}
                >
                  {nickChecked ? '✓ 확인' : '중복확인'}
                </button>
              </div>
              {nickError && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{nickError}</p>}
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
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              {/* 비밀번호 강도 */}
              {password && (
                <div className="mt-2 flex gap-1">
                  {['length', 'alpha', 'num'].map((rule, i) => {
                    const ok = rule === 'length' ? password.length >= 8
                      : rule === 'alpha' ? /[a-zA-Z]/.test(password)
                      : /[0-9]/.test(password);
                    return (
                      <div key={rule} className="flex items-center gap-1 text-xs" style={{ color: ok ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                        <span>{ok ? '✓' : '○'}</span>
                      </div>
                    );
                  })}
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
          <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>🛡️ ENCRYPTED</span>
          <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>☁️ SYSTEM STABLE</span>
        </div>
      </div>
    </div>
  );
}
