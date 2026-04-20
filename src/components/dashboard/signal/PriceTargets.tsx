'use client';

import { Target, ShieldAlert, TrendingUp, Scale } from 'lucide-react';

interface Props {
  direction: 'buy' | 'sell';
  entry: string;
  stopLoss: string;
  takeProfit: string;
  riskReward: string;
  symbol?: string;
  etf?: string;
  currentPrice?: number;
}

export default function PriceTargets({ direction, entry, stopLoss, takeProfit, riskReward, symbol, etf, currentPrice }: Props) {
  const isBuy = direction === 'buy';

  const fmtPrice = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const items = [
    {
      label: '진입가',
      value: `$${entry}`,
      icon: Target,
      color: '#FFFFFF',
    },
    {
      label: isBuy ? '손절가 (매도)' : '손절가 (매수)',
      value: `$${stopLoss}`,
      icon: ShieldAlert,
      color: '#FF3B3B',
    },
    {
      label: isBuy ? '목표가 (매도)' : '목표가 (매수)',
      value: `$${takeProfit}`,
      icon: TrendingUp,
      color: '#00FF41',
    },
  ];

  return (
    <div
      className="rounded-xl p-3"
      style={{ background: '#111118', border: '1px solid #1A1A1A' }}
    >
      {/* 방향 헤더 + ETF 현재가 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded"
            style={{
              background: isBuy ? 'rgba(0,255,65,0.1)' : 'rgba(255,59,59,0.1)',
              color: isBuy ? '#00FF41' : '#FF3B3B',
            }}
          >
            {isBuy ? 'LONG (매수)' : 'SHORT (매도)'}
          </span>
          {etf && (
            <span className="text-[10px] font-mono font-bold" style={{ color: '#888' }}>
              {etf}
            </span>
          )}
        </div>
        {currentPrice != null && (
          <span className="text-[10px] font-mono" style={{ color: '#FFD700' }}>
            현재가 ${fmtPrice(currentPrice)}
          </span>
        )}
      </div>

      {/* 가격 정보 */}
      <div className="space-y-2">
        {items.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center justify-between py-1.5 px-2 rounded-lg"
            style={{ background: '#0A0A0F' }}
          >
            <div className="flex items-center gap-2">
              <Icon size={11} style={{ color }} />
              <span className="text-[10px] font-bold" style={{ color: '#555' }}>{label}</span>
            </div>
            <span className="text-xs font-bold font-mono" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>

      {/* 손익비 */}
      <div
        className="mt-2 flex items-center justify-between py-2 px-3 rounded-lg"
        style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}
      >
        <div className="flex items-center gap-1.5">
          <Scale size={11} style={{ color: '#FFD700' }} />
          <span className="text-[10px] font-bold" style={{ color: '#FFD700' }}>손익비</span>
        </div>
        <span className="text-sm font-black font-mono" style={{ color: '#FFD700' }}>
          1 : {riskReward}
        </span>
      </div>
    </div>
  );
}
