'use client';

import { useState } from 'react';
import Image from 'next/image';
import Sidebar, { type NavId } from '@/components/layout/Sidebar';
import TickerBar from '@/components/dashboard/TickerBar';
import StatusBar from '@/components/dashboard/StatusBar';
import CommunityPanel from '@/components/dashboard/CommunityPanel';
import SignalPanel from '@/components/dashboard/SignalPanel';
import NewsPanel from '@/components/dashboard/NewsPanel';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavId>('community');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0D0D0D' }}>
      {/* 사이드바 */}
      <Sidebar active={activeTab} onNavigate={setActiveTab} />

      {/* 메인 영역 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 헤더 */}
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

        {/* 틱커바 */}
        <TickerBar />

        {/* 3탭 콘텐츠 */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'community' && <CommunityPanel />}
          {activeTab === 'signal' && <SignalPanel />}
          {activeTab === 'news' && <NewsPanel />}
          {activeTab === 'settings' && <SettingsPlaceholder />}
        </main>

        {/* 상태바 */}
        <StatusBar />
      </div>
    </div>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-sm font-bold" style={{ color: '#555' }}>설정</p>
        <p className="text-xs mt-1" style={{ color: '#333' }}>곧 추가됩니다</p>
      </div>
    </div>
  );
}
