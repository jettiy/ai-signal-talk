'use client';

import { useState } from 'react';
import Image from 'next/image';
import Sidebar, { type NavId } from '@/components/layout/Sidebar';
import TickerBar from '@/components/dashboard/TickerBar';
import StatusBar from '@/components/dashboard/StatusBar';
import CommunityPanel from '@/components/dashboard/CommunityPanel';
import SignalPanel from '@/components/dashboard/SignalPanel';
import NewsPanel from '@/components/dashboard/NewsPanel';
import ProPanel from '@/components/dashboard/ProPanel';
import AdminPanel from '@/components/dashboard/AdminPanel';
import type { UserRole } from '@/lib/types';

// TODO: 실제 인증 연동 후 서버에서 가져올 값
// 지금은 테스트용으로 변경 가능: 'BASIC' | 'PENDING' | 'PRO' | 'ADMIN'
const MOCK_USER_ROLE: UserRole = 'BASIC';
const MOCK_USER_NAME = '준석';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavId>('community');
  const userRole = MOCK_USER_ROLE;

  // ADMIN이면 기본 탭이 community, 4번째 탭은 admin
  // role에 따라 탭 제한
  const isValidTab = (tab: NavId): boolean => {
    if (tab === 'admin') return userRole === 'ADMIN';
    if (tab === 'pro') return userRole !== 'ADMIN';
    return true;
  };

  // 유효하지 않은 탭이면 community로
  const safeTab = isValidTab(activeTab) ? activeTab : 'community';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0D0D0D' }}>
      {/* 사이드바 */}
      <Sidebar active={safeTab} onNavigate={setActiveTab} userRole={userRole} />

      {/* 메인 영역 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 헤더 — PRO/관리자 전체화면 탭에서는 숨김 */}
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
            <span className="text-[10px] font-mono" style={{ color: '#555' }}>
              {new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' })} KST
            </span>
          </header>
        )}

        {/* 틱커바 — PRO/관리자 탭에서는 숨김 */}
        {safeTab !== 'pro' && safeTab !== 'admin' && <TickerBar />}

        {/* 탭 콘텐츠 */}
        <main className="flex-1 overflow-hidden">
          {safeTab === 'community' && <CommunityPanel />}
          {safeTab === 'signal' && <SignalPanel />}
          {safeTab === 'news' && <NewsPanel />}
          {safeTab === 'pro' && <ProPanel userRole={userRole} userName={MOCK_USER_NAME} />}
          {safeTab === 'admin' && userRole === 'ADMIN' && <AdminPanel />}
        </main>

        {/* 상태바 — PRO/관리자 탭에서는 숨김 */}
        {safeTab !== 'pro' && safeTab !== 'admin' && <StatusBar />}
      </div>
    </div>
  );
}
