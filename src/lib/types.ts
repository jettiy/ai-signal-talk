// 공개 타입 & 상수 — 클라이언트/서버 공유
// API 키, URL 등 민감 정보 절대 포함 금지

export interface Quote {
  symbol: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
}

export interface NewsItem {
  symbol: string;
  publishedDate: string;
  title: string;
  text: string;
  source: string;
  image: string;
  url: string;
}

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AiSignalResult {
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  rationale: string;
  timeframe: string;
  signalType: 'LONG' | 'SHORT';
  model: string;
}

// FMP 대시보드 기본 종목 (현재 구독에서 사용 가능한 심볼)
export const FUTURES_SYMBOLS = {
  GC: { symbol: 'GCUSD', label: '골드선물', fmpChart: 'GCUSD' },
  AAPL: { symbol: 'AAPL', label: '애플', fmpChart: 'AAPL' },
  NVDA: { symbol: 'NVDA', label: '엔비디아', fmpChart: 'NVDA' },
} as const;

export type FuturesTab = keyof typeof FUTURES_SYMBOLS;

// 차트 시간프레임
export const TIMEFRAMES = [
  { label: '1M', value: '1min' },
  { label: '5M', value: '5min' },
  { label: '15M', value: '15min' },
  { label: '1H', value: '1hour' },
  { label: '1D', value: '1day' },
] as const;

// 기존 주식 심볼 (참고용)
export const TRACKED_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'INTC',
  'SPY', 'QQQ', 'DIA', 'IWM',
  'GLD', 'SLV', 'USO',
  'GCUSD', 'CLUSD', 'NQUSD',
];
