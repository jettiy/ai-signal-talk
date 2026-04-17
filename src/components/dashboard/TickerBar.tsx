'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  label: string;
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
}

const TICKER_ITEMS: TickerItem[] = [
  { label: '나스닥선물', symbol: 'NQ', price: '18,542.5', change: '+0.42%', positive: true },
  { label: '골드선물', symbol: 'GC', price: '2,034.2', change: '-0.18%', positive: false },
  { label: 'WTI선물', symbol: 'CL', price: '77.84', change: '+0.31%', positive: true },
  { label: 'S&P500', symbol: 'SPX', price: '5,321.4', change: '+0.25%', positive: true },
  { label: '코스피', symbol: 'KOSPI', price: '2,567.8', change: '-0.53%', positive: false },
];

export default function TickerBar() {
  return (
    <div
      className="flex items-center gap-1 px-4 shrink-0 overflow-hidden"
      style={{
        height: 32,
        background: '#0A0A0F',
        borderBottom: '1px solid #1A1A1A',
      }}
    >
      {/* 스크롤 틱커 */}
      <div className="flex items-center gap-6 animate-ticker">
        {TICKER_ITEMS.map((item, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-semibold" style={{ color: '#A0A0A0' }}>
              {item.label}
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {item.price}
            </span>
            <span
              className="flex items-center gap-0.5 text-[10px] font-bold font-mono"
              style={{ color: item.positive ? '#00FF41' : '#FF3B3B' }}
            >
              {item.positive ? (
                <TrendingUp size={10} />
              ) : (
                <TrendingDown size={10} />
              )}
              {item.change}
            </span>
            {i < TICKER_ITEMS.length - 1 && (
              <span className="text-[10px] ml-2" style={{ color: '#2D2D2D' }}>
                │
              </span>
            )}
          </div>
        ))}
        {/* 복제 (무한 스크롤 효과) */}
        {TICKER_ITEMS.map((item, i) => (
          <div key={`dup-${i}`} className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-semibold" style={{ color: '#A0A0A0' }}>
              {item.label}
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {item.price}
            </span>
            <span
              className="flex items-center gap-0.5 text-[10px] font-bold font-mono"
              style={{ color: item.positive ? '#00FF41' : '#FF3B3B' }}
            >
              {item.positive ? (
                <TrendingUp size={10} />
              ) : (
                <TrendingDown size={10} />
              )}
              {item.change}
            </span>
            {i < TICKER_ITEMS.length - 1 && (
              <span className="text-[10px] ml-2" style={{ color: '#2D2D2D' }}>
                │
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
