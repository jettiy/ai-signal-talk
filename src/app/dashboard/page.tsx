'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  id?: string;
  email?: string;
  nickname?: string;
  level?: string;
  is_pro?: boolean;
}

function getRoleFromLevel(level?: string, isPro?: boolean): UserRole {
  if (level === 'LEVEL_99') return 'ADMIN';
  if (isPro || level === 'LEVEL_50') return 'PRO';
  return 'BASIC';
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavId>('community');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('BASIC');

  useEffect(() => {
    // localStorage에서 로그인 정보 복원
    try {
      const raw = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      if (raw && token) {
        const u = JSON.parse(raw) as UserInfo;
        setUser(u);
        setUserRole(getRoleFromLevel(u.level, u.is_pro));
      } else {
        // 로그인 안 되어 있으면 랜딩으로
        window.location.href = '/';
      }
    } catch {
      window.location.href = '/';
    }
  }, []);

  const isValidTab = (tab: NavId): boolean => {
    if (tab === 'admin') return userRole === 'ADMIN';
    if (tab === 'pro') return userRole !== 'ADMIN';
    return true;
  };

  const safeTab = isValidTab(activeTab) ? activeTab : 'community';
  const userName = user?.nickname || user?.email?.split('@')[0] || '트레이더';

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">로딩 중...</p>
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
              <Image src="/logo.png" alt="AI 시그널톡" width={80} height={26} style={{ objectFit: 'contain' }} />
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
                {new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' })} KST
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
            {safeTab === 'community' && <CommunityPanel />}
            {safeTab === 'signal' && <SignalPanel />}
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
