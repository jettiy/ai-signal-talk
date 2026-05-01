'use client';

import { Check, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthButton from '@/components/auth/AuthButton';
import AuthCard from '@/components/auth/AuthCard';
import AuthFrame from '@/components/auth/AuthFrame';

interface StoredUser {
  email?: string;
  nickname?: string;
  created_at?: string;
}

export default function SignupSuccessPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser>({});

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;

    try {
      setUser(JSON.parse(stored));
    } catch {
      setUser({});
    }
  }, []);

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ko-KR')
    : new Date().toLocaleDateString('ko-KR');

  return (
    <AuthFrame>
      <AuthCard className="text-center">
        <div className="mx-auto grid h-[72px] w-[72px] place-items-center border border-[#00FF41]/25 bg-black/55 shadow-[0_0_34px_rgba(0,255,65,0.24)]">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#00FF41] text-[#102015]">
            <Check size={25} strokeWidth={4} />
          </div>
        </div>

        <h2 className="mt-7 text-2xl font-black text-[#00FF41]">회원가입 완료</h2>
        <p className="mt-4 text-sm font-semibold leading-6 text-white/48">
          회원가입이 성공적으로 완료되었습니다.
          <br />
          이제 모든 서비스를 이용하실 수 있습니다.
        </p>

        <div className="my-9 border border-white/[0.06] bg-black/78 p-5 text-left">
          <div className="mb-4 flex items-center justify-between text-[11px] font-black uppercase tracking-normal text-[#00FF41]">
            <span>Operator Identity</span>
            <span className="text-white/30">Date Joined</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-white/10 text-white/48">
                <User size={20} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-white">{user.nickname || 'OPERATOR_X72'}</p>
                <p className="truncate text-[11px] font-extrabold uppercase text-white/35">
                  {user.email || 'LEVEL_01 VERIFIED'}
                </p>
              </div>
            </div>
            <p className="shrink-0 text-sm font-black text-white/78">{joinedDate}</p>
          </div>
        </div>

        <AuthButton type="button" onClick={() => router.push('/dashboard')}>
          메인화면으로 이동
        </AuthButton>
      </AuthCard>
    </AuthFrame>
  );
}
