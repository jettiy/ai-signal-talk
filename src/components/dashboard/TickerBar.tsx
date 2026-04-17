'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketData } from '@/hooks/useMarketData';

interface TickerItem {
  label: string;
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
}

const SYMBOL_LABEL_MAP: Record<string, string> = {
  GCUSD: '골드선물',
  AAPL: '애플',
  NVDA: '엔비디아',
  TSLA: '테슬라',
  META: '메타',
  MSFT: '마이크로소프트',
  AMZN: '아마존',
  SPY: 'S&P500',
  QQQ: '나스닥ETF',
};

const FALLBACK_ITEMS: TickerItem[] = [
  { label: '나스닥선물', symbol: 'NQ', price: '18,542.5', change: '+0.42%', positive: true },
  { label: '골드선물', symbol: 'GC', price: '2,034.2', change: '-0.18%', positive: false },
  { label: 'WTI선물', symbol: 'CL', price: '77.84', change: '+0.31%', positive: true },
  { label: 'S&P500', symbol: 'SPX', price: '5,321.4', change: '+0.25%', positive: true },
  { label: '코스피', symbol: 'KOSPI', price: '2,567.8', change: '-0.53%', positive: false },
];

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatChange(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export default function TickerBar() {
  const { data: marketData } = useMarketData();

  const items: TickerItem[] =
    marketData && marketData.length > 0
      ? marketData.map((quote) => ({
          label: SYMBOL_LABEL_MAP[quote.symbol] ?? quote.symbol,
          symbol: quote.symbol,
          price: formatPrice(quote.price),
          change: formatChange(quote.changesPercentage),
          positive: quote.changesPercentage >= 0,
        }))
      : FALLBACK_ITEMS;

  const renderTickerItem = (item: TickerItem, i: number, keyPrefix: string) => (
    <div key={`${keyPrefix}-${i}`} className="flex items-center gap-2 shrink-0">
      <span className="text-[10px] font-semibold" style={{ color: '#A0A0A0' }}>
        {item.label}
      </span>
      <span className="text-xs font-mono font-bold text-white">{item.price}</span>
      <span
        className="flex items-center gap-0.5 text-[10px] font-bold font-mono"
        style={{ color: item.positive ? '#00FF41' : '#FF3B3B' }}
      >
        {item.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {item.change}
      </span>
      {i < items.length - 1 && (
        <span className="text-[10px] ml-2" style={{ color: '#2D2D2D' }}>
          │
        </span>
      )}
    </div>
  );

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
        {items.map((item, i) => renderTickerItem(item, i, 'orig'))}
        {/* 복제 (무한 스크롤 효과) */}
        {items.map((item, i) => renderTickerItem(item, i, 'dup'))}
      </div>
    </div>
  );
}
