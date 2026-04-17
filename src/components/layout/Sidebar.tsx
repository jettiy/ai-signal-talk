'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  MessageCircle,
  Zap,
  Newspaper,
  Settings,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'community', label: '커뮤니티', icon: MessageCircle },
  { id: 'signal', label: 'AI 시그널', icon: Zap },
  { id: 'news', label: '뉴스룸', icon: Newspaper },
  { id: 'settings', label: '설정', icon: Settings },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]['id'];

interface SidebarProps {
  active: NavId;
  onNavigate: (id: NavId) => void;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside
      className="w-[72px] flex flex-col items-center py-5 gap-1 shrink-0"
      style={{ background: '#0A0A0F', borderRight: '1px solid #1A1A1A' }}
    >
      {/* 로고 */}
      <div className="mb-5">
        <Image
          src="/logo.png"
          alt="AI 시그널톡"
          width={40}
          height={40}
          className="rounded-lg"
          style={{ objectFit: 'contain' }}
        />
      </div>

      {/* 네비게이션 */}
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id as NavId)}
          className="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
          style={{
            background:
              active === id ? 'rgba(0,255,65,0.08)' : 'transparent',
            color: active === id ? '#00FF41' : '#555',
            border: `1px solid ${active === id ? 'rgba(0,255,65,0.2)' : 'transparent'}`,
          }}
          title={label}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[9px] font-bold">{label}</span>
        </button>
      ))}

      {/* 하단 로그아웃 */}
      <div className="mt-auto">
        <a
          href="/"
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
          style={{ color: '#444' }}
          title="로그아웃"
        >
          <LogOut className="w-4 h-4" />
        </a>
      </div>
    </aside>
  );
}
