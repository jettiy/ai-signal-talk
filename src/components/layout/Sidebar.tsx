'use client';

import SignalChartLogo from '@/components/icons/SignalChartLogo';
import {
  MessageCircle,
  Zap,
  Newspaper,
  Crown,
  Shield,
  LogOut,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

export type NavId = 'community' | 'signal' | 'news' | 'pro' | 'admin';

interface SidebarProps {
  active: NavId;
  onNavigate: (id: NavId) => void;
  userRole: UserRole;
}

function getNavItems(role: UserRole) {
  const base = [
    { id: 'community' as NavId, label: '커뮤니티', icon: MessageCircle },
    { id: 'signal' as NavId, label: 'AI 시그널', icon: Zap },
    { id: 'news' as NavId, label: '뉴스룸', icon: Newspaper },
  ];

  // role별 4번째 탭 결정
  if (role === 'ADMIN') {
    return [...base, { id: 'admin' as NavId, label: '관리자', icon: Shield }];
  }
  if (role === 'PRO') {
    return [...base, { id: 'pro' as NavId, label: 'PRO', icon: Crown }];
  }
  // BASIC, PENDING 모두 PRO 전환 탭
  return [...base, { id: 'pro' as NavId, label: 'PRO 전환', icon: Crown }];
}

export default function Sidebar({ active, onNavigate, userRole }: SidebarProps) {
  const navItems = getNavItems(userRole);

  return (
    <aside
      className="w-[72px] flex flex-col items-center py-5 gap-1 shrink-0"
      style={{ background: '#0A0A0F', borderRight: '1px solid #1A1A1A' }}
    >
      {/* 로고 */}
      <div className="mb-5">
        <SignalChartLogo size={40} />
      </div>

      {/* 네비게이션 */}
      {navItems.map(({ id, label, icon: Icon }) => {
        const isSpecialTab = id === 'pro' || id === 'admin';
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            style={{
              background:
                active === id
                  ? id === 'admin'
                    ? 'rgba(0,255,65,0.15)'
                    : isSpecialTab
                      ? 'rgba(0,255,65,0.12)'
                      : 'rgba(0,255,65,0.08)'
                  : 'transparent',
              color: active === id
                ? '#00FF41'
                : isSpecialTab
                  ? '#00FF41'
                  : '#555',
              border: `1px solid ${
                active === id
                  ? 'rgba(0,255,65,0.2)'
                  : isSpecialTab
                    ? 'rgba(0,255,65,0.1)'
                    : 'transparent'
              }`,
            }}
            title={label}
          >
            <Icon className="w-5 h-5" />
            <span className={`text-[9px] font-bold ${isSpecialTab ? 'tracking-wide' : ''}`}>
              {label}
            </span>
          </button>
        );
      })}

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
