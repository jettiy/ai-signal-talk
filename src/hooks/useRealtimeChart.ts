// useRealtimeChart.ts — WebSocket 데이터 + Lightweight Charts 실시간 연동
// ws-relay에서 받은 최신가를 차트의 마지막 캔들에 실시간 반영

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWebSocketQuotes, WSQuote } from './useWebSocketQuotes';

interface UseRealtimeChartOptions {
  /** 차트 표시 심볼 */
  symbol: string;
  /** Lightweight Charts의 addSeries가 반환한 ISeriesApi */
  seriesApi: ReturnType<ReturnType<typeof import('lightweight-charts').createChart>['addSeries']> | null;
  /** 현재 차트 타임프레임의 마지막 캔들 시간 (Unix seconds) */
  lastCandleTime?: number;
  /** 캔들 오픈 가격 (변동률 계산용) */
  lastCandleOpen?: number;
  /** 데이터 수신 콜백 */
  onTick?: (price: number, quote: WSQuote) => void;
}

/**
 * WebSocket에서 실시간 가격을 받아서 차트에 반영하는 훅
 *
 * 사용법:
 * ```
 * const chart = createChart(container, options);
 * const series = chart.addSeries(CandlestickSeries);
 *
 * useRealtimeChart({
 *   symbol: 'NQ=F',
 *   seriesApi: series,
 *   lastCandleTime: currentCandleTime,
 *   lastCandleOpen: currentCandleOpen,
 * });
 * ```
 */
export function useRealtimeChart(options: UseRealtimeChartOptions) {
  const { symbol, seriesApi, lastCandleTime, lastCandleOpen, onTick } = options;
  const prevPriceRef = useRef<number | null>(null);
  const tickCountRef = useRef(0);

  // WebSocket에서 특정 심볼만 구독
  const { quotes, connected } = useWebSocketQuotes({
    symbols: [symbol],
    onData: (allQuotes) => {
      const quote = allQuotes.find(q => q.symbol === symbol);
      if (!quote || !seriesApi || !lastCandleTime) return;

      const price = quote.price;
      const prevPrice = prevPriceRef.current;

      // 최신가가 이전 가격과 같으면 스킵
      if (prevPrice !== null && prevPrice === price) return;

      prevPriceRef.current = price;
      tickCountRef.current++;

      try {
        // ── 핵심: series.update()로 마지막 캔들 실시간 갱신 ──
        const candleData = {
          time: lastCandleTime as import('lightweight-charts').UTCTimestamp,
          // 캔들 데이터가 있으면 high/low 업데이트
          value: price,
          // OHLC 업데이트 ( CandlestickSeries인 경우)
          open: lastCandleOpen ?? price,
          high: prevPrice !== null ? Math.max(prevPrice, price) : price,
          low: prevPrice !== null ? Math.min(prevPrice, price) : price,
          close: price,
        };

        seriesApi.update(candleData as Parameters<typeof seriesApi.update>[0]);

        // 콜백
        onTick?.(price, quote);
      } catch (err) {
        // 시간 역행 에러 무시 (실시간 틱에서 자주 발생)
        if (err instanceof Error && !err.message.includes('time')) {
          console.warn('[RealtimeChart] update error:', err.message);
        }
      }
    },
  });

  // 심볼 변경 시 이전 가격 초기화
  useEffect(() => {
    prevPriceRef.current = null;
    tickCountRef.current = 0;
  }, [symbol]);

  return {
    currentPrice: quotes.get(symbol)?.price ?? null,
    currentQuote: quotes.get(symbol) ?? null,
    isConnected: connected,
    tickCount: tickCountRef.current,
  };
}

/**
 * WebSocket에서 가격 데이터를 받아 LineSeries (Price Line)에 반영
 */
export function useRealtimePriceLine(options: {
  symbol: string;
  seriesApi: ReturnType<ReturnType<typeof import('lightweight-charts').createChart>['addSeries']> | null;
  lastCandleTime?: number;
}) {
  const { symbol, seriesApi, lastCandleTime } = options;
  const prevPriceRef = useRef<number | null>(null);

  const { quotes, connected } = useWebSocketQuotes({
    symbols: [symbol],
    onData: (allQuotes) => {
      const quote = allQuotes.find(q => q.symbol === symbol);
      if (!quote || !seriesApi || !lastCandleTime) return;

      const price = quote.price;
      if (prevPriceRef.current === price) return;
      prevPriceRef.current = price;

      try {
        seriesApi.update({
          time: lastCandleTime as import('lightweight-charts').UTCTimestamp,
          value: price,
        } as Parameters<typeof seriesApi.update>[0]);
      } catch {
        // 시간 역행 무시
      }
    },
  });

  useEffect(() => {
    prevPriceRef.current = null;
  }, [symbol]);

  return {
    price: quotes.get(symbol)?.price ?? null,
    quote: quotes.get(symbol) ?? null,
    connected,
  };
}
