'use client';

import { Crown } from 'lucide-react';
import type { UserRole } from '@/lib/types';

interface UserBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { text: 'text-[9px]', px: 'px-1.5', py: 'py-0.5', icon: 8, gap: 'gap-0.5' },
  md: { text: 'text-[10px]', px: 'px-2', py: 'py-0.5', icon: 10, gap: 'gap-1' },
  lg: { text: 'text-[11px]', px: 'px-2.5', py: 'py-1', icon: 12, gap: 'gap-1' },
};

const ROLE_CONFIG: Record<UserRole, {
  label: string;
  color: string;
  bg: string;
  border?: string;
  glow?: string;
  dashed?: boolean;
  icon?: 'crown';
}> = {
  BASIC: {
    label: 'BASIC',
    color: '#555',
    bg: 'rgba(85,85,85,0.1)',
  },
  PENDING: {
    label: '승인 대기',
    color: '#888',
    bg: 'transparent',
    border: '#555',
    dashed: true,
  },
  PRO: {
    label: 'PRO',
    color: '#00FF41',
    bg: 'rgba(0,255,65,0.1)',
    glow: '0 0 8px rgba(0,255,65,0.4)',
  },
  ADMIN: {
    label: 'ADMIN',
    color: '#FFD700',
    bg: 'rgba(255,215,0,0.1)',
    glow: '0 0 8px rgba(255,215,0,0.4)',
    icon: 'crown',
  },
};

export default function UserBadge({ role, size = 'md' }: UserBadgeProps) {
  const cfg = ROLE_CONFIG[role];
  const s = SIZE_MAP[size];

  return (
    <span
      className={`inline-flex items-center ${s.gap} ${s.text} ${s.px} ${s.py} rounded-full font-bold whitespace-nowrap`}
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: cfg.dashed
          ? `1.5px dashed ${cfg.border || '#555'}`
          : cfg.border
            ? `1px solid ${cfg.border}`
            : 'none',
        boxShadow: cfg.glow || 'none',
      }}
    >
      {cfg.icon === 'crown' && <Crown size={s.icon} />}
      {cfg.label}
    </span>
  );
}
