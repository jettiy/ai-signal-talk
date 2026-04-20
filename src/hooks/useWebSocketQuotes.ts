// useWebSocketQuotes.ts — WebSocket 실시간 시세 Hook
// SignalChart WS Relay 서버에서 실시간 Quote 데이터를 수신

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WSQuote {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number;
  previousClose: number;
  timestamp: number;
}

export interface WSMessage {
  data: WSQuote[];
  timestamp: string;
  pollCount: number;
}

interface UseWebSocketQuotesOptions {
  /** WS Relay 서버 URL (기본: 현재 호스트) */
  url?: string;
  /** 특정 심볼만 구독 (null이면 전체) */
  symbols?: string[] | null;
  /** 재연결 간격 (ms) */
  reconnectInterval?: number;
  /** 연결 시 콜백 */
  onConnect?: () => void;
  /** 연결 끊김 콜백 */
  onDisconnect?: () => void;
  /** 데이터 수신 콜백 */
  onData?: (quotes: WSQuote[]) => void;
}

interface UseWebSocketQuotesReturn {
  /** 실시간 시세 데이터 (심볼별 Map) */
  quotes: Map<string, WSQuote>;
  /** 마지막 업데이트 시간 */
  lastUpdate: Date | null;
  /** WebSocket 연결 상태 */
  connected: boolean;
  /** 수신한 총 메시지 수 */
  messageCount: number;
  /** 서버에서 보낸 폴 카운트 */
  pollCount: number;
}

export function useWebSocketQuotes(
  options: UseWebSocketQuotesOptions = {}
): UseWebSocketQuotesReturn {
  const {
    symbols = null,
    reconnectInterval = 5000,
    onConnect,
    onDisconnect,
    onData,
  } = options;

  const [quotes, setQuotes] = useState<Map<string, WSQuote>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [pollCount, setPollCount] = useState(0);

  const socketRef = useRef<ReturnType<typeof import('socket.io-client').io> | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // 동적 임포트 (클라이언트 번들 최적화)
    import('socket.io-client').then(({ io }) => {
      if (!mountedRef.current) return;

      // WS Relay 서버 URL
      const wsUrl = options.url || (typeof window !== 'undefined'
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:3001`
        : 'ws://localhost:3001');

      const socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnection: false, // 수동 재연결으로 제어
        timeout: 10000,
      });

      socketRef.current = socket as ReturnType<typeof io>;

      socket.on('connect', () => {
        if (!mountedRef.current) return;
        setConnected(true);
        onConnect?.();

        // 특정 심볼 구독
        if (symbols) {
          socket.emit('subscribe', symbols);
        }
      });

      socket.on('quotes', (msg: WSMessage) => {
        if (!mountedRef.current) return;
        setMessageCount(prev => prev + 1);
        setPollCount(msg.pollCount || 0);
        setLastUpdate(new Date(msg.timestamp));

        // Map 업데이트 (불변성 유지)
        setQuotes(prev => {
          const next = new Map(prev);
          msg.data.forEach((q: WSQuote) => {
            next.set(q.symbol, q);
          });
          return next;
        });

        onData?.(msg.data);
      });

      socket.on('disconnect', () => {
        if (!mountedRef.current) return;
        setConnected(false);
        onDisconnect?.();
      });

      socket.on('connect_error', (err) => {
        if (!mountedRef.current) return;
        console.warn('[WS] 연결 실패:', err.message);
        setConnected(false);
        socket.disconnect();
      });
    });
  }, [symbols, options.url, onConnect, onDisconnect, onData]);

  // 수동 재연결 로직
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connect]);

  // 연결 끊김 시 자동 재연결
  useEffect(() => {
    if (connected) {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      return;
    }

    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current && !connected) {
        console.log('[WS] 재연결 시도...');
        connect();
      }
    }, reconnectInterval);

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connected, reconnectInterval, connect]);

  return { quotes, lastUpdate, connected, messageCount, pollCount };
}

// ─── 유틸: 가격 포맷팅 ───
export function formatPrice(price: number, decimals = 2): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ─── 유틸: 변동률 표시 (+1.23% / -0.45%) ───
export function formatChange(change: number, pct: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
}

// ─── 유틸: 실시간 클래스명 (초록/빨강) ───
export function getPriceColor(change: number): string {
  return change >= 0 ? 'text-green-400' : 'text-red-400';
}
