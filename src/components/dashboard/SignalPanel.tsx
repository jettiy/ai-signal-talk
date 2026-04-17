'use client';

import { Zap, TrendingUp, TrendingDown, BarChart3, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const SIGNALS = [
  { id: 1, symbol: 'GOLD', name: '골드', type: 'LONG' as const, price: '4,812.50', change: '+1.24%', confidence: 92, timeframe: '4H', ai: 'GLM-5', status: 'active' as const, targets: { entry: '4,810', tp: '4,865', sl: '4,780' } },
  { id: 2, symbol: 'NQUSD', name: '나스닥 선물', type: 'SHORT' as const, price: '21,285.00', change: '-0.68%', confidence: 78, timeframe: '1H', ai: 'GLM-5', status: 'active' as const, targets: { entry: '21,290', tp: '21,150', sl: '21,380' } },
  { id: 3, symbol: 'CLUSD', name: 'WTI 원유', type: 'LONG' as const, price: '64.82', change: '+2.15%', confidence: 85, timeframe: '1D', ai: 'GLM-5', status: 'pending' as const, targets: { entry: '64.80', tp: '66.50', sl: '63.90' } },
  { id: 4, symbol: 'AAPL', name: '애플', type: 'LONG' as const, price: '262.40', change: '+0.92%', confidence: 71, timeframe: '4H', ai: 'GLM-5', status: 'completed' as const, targets: { entry: '260.10', tp: '265.00', sl: '258.50' } },
  { id: 5, symbol: 'NVDA', name: '엔비디아', type: 'SHORT' as const, price: '198.60', change: '-1.45%', confidence: 65, timeframe: '1H', ai: 'GLM-5', status: 'active' as const, targets: { entry: '199.00', tp: '194.00', sl: '202.50' } },
];

const STATUS_MAP = {
  active: { label: '활성', color: '#00FF41', icon: Activity },
  pending: { label: '대기', color: '#FFD700', icon: Clock },
  completed: { label: '완료', color: '#00B4D8', icon: CheckCircle },
};

export default function SignalPanel() {
  return (
    <div className="flex h-full" style={{ background: '#0A0A0F' }}>
      {/* 메인 시그널 리스트 */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid #1A1A1A' }}
        >
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: '#00FF41' }} />
            <span className="text-xs font-bold text-white">AI 시그널 분석</span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,255,65,0.1)', color: '#00FF41', border: '1px solid rgba(0,255,65,0.2)' }}
            >
              실시간
            </span>
          </div>
          <div className="flex gap-2">
            {['전체', 'LONG', 'SHORT'].map((f) => (
              <button
                key={f}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                style={{
                  background: f === '전체' ? 'rgba(0,255,65,0.1)' : '#111118',
                  color: f === '전체' ? '#00FF41' : '#555',
                  border: `1px solid ${f === '전체' ? 'rgba(0,255,65,0.2)' : '#1A1A1A'}`,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* 시그널 카드 리스트 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {SIGNALS.map((sig) => {
            const statusInfo = STATUS_MAP[sig.status];
            const StatusIcon = statusInfo.icon;
            const isLong = sig.type === 'LONG';

            return (
              <div
                key={sig.id}
                className="rounded-xl p-4 transition-all"
                style={{
                  background: '#111118',
                  border: `1px solid ${isLong ? 'rgba(0,255,65,0.1)' : 'rgba(255,59,59,0.1)'}`,
                }}
              >
                {/* 상단: 심볼 + 상태 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-white">{sig.symbol}</span>
                  <span className="text-[11px]" style={{ color: '#666' }}>{sig.name}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"
                    style={{
                      background: isLong ? 'rgba(0,255,65,0.08)' : 'rgba(255,59,59,0.08)',
                      color: isLong ? '#00FF41' : '#FF3B3B',
                    }}
                  >
                    {isLong ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {sig.type}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded ml-auto flex items-center gap-1"
                    style={{ background: `${statusInfo.color}10`, color: statusInfo.color }}
                  >
                    <StatusIcon size={9} />
                    {statusInfo.label}
                  </span>
                </div>

                {/* 가격 + 변동률 */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-lg font-bold text-white font-mono">${sig.price}</span>
                  <span
                    className="text-xs font-bold font-mono"
                    style={{ color: isLong ? '#00FF41' : '#FF3B3B' }}
                  >
                    {sig.change}
                  </span>
                </div>

                {/* 타겟 가격 */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: '진입', value: sig.targets.entry },
                    { label: 'TP', value: sig.targets.tp },
                    { label: 'SL', value: sig.targets.sl },
                  ].map((t) => (
                    <div
                      key={t.label}
                      className="rounded-lg px-2.5 py-1.5 text-center"
                      style={{ background: '#0A0A0F' }}
                    >
                      <div className="text-[9px] font-bold" style={{ color: '#555' }}>{t.label}</div>
                      <div className="text-[11px] font-bold font-mono text-white">${t.value}</div>
                    </div>
                  ))}
                </div>

                {/* 하단: AI 신뢰도 + 타임프레임 */}
                <div className="flex items-center gap-3">
                  {/* 신뢰도 바 */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold" style={{ color: '#555' }}>AI 신뢰도</span>
                      <span className="text-[10px] font-bold font-mono" style={{ color: sig.confidence >= 80 ? '#00FF41' : sig.confidence >= 60 ? '#FFD700' : '#FF3B3B' }}>
                        {sig.confidence}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A1A1A' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${sig.confidence}%`,
                          background: sig.confidence >= 80
                            ? 'linear-gradient(90deg, #00FF41, #00CC33)'
                            : sig.confidence >= 60
                              ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                              : 'linear-gradient(90deg, #FF3B3B, #CC0000)',
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-1 rounded" style={{ background: '#0A0A0F', color: '#555' }}>
                    {sig.timeframe}
                  </span>
                  <span className="text-[9px] font-bold" style={{ color: '#444' }}>{sig.ai}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 오른쪽: AI 분석 요약 */}
      <div
        className="w-72 shrink-0 flex flex-col p-4 overflow-y-auto"
        style={{ background: '#0A0A0F', borderLeft: '1px solid #1A1A1A' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={12} style={{ color: '#00FF41' }} />
          <span className="text-[11px] font-bold text-white">AI 분석 요약</span>
        </div>

        {/* 시장 감정 */}
        <div className="rounded-xl p-3 mb-3" style={{ background: '#111118', border: '1px solid #1A1A1A' }}>
          <div className="text-[10px] font-bold mb-2" style={{ color: '#555' }}>시장 감정</div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: '#00FF41' }}>강세</span>
            <div className="flex-1 mx-3 h-2 rounded-full overflow-hidden flex" style={{ background: '#1A1A1A' }}>
              <div className="h-full rounded-l-full" style={{ width: '65%', background: '#00FF41' }} />
              <div className="h-full rounded-r-full" style={{ width: '35%', background: '#FF3B3B' }} />
            </div>
            <span className="text-xs font-bold" style={{ color: '#FF3B3B' }}>약세</span>
          </div>
          <div className="text-center mt-1">
            <span className="text-[10px] font-mono" style={{ color: '#00FF41' }}>65% 강세</span>
          </div>
        </div>

        {/* 오늘의 성과 */}
        <div className="rounded-xl p-3 mb-3" style={{ background: '#111118', border: '1px solid #1A1A1A' }}>
          <div className="text-[10px] font-bold mb-2" style={{ color: '#555' }}>오늘의 시그널 성과</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '활성', value: '3', color: '#00FF41' },
              { label: '적중', value: '7/9', color: '#00B4D8' },
              { label: '수익률', value: '+4.2%', color: '#00FF41' },
              { label: '평균신뢰도', value: '78%', color: '#FFD700' },
            ].map((item) => (
              <div key={item.label} className="text-center rounded-lg py-2" style={{ background: '#0A0A0F' }}>
                <div className="text-xs font-bold" style={{ color: item.color }}>{item.value}</div>
                <div className="text-[9px]" style={{ color: '#444' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 주의 알림 */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={10} style={{ color: '#FFD700' }} />
            <span className="text-[10px] font-bold" style={{ color: '#FFD700' }}>주의 알림</span>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: '#999' }}>
            FOMC 의사록 공개 예정 (18:00 KST). 변동성 급증 예상. 포지션 사이즈 축소를 권장합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
