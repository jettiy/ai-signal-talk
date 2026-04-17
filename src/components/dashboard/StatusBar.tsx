'use client';

import { Shield, Wifi, Lock, Activity } from 'lucide-react';

export default function StatusBar() {
  const now = new Date();
  const latency = '12ms';
  const uptime = '99.97%';

  return (
    <div
      className="flex items-center justify-between px-4 shrink-0"
      style={{
        height: 28,
        background: '#0A0A0F',
        borderTop: '1px solid #1A1A1A',
      }}
    >
      {/* 좌측: 시스템 상태 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full pulse-live"
            style={{ background: '#00FF41' }}
          />
          <span className="text-[10px] font-semibold" style={{ color: '#00FF41' }}>
            SYSTEM ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Wifi size={10} style={{ color: '#A0A0A0' }} />
          <span className="text-[10px] font-mono" style={{ color: '#A0A0A0' }}>
            STABLE
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Activity size={10} style={{ color: '#A0A0A0' }} />
          <span className="text-[10px] font-mono" style={{ color: '#A0A0A0' }}>
            {latency}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Shield size={10} style={{ color: '#A0A0A0' }} />
          <span className="text-[10px] font-mono" style={{ color: '#A0A0A0' }}>
            {uptime}
          </span>
        </div>
      </div>

      {/* 우측: 보안 + 시간 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Lock size={10} style={{ color: '#00FF41' }} />
          <span className="text-[10px] font-mono" style={{ color: '#00FF41' }}>
            AES-256
          </span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: '#555' }}>
          {now.toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })} KST
        </span>
      </div>
    </div>
  );
}
