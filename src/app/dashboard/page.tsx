'use client';

import { useEffect, useState } from 'react';
import SignalChartLogo from '@/components/icons/SignalChartLogo';
import Sidebar, { type NavId } from '@/components/layout/Sidebar';
import TickerBar from '@/components/dashboard/TickerBar';
import StatusBar from '@/components/dashboard/StatusBar';
import CommunityPanel from '@/components/dashboard/CommunityPanel';
import SignalPanel from '@/components/dashboard/SignalPanel';
import NewsPanel from '@/components/dashboard/NewsPanel';
import ProPanel from '@/components/dashboard/ProPanel';
import AdminPanel from '@/components/dashboard/AdminPanel';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { UserRole } from '@/lib/types';

interface UserInfo {
  id?: string | number;
  email?: string;
  nickname?: string;
  level?: string;
  role?: string;
  is_pro?: boolean;
}

function getRole(user?: UserInfo | null): UserRole {
  if (!user) return 'BASIC';
  if (user.role === 'ADMIN' || user.level === 'LEVEL_99') return 'ADMIN';
  if (user.role === 'PRO' || user.is_pro || user.level === 'LEVEL_50') return 'PRO';
  return 'BASIC';
}

function clearSessionAndRedirect() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavId>('community');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('BASIC');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const raw = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');

        if (!raw || !token) {
          clearSessionAndRedirect();
          return;
        }

        const cachedUser = JSON.parse(raw) as UserInfo;
        setUser(cachedUser);
        setUserRole(getRole(cachedUser));

        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!res.ok) {
          clearSessionAndRedirect();
          return;
        }

        const verifiedUser = (await res.json()) as UserInfo;
        localStorage.setItem('user', JSON.stringify(verifiedUser));
        setUser(verifiedUser);
        setUserRole(getRole(verifiedUser));
      } catch {
        clearSessionAndRedirect();
      }
    };

    void restoreSession();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isValidTab = (tab: NavId): boolean => {
    if (tab === 'admin') return userRole === 'ADMIN';
    if (tab === 'pro') return userRole !== 'ADMIN';
    return true;
  };

  const safeTab = isValidTab(activeTab) ? activeTab : 'community';
  const userName = user?.nickname || user?.email?.split('@')[0] || '트레이더';

  const handleLogout = () => {
    clearSessionAndRedirect();
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0D0D0D' }}>
      <Sidebar active={safeTab} onNavigate={setActiveTab} userRole={userRole} />

      <div className="flex flex-col flex-1 overflow-hidden">
        {safeTab !== 'pro' && safeTab !== 'admin' && (
          <header
            className="flex items-center justify-between px-5 shrink-0"
            style={{ height: 48, background: '#0A0A0F', borderBottom: '1px solid #1A1A1A' }}
          >
            <div className="flex items-center gap-3">
              <SignalChartLogo iconSize={24} fontSize={18} showText />
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{ background: 'rgba(0,255,65,0.1)', color: '#00FF41', border: '1px solid rgba(0,255,65,0.2)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: '#00FF41' }} />
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{userName}</span>
              <span className="text-[10px] font-mono" style={{ color: '#555' }}>
                {now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit' })} KST
              </span>
              <button onClick={handleLogout} className="text-xs text-gray-600 hover:text-red-400 transition-colors">
                로그아웃
              </button>
            </div>
          </header>
        )}

        {safeTab !== 'pro' && safeTab !== 'admin' && <TickerBar />}

        <main className="flex-1 overflow-hidden">
          <ErrorBoundary>
            {safeTab === 'community' && <CommunityPanel userName={userName} />}
            {safeTab === 'signal' && <SignalPanel userRole={userRole} />}
            {safeTab === 'news' && <NewsPanel />}
            {safeTab === 'pro' && <ProPanel userRole={userRole} userName={userName} />}
            {safeTab === 'admin' && userRole === 'ADMIN' && <AdminPanel />}
          </ErrorBoundary>
        </main>

        {safeTab !== 'pro' && safeTab !== 'admin' && <StatusBar />}
      </div>
    </div>
  );
}
