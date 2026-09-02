'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerQuote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

interface TickerItem {
  label: string;
  symbol: string;
  price: number;
  prevPrice: number;
  formattedPrice: string;
  change: string;
  positive: boolean;
  flash: 'up' | 'down' | null;
}

const SYMBOL_LABEL_MAP: Record<string, string> = {
  NQUSD: '나스닥선물',
  GCUSD: '골드선물',
  CLUSD: 'WTI원유',
  KSUSD: '코스피선물',
};

function formatPrice(price: number): string {
  if (price === 0) return '---';
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatChange(pct: number): string {
  if (pct === 0 && arguments.length === 0) return '---';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

// ── 실시간 시세 폴링 Hook (/api/ticker-quotes → 백엔드 /api/v2/quotes) ──
function useRealtimeQuotes() {
  const [quotes, setQuotes] = useState<TickerQuote[]>([]);
  const prevQuotesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const res = await fetch('/api/ticker-quotes', {
          cache: 'no-store',
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setQuotes(data);
          }
        }
      } catch {
        // 무시 — 다음 폴링에서 재시도
      }
    }

    // 즉시 첫 요청
    poll();
    // 10초마다 폴링
    timer = setInterval(poll, 10000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return quotes;
}

export default function TickerBar() {
  const quotes = useRealtimeQuotes();
  const [items, setItems] = useState<TickerItem[]>([]);
  const flashTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 시세 데이터를 TickerItem으로 변환 (깜빡임 포함)
  const updateItems = useCallback((data: TickerQuote[]) => {
    setItems(prev => {
      const next: TickerItem[] = data.map(q => {
        const prevItem = prev.find(p => p.symbol === q.symbol);
        const prevPrice = prevItem?.price ?? q.price;
        const flash = q.price > prevPrice ? 'up' : q.price < prevPrice ? 'down' : null;

        // 이전 깜빡임 타이머 정리
        const key = q.symbol;
        if (flash) {
          const timer = flashTimersRef.current.get(key);
          if (timer) clearTimeout(timer);
          flashTimersRef.current.set(key, setTimeout(() => {
            setItems(p => p.map(item =>
              item.symbol === key ? { ...item, flash: null } : item
            ));
          }, 600));
        }

        const hasChangePct = q.changePct !== undefined && q.changePct !== null && q.changePct !== 0;

        return {
          label: SYMBOL_LABEL_MAP[q.symbol] ?? q.symbol,
          symbol: q.symbol,
          price: q.price,
          prevPrice,
          formattedPrice: formatPrice(q.price),
          change: hasChangePct ? formatChange(q.changePct) : '---',
          positive: q.changePct >= 0,
          flash,
        };
      });
      return next;
    });
  }, []);

  // 데이터 수신 시 아이템 업데이트
  useEffect(() => {
    if (quotes.length > 0) {
      updateItems(quotes);
    }
  }, [quotes, updateItems]);

  // 빈 상태 폴백 (백엔드 연결 전)
  const displayItems = items.length > 0 ? items : [
    { label: '나스닥선물', symbol: 'NQ', price: 0, prevPrice: 0, formattedPrice: '---', change: '---', positive: true, flash: null },
    { label: '골드선물', symbol: 'GC', price: 0, prevPrice: 0, formattedPrice: '---', change: '---', positive: true, flash: null },
    { label: 'WTI원유', symbol: 'CL', price: 0, prevPrice: 0, formattedPrice: '---', change: '---', positive: true, flash: null },
    { label: '코스피선물', symbol: 'KS', price: 0, prevPrice: 0, formattedPrice: '---', change: '---', positive: true, flash: null },
  ];

  return (
    <div
      className="flex items-center gap-1 px-4 shrink-0 overflow-hidden"
      style={{
        height: 32,
        background: '#0A0A0F',
        borderBottom: '1px solid #1A1A1A',
      }}
    >
      <div className="flex items-center gap-6 animate-ticker">
        {displayItems.map((item, i) => (
          <div
            key={item.symbol}
            className="flex items-center gap-2 shrink-0 transition-colors duration-300"
          >
            <span className="text-[10px] font-semibold" style={{ color: '#A0A0A0' }}>
              {item.label}
            </span>
            <span
              className="text-xs font-mono font-bold transition-colors duration-300"
              style={{
                color: item.flash === 'up' ? '#00FF41' :
                       item.flash === 'down' ? '#FF3B3B' :
                       '#FFFFFF',
                textShadow: item.flash === 'up' ? '0 0 8px rgba(0,255,65,0.5)' :
                             item.flash === 'down' ? '0 0 8px rgba(255,59,59,0.5)' :
                             'none',
              }}
            >
              {item.formattedPrice}
            </span>
            <span
              className="flex items-center gap-0.5 text-[10px] font-bold font-mono"
              style={{ color: item.change === '---' ? '#A0A0A0' : item.positive ? '#00FF41' : '#FF3B3B' }}
            >
              {item.change !== '---' && (
                item.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />
              )}
              {item.change}
            </span>
            {i < displayItems.length - 1 && (
              <span className="text-[10px] ml-2" style={{ color: '#2D2D2D' }}>
                │
              </span>
            )}
          </div>
        ))}
        {/* 무한 스크롤 복제 */}
        {displayItems.map((item, i) => (
          <div
            key={`dup-${item.symbol}`}
            className="flex items-center gap-2 shrink-0"
          >
            <span className="text-[10px] font-semibold" style={{ color: '#A0A0A0' }}>
              {item.label}
            </span>
            <span
              className="text-xs font-mono font-bold transition-colors duration-300"
              style={{ color: '#FFFFFF' }}
            >
              {item.formattedPrice}
            </span>
            <span
              className="flex items-center gap-0.5 text-[10px] font-bold font-mono"
              style={{ color: item.change === '---' ? '#A0A0A0' : item.positive ? '#00FF41' : '#FF3B3B' }}
            >
              {item.change !== '---' && (
                item.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />
              )}
              {item.change}
            </span>
            {i < displayItems.length - 1 && (
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
