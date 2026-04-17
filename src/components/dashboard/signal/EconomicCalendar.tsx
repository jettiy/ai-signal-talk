'use client';

import { Calendar, Clock } from 'lucide-react';

// 미국 주요 경제지표 일정만
const MOCK_EVENTS = [
  { time: '22:30', event: '실업수당청구', impact: 'high' as const, forecast: '220K', previous: '228K' },
  { time: '22:30', event: '필라델피아 Fed', impact: 'medium' as const, forecast: '-2.5', previous: '12.5' },
  { time: '23:00', event: 'ISM 제조업 PMI', impact: 'high' as const, forecast: '49.8', previous: '50.3' },
  { time: '23:00', event: 'JOLTS 채용공고', impact: 'medium' as const, forecast: '8.80M', previous: '8.76M' },
  { time: '01:00', event: 'FOMC 의사록', impact: 'high' as const, forecast: '-', previous: '-' },
  { time: '22:30', event: '비농업고용지표', impact: 'high' as const, forecast: '165K', previous: '151K' },
  { time: '23:00', event: '소비자신뢰지수', impact: 'medium' as const, forecast: '94.0', previous: '93.1' },
  { time: '23:30', event: 'EIA 원유재고', impact: 'medium' as const, forecast: '-1.2M', previous: '+0.8M' },
];

const IMPACT_STYLE = {
  high: { color: '#FF3B3B', bg: 'rgba(255,59,59,0.08)', label: '높음' },
  medium: { color: '#FFD700', bg: 'rgba(255,215,0,0.08)', label: '보통' },
  low: { color: '#555', bg: 'rgba(85,85,85,0.08)', label: '낮음' },
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
        <span className="text-[10px] font-bold" style={{ color: '#FFD700' }}>미국 주요 경제지표</span>
        <span className="text-[9px] ml-auto" style={{ color: '#444' }}>KST 기준</span>
      </div>

      {/* 이벤트 가로 스크롤 */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {MOCK_EVENTS.map((evt) => {
          const imp = IMPACT_STYLE[evt.impact];
          return (
            <div
              key={evt.time + evt.event}
              className="rounded-lg p-2.5 shrink-0 min-w-[155px]"
              style={{ background: '#111118', border: `1px solid ${imp.color}20` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={8} style={{ color: '#555' }} />
                <span className="text-[9px] font-bold font-mono" style={{ color: '#555' }}>{evt.time}</span>
                <span
                  className="w-1.5 h-1.5 rounded-full ml-auto"
                  style={{ background: imp.color }}
                />
              </div>
              <div className="text-[10px] font-semibold text-white mb-1">{evt.event}</div>
              <div className="flex items-center gap-2">
                <span className="text-[9px]" style={{ color: '#555' }}>예상 {evt.forecast}</span>
                <span className="text-[9px]" style={{ color: '#444' }}>이전 {evt.previous}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
