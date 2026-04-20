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

export interface FearGreedIndex {
  value: number;          // 0~100
  valueClassification: string;  // 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed'
  timestamp: string;
  previousClose: number;
  previous1Week: number;
  previous1Month: number;
  previous1Year: number;
  subIndicators: FearGreedSubIndicator[];
}

export interface FearGreedSubIndicator {
  key: string;
  label: string;        // 한국어 라벨
  score: number;
  rating: string;
}

// ===== AI 시그널 결과 (확장 스키마) =====
export interface AiSignalResult {
  // 기존 필드 (하위 호환)
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  rationale: string;
  timeframe: string;
  signalType: 'LONG' | 'SHORT';
  model: string;

  // Z.AI 확장 필드 (optional — API에서 없을 수 있음)
  buyProbability?: number;       // 매수 확률 (0~100)
  sellProbability?: number;      // 매도 확률 (0~100)
  riskRewardRatio?: number;      // 손익비
  predictionType?: string;       // "다음 봉 예측" | "현재봉 마감"
  reasoning?: string;            // Thinking Mode 추론 과정 (빈 문자열 가능)
  sources?: SignalSource[];      // 참조 소스 (웹검색 결과)
}

export interface SignalSource {
  title: string;
  url: string;
  snippet: string;
}

// Z.AI 웹검색 결과
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  siteName: string;
  publishedDate?: string;
}

// 채팅 메시지 (Function Calling 에이전트)
export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  reasoning_content?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
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

// 시간프레임 → 예측 타입 매핑
export function getPredictionType(timeframe: string): string {
  if (timeframe === '1min' || timeframe === '5min') return '다음 봉 예측';
  return '현재봉 마감';
}

// 기존 주식 심볼 (참고용)
export const TRACKED_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'INTC',
  'SPY', 'QQQ', 'DIA', 'IWM',
  'GLD', 'SLV', 'USO',
  'GCUSD', 'CLUSD', 'NQUSD',
];

// ===== 유저 역할 (RBAC) =====
export type UserRole = 'BASIC' | 'PENDING' | 'PRO' | 'ADMIN';

// 상담 메시지
export interface ConsultMessage {
  role: 'user' | 'admin';
  text: string;
  time: string;
}

// 상담 대기열 아이템 (관리자용)
export interface ConsultQueueItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  appliedAt: string;
  status: 'waiting' | 'in_progress' | 'done';
  messages: ConsultMessage[];
}
