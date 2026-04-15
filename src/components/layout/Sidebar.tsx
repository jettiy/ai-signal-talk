'use client';
import { useState } from 'react';
import { LayoutDashboard, LineChart, Newspaper, MessageCircle, Settings, TrendingUp } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'charts', label: '차트', icon: LineChart },
  { id: 'news', label: '뉴스', icon: Newspaper },
  { id: 'chat', label: '채팅', icon: MessageCircle },
  { id: 'settings', label: '설정', icon: Settings },
];

export default function Sidebar() {
  const [active, setActive] = useState('dashboard');

  return (
    <aside className="w-20 bg-[#0A0A0F] border-r border-[#1A1A1A] flex flex-col items-center py-6 gap-2 min-h-screen">
      {/* Logo */}
      <div className="mb-6 flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-lg">
        <TrendingUp className="text-green-400 w-5 h-5" />
      </div>

      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActive(id)}
          className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
            active === id
              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
          title={label}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[9px] font-medium">{label}</span>
        </button>
      ))}
    </aside>
  );
}