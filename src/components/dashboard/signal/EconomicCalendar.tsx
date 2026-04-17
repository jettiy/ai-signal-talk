'use client';

import { Calendar, Clock, AlertTriangle } from 'lucide-react';

// ── 오늘 발표 일정 ────────────────────────────────────────────
const TODAY_EVENTS = [
  { time: '22:30', event: '실업수당청구', impact: 'high' as const, forecast: '220K', previous: '228K' },
  { time: '22:30', event: '필라델피아 Fed', impact: 'medium' as const, forecast: '-2.5', previous: '12.5' },
  { time: '23:00', event: 'ISM 제조업 PMI', impact: 'high' as const, forecast: '49.8', previous: '50.3' },
  { time: '23:00', event: 'JOLTS 채용공고', impact: 'medium' as const, forecast: '8.80M', previous: '8.76M' },
  { time: '01:00', event: 'FOMC 의사록', impact: 'high' as const, forecast: '-', previous: '-' },
];

// ── 이번주 주요 일정 ──────────────────────────────────────────
const WEEK_EVENTS = [
  { day: '월', date: '04/14', event: '소매매출', impact: 'high' as const, forecast: '+0.3%', previous: '+0.2%' },
  { day: '화', date: '04/15', event: '산업생산', impact: 'medium' as const, forecast: '+0.2%', previous: '+0.1%' },
  { day: '수', date: '04/16', event: '주택착공', impact: 'medium' as const, forecast: '1.38M', previous: '1.36M' },
  { day: '목', date: '04/17', event: '실업수당청구', impact: 'high' as const, forecast: '220K', previous: '228K' },
  { day: '금', date: '04/18', event: '비농업고용지표', impact: 'high' as const, forecast: '165K', previous: '151K' },
];

const IMPACT_STYLE = {
  high: { color: '#FF3B3B', bg: 'rgba(255,59,59,0.08)', dot: '#FF3B3B' },
  medium: { color: '#FFD700', bg: 'rgba(255,215,0,0.08)', dot: '#FFD700' },
  low: { color: '#555', bg: 'rgba(85,85,85,0.08)', dot: '#555' },
};

export default function EconomicCalendar() {
  return (
    <div
      className="shrink-0"
      style={{ borderTop: '1px solid #1A1A1A', background: '#0A0A0F' }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-2">
        <Calendar size={11} style={{ color: '#FFD700' }} />
        <span className="text-[10px] font-bold" style={{ color: '#FFD700' }}>주요 경제지표 일정</span>
        <span className="text-[9px] ml-auto" style={{ color: '#444' }}>미국 | KST 기준</span>
      </div>

      {/* 두 섹션: 오늘 발표 / 이번주 */}
      <div className="flex gap-3 px-4 pb-3">
        {/* 오늘 발표 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={9} style={{ color: '#FF3B3B' }} />
            <span className="text-[10px] font-bold" style={{ color: '#FF3B3B' }}>오늘 발표</span>
          </div>
          <div className="space-y-1">
            {TODAY_EVENTS.map((evt) => {
              const imp = IMPACT_STYLE[evt.impact];
              return (
                <div
                  key={evt.time + evt.event}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
                  style={{ background: '#111118' }}
                >
                  <span className="text-[9px] font-bold font-mono shrink-0" style={{ color: '#555' }}>{evt.time}</span>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: imp.dot }} />
                  <span className="text-[10px] font-semibold text-white truncate">{evt.event}</span>
                  <span className="text-[9px] ml-auto shrink-0 font-mono" style={{ color: '#444' }}>
                    {evt.forecast !== '-' ? `예상 ${evt.forecast}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ width: '1px', background: '#1A1A1A' }} />

        {/* 이번주 주요 일정 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={9} style={{ color: '#00B4D8' }} />
            <span className="text-[10px] font-bold" style={{ color: '#00B4D8' }}>이번주 주요 일정</span>
          </div>
          <div className="space-y-1">
            {WEEK_EVENTS.map((evt) => {
              const imp = IMPACT_STYLE[evt.impact];
              return (
                <div
                  key={evt.day + evt.event}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
                  style={{ background: '#111118' }}
                >
                  <span
                    className="text-[9px] font-bold shrink-0 w-7 text-center rounded px-1"
                    style={{ color: '#555', background: '#0A0A0F' }}
                  >
                    {evt.day}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: imp.dot }} />
                  <span className="text-[10px] font-semibold text-white truncate">{evt.event}</span>
                  <span className="text-[9px] ml-auto shrink-0 font-mono" style={{ color: '#444' }}>
                    {evt.forecast}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
