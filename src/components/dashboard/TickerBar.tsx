'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerQuote {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
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
  CLUSD: 'WTI선물',
  KOSPI: '코스피선물',
  HSIUSD: '항셍선물',
  AAPL: '애플',
  NVDA: '엔비디아',
  TSLA: '테슬라',
  META: '메타',
  MSFT: '마이크로소프트',
  AMZN: '아마존',
  SPY: 'S&P500',
  QQQ: '나스닥ETF',
};

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

// ── SSE 실시간 시세 Hook ──
function useRealtimeQuotes() {
  const [quotes, setQuotes] = useState<TickerQuote[]>([]);
  const [connected, setConnected] = useState(false);
  const prevQuotesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const controller = new AbortController();

    async function connect() {
      try {
        const res = await fetch('/api/market-data/stream', {
          headers: { 'Accept': 'text/event-stream' },
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          // SSE 미지원 시 폴백: 일반 JSON 폴링
          fallbackPolling(controller.signal);
          return;
        }

        setConnected(true);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentData = '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              currentData = line.slice(6);
            } else if (line === '' && currentData) {
              try {
                const data = JSON.parse(currentData);
                if (Array.isArray(data)) {
                  setQuotes(data);
                }
              } catch { /* 파싱 에러 무시 */ }
              currentData = '';
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          // SSE 실패 시 폴백
          fallbackPolling(controller.signal);
        }
      }
    }

    function fallbackPolling(signal: AbortSignal) {
      const poll = setInterval(async () => {
        try {
          const res = await fetch('/api/market-data', { signal });
          if (res.ok) {
            const data = await res.json();
            setQuotes(data);
            setConnected(true);
          }
        } catch { /* 무시 */ }
      }, 10000);

      signal.addEventListener('abort', () => clearInterval(poll));
    }

    connect();

    return () => controller.abort();
  }, []);

  return { quotes, connected };
}

export default function TickerBar() {
  const { quotes } = useRealtimeQuotes();
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

        return {
          label: SYMBOL_LABEL_MAP[q.symbol] ?? q.symbol,
          symbol: q.symbol,
          price: q.price,
          prevPrice,
          formattedPrice: formatPrice(q.price),
          change: formatChange(q.changesPercentage),
          positive: q.changesPercentage >= 0,
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

  // 빈 상태 폴백
  const displayItems = items.length > 0 ? items : [
    { label: '나스닥선물', symbol: 'NQ', price: 0, prevPrice: 0, formattedPrice: '---', change: '---', positive: true, flash: null },
    { label: '골드선물', symbol: 'GC', price: 0, prevPrice: 0, formattedPrice: '---', change: '---', positive: true, flash: null },
    { label: 'WTI선물', symbol: 'CL', price: 0, prevPrice: 0, formattedPrice: '---', change: '---', positive: true, flash: null },
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
              style={{ color: item.positive ? '#00FF41' : '#FF3B3B' }}
            >
              {item.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
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
              style={{ color: item.positive ? '#00FF41' : '#FF3B3B' }}
            >
              {item.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
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
