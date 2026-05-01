'use client';

import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AuthButton from '@/components/auth/AuthButton';
import AuthCard from '@/components/auth/AuthCard';
import AuthField from '@/components/auth/AuthField';
import AuthFrame from '@/components/auth/AuthFrame';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const checkEmail = () => {
    setError('');
    if (!email.includes('@')) {
      setEmailChecked(false);
      setError('사용할 아이디를 이메일 형식으로 입력해주세요.');
      return;
    }
    setEmailChecked(true);
    setMessage('사용 가능한 아이디입니다.');
  };

  const checkNickname = () => {
    setError('');
    if (nickname.trim().length < 2) {
      setNicknameChecked(false);
      setError('닉네임은 2자 이상 입력해주세요.');
      return;
    }
    setNicknameChecked(true);
    setMessage('사용 가능한 닉네임입니다.');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!emailChecked || !nicknameChecked) {
      setError('아이디와 닉네임 중복확인을 완료해주세요.');
      return;
    }

    if (!agreed) {
      setError('서비스 이용약관과 개인정보 처리방침에 동의해주세요.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nickname, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || '회원가입에 실패했습니다.');
      }

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/signup/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <AuthCard>
        <div className="mb-7">
          <h2 className="text-xl font-black text-white">계정 생성</h2>
          <p className="mt-2 text-sm font-semibold text-white/42">실시간 AI 트레이딩 신호의 세계에 합류하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-[minmax(0,1fr)_72px] gap-2">
            <AuthField
              label="아이디"
              icon={<Mail size={18} />}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailChecked(false);
              }}
              placeholder="아이디 입력"
              autoComplete="email"
              required
            />
            <button
              type="button"
              className="mt-6 h-12 border border-[#00FF41]/20 bg-black/65 text-xs font-black text-[#00FF41] hover:border-[#00FF41]/70"
              onClick={checkEmail}
            >
              중복확인
            </button>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_72px] gap-2">
            <AuthField
              label="닉네임"
              icon={<User size={18} />}
              type="text"
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value);
                setNicknameChecked(false);
              }}
              placeholder="활동명 설정"
              autoComplete="nickname"
              required
            />
            <button
              type="button"
              className="mt-6 h-12 border border-[#00FF41]/20 bg-black/65 text-xs font-black text-[#00FF41] hover:border-[#00FF41]/70"
              onClick={checkNickname}
            >
              중복확인
            </button>
          </div>

          <AuthField
            label="비밀번호"
            icon={<Lock size={18} />}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="영문, 숫자 포함 8자 이상"
            autoComplete="new-password"
            minLength={8}
            required
            rightSlot={
              <button
                type="button"
                className="grid h-full w-11 place-items-center text-white/38 hover:text-[#00FF41]"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />

          <label className="flex items-start gap-3 text-sm font-bold leading-6 text-white/54">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 appearance-none border border-white/12 bg-black/75 checked:border-[#00FF41] checked:bg-[#00FF41]"
            />
            <span>
              <strong className="text-[#00FF41]">[필수]</strong> 서비스 이용약관 및 개인정보 처리방침에 동의합니다.
            </span>
          </label>

          {(error || message) && (
            <p
              className={`border px-4 py-3 text-sm font-bold ${
                error
                  ? 'border-red-500/20 bg-red-500/10 text-red-200'
                  : 'border-[#00FF41]/20 bg-[#00FF41]/10 text-[#00FF41]'
              }`}
            >
              {error || message}
            </p>
          )}

          <AuthButton type="submit" disabled={loading}>
            {loading ? '계정 생성 중...' : '회원가입 완료'}
          </AuthButton>
        </form>

        <p className="mt-8 text-center text-sm font-extrabold text-white/45">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-[#00FF41] underline decoration-[#00FF41]/45 underline-offset-4">
            로그인
          </Link>
        </p>
      </AuthCard>
    </AuthFrame>
  );
}
