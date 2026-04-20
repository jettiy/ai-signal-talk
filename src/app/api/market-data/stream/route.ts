// /api/market-data/stream — Server-Sent Events 실시간 시세
// WebSocket 없이 HTTP 스트리밍으로 실시간 푸시
// FMP API 호출 최소화: 서버에서 캐시 후 브로드캐스트

import { getQuotes } from '@/lib/fmp';
import type { Quote } from '@/lib/types';

const SYMBOLS = ['NQUSD', 'GCUSD', 'CLUSD', 'AAPL', 'NVDA', 'TSLA', 'META', 'MSFT', 'AMZN', 'SPY', 'QQQ'];
const POLL_INTERVAL = 10000; // 10초
const CACHE_TTL = 5000; // 5초 캐시

let cachedQuotes: Quote[] | null = null;
let lastFetchTime = 0;
let lastQuotes: Quote[] = []; // 이전 데이터 (변화 감지용)

async function getQuotesWithCache(): Promise<Quote[]> {
  const now = Date.now();
  if (cachedQuotes && now - lastFetchTime < CACHE_TTL) {
    return cachedQuotes;
  }
  cachedQuotes = await getQuotes(SYMBOLS);
  lastFetchTime = now;
  return cachedQuotes!;
}

export async function GET(req: globalThis.Request) {
  // 일반 JSON 요청이면 캐시된 데이터 반환
  const accept = req.headers.get('accept') || '';

  if (!accept.includes('text/event-stream')) {
    const quotes = await getQuotesWithCache();
    return new Response(JSON.stringify(quotes), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  }

  // ── SSE 스트리밍 ──
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 연결 유지용 타이머
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepAlive);
        }
      }, 15000);

      // 주기적 데이터 푸시
      const poll = setInterval(async () => {
        try {
          const quotes = await getQuotesWithCache();

          // 변화가 있는 종목만 전송 (대역폭 절약)
          const changed = quotes.filter((q, i) => {
            const prev = lastQuotes[i];
            return !prev || prev.price !== q.price || prev.change !== q.change;
          });

          if (changed.length > 0) {
            lastQuotes = quotes;
            const data = JSON.stringify(quotes);
            controller.enqueue(
              encoder.encode(`event: quotes\ndata: ${data}\n\n`)
            );
          }
        } catch {
          // 에러 시 조용히 스킵
        }
      }, POLL_INTERVAL);

      // 첫 데이터 즉시 전송
      try {
        const initial = await getQuotesWithCache();
        lastQuotes = initial;
        controller.enqueue(
          encoder.encode(`event: quotes\ndata: ${JSON.stringify(initial)}\n\n`)
        );
      } catch {
        controller.enqueue(
          encoder.encode(`event: error\ndata: {"message":"초기 데이터 로드 실패"}\n\n`)
        );
      }

      // 클라이언트 연결 해제 시 정리
      req.signal.addEventListener('abort', () => {
        clearInterval(poll);
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch { /* 이미 닫힘 */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx 버퍼링 방지
    },
  });
}
