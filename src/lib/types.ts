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

// 주요 SYMBOL 목록 (클라이언트에서도 사용)
export const TRACKED_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'INTC',
  'SPY', 'QQQ', 'DIA', 'IWM',
  'GLD', 'SLV', 'USO',
  'CL=F', 'NG=F', 'BZ=F', // Crude, Natural Gas, Brent
];
