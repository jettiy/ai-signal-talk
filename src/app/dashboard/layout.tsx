import Link from 'next/link';
import { BarChart2, MessageSquare, Newspaper, Trophy, Settings } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { href: '/dashboard', icon: BarChart2, label: 'Dashboard' },
    { href: '/dashboard/chart', icon: BarChart2, label: 'Chart' },
    { href: '/dashboard/news', icon: Newspaper, label: 'News' },
    { href: '/dashboard/rank', icon: Trophy, label: 'Ranking' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col items-center gap-6 py-6 shrink-0"
        style={{
          width: 64,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo mark */}
        <div className="mb-2">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <path d="M4 26L12 14L20 20L30 6" stroke="#00FF41" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M24 6L30 6L30 12" stroke="#00FF41" strokeWidth="3.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Nav icons */}
        <nav className="flex flex-col items-center gap-4 flex-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              title={label}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all hover:scale-105"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Icon size={20} />
            </Link>
          ))}
        </nav>

        {/* Bottom spacer */}
        <div className="h-4" />
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 shrink-0"
          style={{ height: 56, borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">AI 시그널톡</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,65,0.1)', color: 'var(--accent-green)' }}>
              LIVE
            </span>
          </div>
          <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })} KST
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
