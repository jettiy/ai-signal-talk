// ============================================================
//  WebSocket Relay Server — FMP 실시간 시세 브로드캐스팅
// ============================================================

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');

// ─── 설정 ───
const PORT = parseInt(process.env.PORT || '3001', 10);
const FMP_API_KEY = process.env.FMP_API_KEY || '';
const FMP_BASE = 'https://financialmodelingprep.com/stable';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '10000', 10); // 기본 10초

// 모니터링 대상 심볼 (쉼표 구분)
const SYMBOLS = [
  'NQ=F',    // 나스닥 선물
  'GC=F',    // 골드 선물
  'CL=F',    // WTI 원유 선물
  'KS=F',    // 코스피 선물
  'HSI=F',   // 항셍 선물
  'AAPL',    // 애플
  'NVDA',    // 엔비디아
  'TSLA',    // 테슬라
  'SPY',     // S&P 500 ETF
  'QQQ',     // 나스닥 100 ETF
];

// ─── Express + Socket.io ───
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'https://www.signalchart.kr',
      'https://signalchart.kr',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST'],
  },
  // 전송 버퍼 최적화 (실시간 데이터용)
  pingInterval: 10000,
  pingTimeout: 5000,
});

// ─── 상태 ───
let isConnected = false;
let pollTimer = null;
let clientCount = 0;
let lastPollAt = null;
let pollCount = 0;
let errorCount = 0;

// ─── FMP 다중 현재가 조회 ───
// 핵심: 한 번의 API 호출로 여러 종목 데이터를 가져옴
async function fetchQuotes() {
  if (!FMP_API_KEY) {
    console.warn('[WARN] FMP_API_KEY가 설정되지 않음. 목데이터 반환.');
    return getMockQuotes();
  }

  const symbolParam = SYMBOLS.join(',');
  const url = `${FMP_BASE}/quote?symbols=${symbolParam}&apikey=${FMP_API_KEY}`;

  try {
    const startTime = Date.now();
    const { data, status } = await axios.get(url, {
      timeout: 5000,
      headers: { 'Accept': 'application/json' },
    });

    const elapsed = Date.now() - startTime;
    lastPollAt = new Date().toISOString();
    pollCount++;
    errorCount = 0;

    // 응답이 배열이 아닐 경우 (단일 심볼 등)
    const quotes = Array.isArray(data) ? data : [data];

    console.log(
      `[POLL #${pollCount}] ${quotes.length}종목 ${elapsed}ms`,
      quotes.slice(0, 3).map(q => `${q.symbol}:$${q.price?.toFixed(2)}`).join(' | ')
    );

    return quotes.map(q => ({
      symbol: q.symbol || '',
      price: q.price || 0,
      change: q.change || 0,
      changesPercentage: q.changesPercentage || 0,
      dayHigh: q.dayHigh || 0,
      dayLow: q.dayLow || 0,
      volume: q.volume || 0,
      marketCap: q.marketCap || 0,
      previousClose: q.previousClose || q.price || 0,
      timestamp: Date.now(),
    }));
  } catch (err) {
    errorCount++;
    console.error(
      `[ERROR] FMP API 실패 (${errorCount}연속):`,
      err.response?.status || err.message
    );

    // 5연속 에러 시 간격 늘림 (API 제한 방어)
    if (errorCount >= 5 && pollTimer) {
      clearInterval(pollTimer);
      const backoff = Math.min(POLL_INTERVAL * 3, 60000);
      console.log(`[BACKOFF] ${backoff / 1000}초 후 재시도...`);
      pollTimer = setInterval(broadcastQuotes, backoff);
    }

    return null;
  }
}

// ─── 목데이터 (API 키 없을 때) ───
function getMockQuotes() {
  const base = [
    { symbol: 'NQ=F', price: 18500 + Math.random() * 200, change: (Math.random() - 0.5) * 100, changesPercentage: (Math.random() - 0.5) * 2 },
    { symbol: 'GC=F', price: 2380 + Math.random() * 40, change: (Math.random() - 0.5) * 20, changesPercentage: (Math.random() - 0.5) * 1 },
    { symbol: 'CL=F', price: 78 + Math.random() * 4, change: (Math.random() - 0.5) * 3, changesPercentage: (Math.random() - 0.5) * 3 },
    { symbol: 'AAPL', price: 195 + Math.random() * 5, change: (Math.random() - 0.5) * 5, changesPercentage: (Math.random() - 0.5) * 2 },
    { symbol: 'NVDA', price: 130 + Math.random() * 10, change: (Math.random() - 0.5) * 8, changesPercentage: (Math.random() - 0.5) * 4 },
    { symbol: 'TSLA', price: 340 + Math.random() * 15, change: (Math.random() - 0.5) * 10, changesPercentage: (Math.random() - 0.5) * 3 },
    { symbol: 'SPY', price: 520 + Math.random() * 5, change: (Math.random() - 0.5) * 3, changesPercentage: (Math.random() - 0.5) * 0.5 },
    { symbol: 'QQQ', price: 450 + Math.random() * 5, change: (Math.random() - 0.5) * 4, changesPercentage: (Math.random() - 0.5) * 1 },
  ];
  return base.map(q => ({
    ...q,
    dayHigh: q.price + Math.random() * 10,
    dayLow: q.price - Math.random() * 10,
    volume: Math.floor(Math.random() * 10000000),
    marketCap: 0,
    previousClose: q.price - q.change,
    timestamp: Date.now(),
  }));
}

// ─── 브로드캐스트 ───
async function broadcastQuotes() {
  const quotes = await fetchQuotes();
  if (!quotes) return;

  // 실시간 시세 이벤트
  io.emit('quotes', {
    data: quotes,
    timestamp: lastPollAt,
    pollCount,
  });

  // 종목별 개별 이벤트 (필요한 종목만 수신 가능)
  quotes.forEach(q => {
    io.emit(`quote:${q.symbol}`, q);
  });
}

// ─── Health Check 엔드포인트 ───
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    clients: clientCount,
    lastPollAt,
    pollCount,
    errorCount,
    pollInterval: POLL_INTERVAL,
    symbols: SYMBOLS,
  });
});

// ─── 현재 상태 조회 (클라이언트 폴링용) ───
let lastQuotes = null;
app.get('/api/quotes', async (req, res) => {
  if (!lastQuotes) {
    lastQuotes = await fetchQuotes();
  }
  res.json({
    data: lastQuotes,
    timestamp: lastPollAt,
  });
});

// 원본 broadcastQuotes를 래핑해서 lastQuotes 캐시
const _origBroadcast = broadcastQuotes;
// (위 fetchQuotes에서 quotes를 반환하므로, 브로드캐스트 직전에 캐시)

// ─── Socket.io 이벤트 ───
io.on('connection', (socket) => {
  clientCount++;
  console.log(`[CONNECT] ${socket.id} — 총 ${clientCount}명 접속`);

  // 접속 즉시 최근 데이터 전송
  if (lastQuotes) {
    socket.emit('quotes', {
      data: lastQuotes,
      timestamp: lastPollAt,
      pollCount,
    });
  }

  // 특정 심볼만 구독
  socket.on('subscribe', (symbols) => {
    const arr = Array.isArray(symbols) ? symbols : [symbols];
    arr.forEach(s => socket.join(`symbol:${s}`));
    console.log(`[SUBSCRIBE] ${socket.id} → ${arr.join(',')}`);
  });

  // 구독 해제
  socket.on('unsubscribe', (symbols) => {
    const arr = Array.isArray(symbols) ? symbols : [symbols];
    arr.forEach(s => socket.leave(`symbol:${s}`));
  });

  socket.on('disconnect', () => {
    clientCount--;
    console.log(`[DISCONNECT] ${socket.id} — 총 ${clientCount}명 접속`);
  });
});

// lastQuotes 캐시 업데이트를 위해 broadcastQuotes 수정
const originalFetchQuotes = fetchQuotes;
// Simple wrapper: after each broadcast, cache the result
const wrappedBroadcast = async () => {
  const quotes = await originalFetchQuotes();
  if (quotes) {
    lastQuotes = quotes;
    io.emit('quotes', { data: quotes, timestamp: lastPollAt, pollCount });
    quotes.forEach(q => io.emit(`quote:${q.symbol}`, q));
  }
};

// ─── 서버 시작 ───
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  SignalChart WebSocket Relay Server       ║');
  console.log(`║  Port: ${PORT}                              ║`);
  console.log(`║  Poll: ${POLL_INTERVAL / 1000}s interval                  ║`);
  console.log(`║  Symbols: ${SYMBOLS.length}                              ║`);
  console.log(`║  FMP Key: ${FMP_API_KEY ? '✓ Configured' : '✗ Missing'}${' '.repeat(24)}║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // 첫 조회 즉시 실행
  wrappedBroadcast();

  // 주기적 폴링 시작
  pollTimer = setInterval(wrappedBroadcast, POLL_INTERVAL);
});

// 종료 시 정리
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] 서버 종료 중...');
  if (pollTimer) clearInterval(pollTimer);
  io.close();
  server.close(() => process.exit(0));
});
