'use client';

import { CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

const MOCK_TRADES = [
  { id: 1, date: '04/17 09:12', symbol: 'NQUSD', direction: 'buy' as const, entry: '21,250', exit: '21,340', pnl: '+$900', result: 'win' as const },
  { id: 2, date: '04/17 08:45', symbol: 'GCUSD', direction: 'sell' as const, entry: '4,812', exit: '4,795', pnl: '+$170', result: 'win' as const },
  { id: 3, date: '04/17 07:30', symbol: 'NQUSD', direction: 'buy' as const, entry: '21,200', exit: '21,180', pnl: '-$200', result: 'loss' as const },
  { id: 4, date: '04/16 22:15', symbol: 'CLUSD', direction: 'buy' as const, entry: '64.80', exit: '65.50', pnl: '+$700', result: 'win' as const },
  { id: 5, date: '04/16 20:00', symbol: 'NQUSD', direction: 'sell' as const, entry: '21,350', exit: '21,280', pnl: '+$700', result: 'win' as const },
  { id: 6, date: '04/16 18:30', symbol: 'GCUSD', direction: 'buy' as const, entry: '4,780', exit: '4,770', pnl: '-$100', result: 'loss' as const },
  { id: 7, date: '04/16 15:00', symbol: 'NQUSD', direction: 'buy' as const, entry: '21,100', exit: '21,250', pnl: '+$1,500', result: 'win' as const },
  { id: 8, date: '04/16 11:30', symbol: 'CLUSD', direction: 'sell' as const, entry: '65.20', exit: '64.80', pnl: '+$400', result: 'win' as const },
];

export default function TradeHistory() {
  const wins = MOCK_TRADES.filter((t) => t.result === 'win').length;
  const total = MOCK_TRADES.length;
  const winRate = Math.round((wins / total) * 100);

  return (
    <div className="p-4 space-y-4">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: '총 거래', value: `${total}건`, color: '#FFF' },
          { label: '승률', value: `${winRate}%`, color: '#00FF41' },
          { label: '총 손익', value: '+$4,070', color: '#00FF41' },
          { label: '평균 손익비', value: '1.42', color: '#FFD700' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg p-2.5 text-center"
            style={{ background: '#111118', border: '1px solid #1A1A1A' }}
          >
            <div className="text-sm font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-[9px]" style={{ color: '#444' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* 히스토리 리스트 */}
      <div className="space-y-1.5">
        {MOCK_TRADES.map((trade) => {
          const isBuy = trade.direction === 'buy';
          const isWin = trade.result === 'win';

          return (
            <div
              key={trade.id}
              className="rounded-lg p-2.5"
              style={{
                background: '#111118',
                border: `1px solid ${isWin ? 'rgba(0,255,65,0.08)' : 'rgba(255,59,59,0.08)'}`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-mono" style={{ color: '#444' }}>{trade.date}</span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                  style={{
                    background: isBuy ? 'rgba(0,255,65,0.08)' : 'rgba(255,59,59,0.08)',
                    color: isBuy ? '#00FF41' : '#FF3B3B',
                  }}
                >
                  {isBuy ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                  {isBuy ? '매수' : '매도'}
                </span>
                <span className="text-[10px] font-bold text-white ml-1">{trade.symbol}</span>
                <span className="ml-auto">
                  {isWin ? (
                    <CheckCircle size={12} style={{ color: '#00FF41' }} />
                  ) : (
                    <XCircle size={12} style={{ color: '#FF3B3B' }} />
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px]" style={{ color: '#555' }}>진입 ${trade.entry}</span>
                  <span className="text-[9px]" style={{ color: '#444' }}>→</span>
                  <span className="text-[9px]" style={{ color: '#555' }}>청산 ${trade.exit}</span>
                </div>
                <span
                  className="text-[10px] font-bold font-mono"
                  style={{ color: isWin ? '#00FF41' : '#FF3B3B' }}
                >
                  {trade.pnl}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
