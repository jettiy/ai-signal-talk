'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  LineChart,
  Newspaper,
  Trophy,
  Settings,
  TrendingUp,
} from 'lucide-react';
import TickerBar from '@/components/dashboard/TickerBar';
import StatusBar from '@/components/dashboard/StatusBar';

const navItems = [
  { href: '/dashboard', icon: BarChart2, label: '대시보드' },
  { href: '/dashboard/chart', icon: LineChart, label: '차트' },
  { href: '/dashboard/news', icon: Newspaper, label: '뉴스' },
  { href: '/dashboard/rank', icon: Trophy, label: '랭킹' },
  { href: '/dashboard/settings', icon: Settings, label: '설정' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0D0D0D' }}>
      {/* 사이드바 */}
      <aside
        className="flex flex-col items-center gap-4 py-4 shrink-0"
        style={{
          width: 64,
          background: '#0A0A0F',
          borderRight: '1px solid #1A1A1A',
        }}
      >
        {/* 로고 */}
        <div
          className="mb-2 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0,255,65,0.08)' }}
        >
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
            <path
              d="M4 26L12 14L20 20L30 6"
              stroke="#00FF41"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M24 6L30 6L30 12"
              stroke="#00FF41"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* 네비게이션 아이콘 */}
        <nav className="flex flex-col items-center gap-2 flex-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                title={label}
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
                style={{
                  color: isActive ? '#00FF41' : '#555',
                  background: isActive ? 'rgba(0,255,65,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0,255,65,0.2)' : '1px solid transparent',
                }}
              >
                <Icon size={18} />
              </Link>
            );
          })}
        </nav>

        {/* 하단 로고마크 */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,255,65,0.05)' }}
        >
          <TrendingUp size={14} style={{ color: '#333' }} />
        </div>
      </aside>

      {/* 메인 영역 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 헤더 */}
        <header
          className="flex items-center justify-between px-5 shrink-0"
          style={{
            height: 48,
            background: '#0A0A0F',
            borderBottom: '1px solid #1A1A1A',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">AI 시그널톡</span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(0,255,65,0.1)',
                color: '#00FF41',
                border: '1px solid rgba(0,255,65,0.2)',
              }}
            >
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] font-mono"
              style={{ color: '#555' }}
            >
              {new Date().toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                hour: '2-digit',
                minute: '2-digit',
              })} KST
            </span>
          </div>
        </header>

        {/* 틱커바 */}
        <TickerBar />

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-hidden">{children}</main>

        {/* 상태바 */}
        <StatusBar />
      </div>
    </div>
  );
}
