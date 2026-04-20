'use client';

import { Calendar, Clock, AlertTriangle } from 'lucide-react';

// ── 오늘 발표 일정 ────────────────────────────────────────────
// actual > forecast → 초록, actual < forecast → 빨강, 전월치 → 흰색
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

// 결과값 색상 판별: actual > forecast → 초록(호조), actual < forecast → 빨강(부진)
function getActualColor(actual: number | null, forecast: number | null) {
  if (actual === null || forecast === null) return '#888'; // 미발표
  if (actual > forecast) return '#00FF41'; // 예상치 상회 → 초록
  if (actual < forecast) return '#FF3B3B'; // 예상치 하회 → 빨강
  return '#FFD700'; // 동일 → 노랑
}

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
        <span className="text-[9px] ml-auto" style={{ color: '#444' }}>미국 / KST 기준</span>
      </div>

      {/* 두 섹션 */}
      <div className="flex gap-3 px-4 pb-3">
        {/* 오늘 발표 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={9} style={{ color: '#FF3B3B' }} />
            <span className="text-[10px] font-bold" style={{ color: '#FF3B3B' }}>오늘 발표</span>
          </div>
          <div className="space-y-1">
            {TODAY_EVENTS.map((evt) => {
              const actualColor = getActualColor(evt.actual, evt.forecast);
              return (
                <div
                  key={evt.time + evt.event}
                  className="rounded-md px-2.5 py-1.5"
                  style={{ background: '#111118' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold font-mono shrink-0" style={{ color: '#555' }}>{evt.time}</span>
                    <span className="text-[10px] font-semibold text-white">{evt.event}</span>
                  </div>
                  {evt.forecast !== null ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[11px] font-bold font-mono" style={{ color: actualColor }}>
                        {formatValue(evt.actual, evt.unit)}
                      </span>
                      <span className="text-[9px]" style={{ color: '#555' }}>
                        (예상치: <span style={{ color: '#FFD700' }}>{formatValue(evt.forecast, evt.unit)}</span>, 전월치: <span style={{ color: '#FFF' }}>{formatValue(evt.previous, evt.unit)}</span>)
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] mt-0.5" style={{ color: '#444' }}>발표 대기</span>
                  )}
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
              const actualColor = getActualColor(evt.actual, evt.forecast);
              return (
                <div
                  key={evt.day + evt.event}
                  className="rounded-md px-2.5 py-1.5"
                  style={{ background: '#111118' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-bold shrink-0 w-5 text-center rounded px-1"
                      style={{ color: '#555', background: '#0A0A0F' }}
                    >
                      {evt.day}
                    </span>
                    <span className="text-[10px] font-semibold text-white">{evt.event}</span>
                  </div>
                  {evt.actual !== null ? (
                    <div className="flex items-center gap-1 mt-0.5 ml-7">
                      <span className="text-[11px] font-bold font-mono" style={{ color: actualColor }}>
                        {formatValue(evt.actual, evt.unit)}
                      </span>
                      <span className="text-[9px]" style={{ color: '#555' }}>
                        (예상치: <span style={{ color: '#FFD700' }}>{formatValue(evt.forecast, evt.unit)}</span>, 전월치: <span style={{ color: '#FFF' }}>{formatValue(evt.previous, evt.unit)}</span>)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-0.5 ml-7">
                      <span className="text-[9px]" style={{ color: '#444' }}>
                        예상치: <span style={{ color: '#FFD700' }}>{formatValue(evt.forecast, evt.unit)}</span>, 전월치: <span style={{ color: '#FFF' }}>{formatValue(evt.previous, evt.unit)}</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
