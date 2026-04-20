'use client';

import { Calendar, Clock, AlertTriangle, ChevronDown } from 'lucide-react';

// ── 오늘 발표 일정 ────────────────────────────────────────────
const TODAY_EVENTS = [
  { time: '22:30', event: '소매매출', actual: null, forecast: 0.3, previous: 0.2, unit: '%' },
  { time: '23:15', event: '산업생산', actual: null, forecast: 0.1, previous: 0.1, unit: '%' },
];

// ── 이번주 주요 일정 ──────────────────────────────────────────
const WEEK_EVENTS = [
  { day: '화', event: '소매매출', actual: null, forecast: 0.3, previous: 0.2, unit: '%' },
  { day: '화', event: '산업생산', actual: null, forecast: 0.1, previous: 0.1, unit: '%' },
  { day: '수', event: '신규주택판매', actual: null, forecast: 680, previous: 660, unit: 'K' },
  { day: '수', event: 'FOMC 베이지북', actual: null, forecast: null, previous: null, unit: '' },
  { day: '목', event: '실업수당청구', actual: null, forecast: 220, previous: 220, unit: 'K' },
  { day: '목', event: '내구재주문', actual: null, forecast: 0.3, previous: 0.2, unit: '%' },
  { day: '목', event: 'GDP 속보 Q1', actual: null, forecast: 2.5, previous: 3.0, unit: '%' },
  { day: '금', event: 'PCE 물가지수', actual: null, forecast: 0.2, previous: 0.2, unit: '%' },
  { day: '금', event: '미시간대소비자심리', actual: null, forecast: 77.0, previous: 77.0, unit: '' },
];

function formatValue(val: number | null, unit: string) {
  if (val === null) return '-';
  const prefix = val > 0 && unit === '%' ? '+' : '';
  return `${prefix}${val}${unit}`;
}

function getActualColor(actual: number | null, forecast: number | null) {
  if (actual === null || forecast === null) return '#888';
  if (actual > forecast) return '#00FF41';
  if (actual < forecast) return '#FF3B3B';
  return '#FFD700';
}

export default function EconomicCalendar() {
  const now = new Date();
  const updatedTime = now.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="shrink-0"
      style={{ borderTop: '1px solid #1A1A1A', background: '#0A0A0F', maxHeight: 200 }}
    >
      {/* ── 컴팩트 헤더 ── */}
      <div className="flex items-center gap-2 px-4 py-1.5 shrink-0">
        <Calendar size={10} style={{ color: '#FFD700' }} />
        <span className="text-[10px] font-bold" style={{ color: '#FFD700' }}>주요 경제 지표 일정</span>
        <span className="text-[9px] text-zinc-500 ml-auto">업데이트: {updatedTime}</span>
      </div>

      {/* ── 스크롤 가능한 본문 ── */}
      <div className="overflow-y-auto px-4 pb-3" style={{ maxHeight: 160 }}>
        <div className="flex gap-3">
          {/* 오늘 발표 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 bg-[#00FF00] rounded-full inline-block" />
              <AlertTriangle size={9} style={{ color: '#FF3B3B' }} />
              <span className="text-[9px] font-bold" style={{ color: '#FF3B3B' }}>오늘 발표</span>
            </div>
            <div className="space-y-2">
              {TODAY_EVENTS.map((evt) => {
                const actualColor = getActualColor(evt.actual, evt.forecast);
                return (
                  <div
                    key={evt.time + evt.event}
                    className="bg-[#121212] border border-zinc-800 rounded-lg p-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#00FF00] font-bold font-mono text-xs">[{evt.time}]</span>
                      <span className="font-bold text-xs text-white">{evt.event}</span>
                    </div>
                    {evt.forecast !== null ? (
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400">
                        <span>실제: <span className="font-mono font-bold" style={{ color: actualColor }}>{formatValue(evt.actual, evt.unit)}</span></span>
                        <span className="text-zinc-700">|</span>
                        <span>예상: <span className="font-mono" style={{ color: '#FFD700' }}>{formatValue(evt.forecast, evt.unit)}</span></span>
                        <span className="text-zinc-700">|</span>
                        <span>이전: <span className="font-mono text-zinc-300">{formatValue(evt.previous, evt.unit)}</span></span>
                      </div>
                    ) : (
                      <p className="text-[9px] text-zinc-600 mt-1">발표 대기 중</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ width: '1px', background: '#1A1A1A', alignSelf: 'stretch' }} />

          {/* 이번주 주요 일정 (스크롤) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 bg-[#00FF00] rounded-full inline-block" />
              <Clock size={9} style={{ color: '#00B4D8' }} />
              <span className="text-[9px] font-bold" style={{ color: '#00B4D8' }}>이번주 주요 일정</span>
              <ChevronDown size={9} className="ml-auto" style={{ color: '#333' }} />
            </div>
            <div className="space-y-2">
              {WEEK_EVENTS.map((evt) => {
                const actualColor = getActualColor(evt.actual, evt.forecast);
                return (
                  <div
                    key={evt.day + evt.event}
                    className="bg-[#121212] border border-zinc-800 rounded-lg p-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[8px] font-bold shrink-0 w-5 text-center rounded px-0.5 font-mono"
                        style={{ color: '#00B4D8', background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.15)' }}
                      >
                        {evt.day}
                      </span>
                      <span className="font-bold text-xs text-white">{evt.event}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400">
                      <span>실제: <span className="font-mono font-bold" style={{ color: actualColor }}>{formatValue(evt.actual, evt.unit)}</span></span>
                      <span className="text-zinc-700">|</span>
                      <span>예상: <span className="font-mono" style={{ color: '#FFD700' }}>{formatValue(evt.forecast, evt.unit)}</span></span>
                      <span className="text-zinc-700">|</span>
                      <span>이전: <span className="font-mono text-zinc-300">{formatValue(evt.previous, evt.unit)}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
