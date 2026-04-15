// FMP API Client
// https://site.financialmodelingprep.com/developer/docs

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

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

// 주요_SYMBOL 목록
export const TRACKED_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'INTC',
  'SPY', 'QQQ', 'DIA', 'IWM',
  'GLD', 'SLV', 'USO',
  'CL=F', 'NG=F', 'BZ=F', // Crude, Natural Gas, Brent
];

// 실시간 시세 조회
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (!FMP_API_KEY) {
    console.warn('FMP_API_KEY not set, returning mock data');
    return getMockQuotes(symbols);
  }

  try {
    const symbolsParam = symbols.join(',');
    const res = await fetch(
      `${FMP_BASE}/quote/${symbolsParam}?apikey=${FMP_API_KEY}`,
      { next: { revalidate: 10 } }
    );

    if (!res.ok) throw new Error(`FMP API error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('FMP getQuotes error:', error);
    return getMockQuotes(symbols);
  }
}

// 뉴스 조회
export async function getNews(symbol = ''): Promise<NewsItem[]> {
  if (!FMP_API_KEY) {
    return getMockNews();
  }

  try {
    const url = symbol
      ? `${FMP_BASE}/stock_news?ticker=${symbol}&apikey=${FMP_API_KEY}`
      : `${FMP_BASE}/stock_news?limit=50&apikey=${FMP_API_KEY}`;

    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error(`FMP News error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('FMP getNews error:', error);
    return getMockNews();
  }
}

// 차트 데이터 (Candlestick)
export async function getHistoricalChart(
  symbol: string,
  timeframe = '30min' // 1min, 5min, 15min, 30min, 1hour, 4hour, daily
): Promise<{timestamp: number; open: number; high: number; low: number; close: number; volume: number}[]> {
  if (!FMP_API_KEY) {
    return getMockChartData();
  }

  const periodMap: Record<string, string> = {
    '1M': '5min',
    '5M': '15min',
    '15M': '30min',
    '30M': '1hour',
    '1H': '4hour',
    '1D': 'daily',
  };

  const period = periodMap[timeframe] || '30min';

  try {
    const res = await fetch(
      `${FMP_BASE}/historical-chart/${period}/${symbol}?apikey=${FMP_API_KEY}`,
      { next: { revalidate: 30 } }
    );

    if (!res.ok) throw new Error(`FMP Chart error: ${res.status}`);
    const data = await res.json();
    
    return data.slice(-100).map((d: Record<string, number>) => ({
      timestamp: new Date(d.date).getTime(),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));
  } catch (error) {
    console.error('FMP getHistoricalChart error:', error);
    return getMockChartData();
  }
}

// ========== Mock Data (API 키 없을 때) ==========

export function getMockQuotes(symbols: string[]): Quote[] {
  const base: Record<string, Omit<Quote, 'symbol'>> = {
    'AAPL': { price: 189.45, changesPercentage: 1.23, change: 2.30, dayLow: 187.00, dayHigh: 190.10, yearHigh: 199.62, yearLow: 164.08, marketCap: 2940000000000, priceAvg50: 185.20, priceAvg200: 178.50, volume: 52432100, avgVolume: 48000000, exchange: 'NASDAQ', open: 187.15, previousClose: 187.15, eps: 6.58, pe: 28.80 },
    'NVDA': { price: 875.32, changesPercentage: 3.45, change: 29.21, dayLow: 846.00, dayHigh: 882.50, yearHigh: 974.00, yearLow: 495.22, marketCap: 2150000000000, priceAvg50: 820.00, priceAvg200: 750.00, volume: 38234500, avgVolume: 35000000, exchange: 'NASDAQ', open: 846.11, previousClose: 846.11, eps: 3.20, pe: 273.50 },
    'SPY': { price: 522.18, changesPercentage: 0.87, change: 4.51, dayLow: 518.50, dayHigh: 523.80, yearHigh: 531.20, yearLow: 480.00, marketCap: 0, priceAvg50: 515.00, priceAvg200: 500.00, volume: 78234500, avgVolume: 75000000, exchange: 'NYSE', open: 517.67, previousClose: 517.67, eps: 22.10, pe: 23.60 },
    'QQQ': { price: 448.72, changesPercentage: 1.15, change: 5.10, dayLow: 443.20, dayHigh: 450.50, yearHigh: 460.00, yearLow: 400.00, marketCap: 0, priceAvg50: 440.00, priceAvg200: 420.00, volume: 45234500, avgVolume: 42000000, exchange: 'NASDAQ', open: 443.62, previousClose: 443.62, eps: 9.80, pe: 45.80 },
    'GLD': { price: 2184.30, changesPercentage: 0.45, change: 9.80, dayLow: 2170.00, dayHigh: 2195.00, yearHigh: 2250.00, yearLow: 1800.00, marketCap: 0, priceAvg50: 2150.00, priceAvg200: 2050.00, volume: 8423000, avgVolume: 8000000, exchange: 'NYSE', open: 2174.50, previousClose: 2174.50, eps: 0, pe: 0 },
    'CL=F': { price: 93.12, changesPercentage: -1.23, change: -1.16, dayLow: 92.50, dayHigh: 94.80, yearHigh: 124.60, yearLow: 72.50, marketCap: 0, priceAvg50: 95.00, priceAvg200: 88.00, volume: 320000, avgVolume: 300000, exchange: 'NYMEX', open: 94.28, previousClose: 94.28, eps: 0, pe: 0 },
    'TSLA': { price: 245.67, changesPercentage: -2.34, change: -5.88, dayLow: 242.00, dayHigh: 252.30, yearHigh: 299.29, yearLow: 138.80, marketCap: 780000000000, priceAvg50: 250.00, priceAvg200: 220.00, volume: 95234000, avgVolume: 90000000, exchange: 'NASDAQ', open: 251.55, previousClose: 251.55, eps: 4.20, pe: 58.50 },
    'META': { price: 502.34, changesPercentage: 1.78, change: 8.78, dayLow: 493.00, dayHigh: 505.20, yearHigh: 531.49, yearLow: 350.00, marketCap: 1280000000000, priceAvg50: 485.00, priceAvg200: 440.00, volume: 18234000, avgVolume: 16000000, exchange: 'NASDAQ', open: 493.56, previousClose: 493.56, eps: 22.50, pe: 22.30 },
  };

  return symbols.map(symbol => ({
    symbol,
    ...(base[symbol] || {
      price: 100,
      changesPercentage: 0,
      change: 0,
      dayLow: 99,
      dayHigh: 101,
      yearHigh: 110,
      yearLow: 90,
      marketCap: 0,
      priceAvg50: 100,
      priceAvg200: 95,
      volume: 1000000,
      avgVolume: 1000000,
      exchange: 'NASDAQ',
      open: 99.50,
      previousClose: 99.50,
      eps: 2,
      pe: 20,
    }),
  }));
}

export function getMockNews(): NewsItem[] {
  return [
    {
      symbol: 'NVDA',
      publishedDate: new Date().toISOString(),
      title: '엔비디아, AI 칩 수요 폭발적 증가로 사상 최대 분기 매출 경신',
      text: '엔비디아가 4분기에预期的을 뛰어넘는 실적을 기록하며 AI 칩 시장에 강력한 수요가 있음을 입증했다.',
      source: 'Reuters',
      image: '',
      url: '#',
    },
    {
      symbol: 'SPY',
      publishedDate: new Date().toISOString(),
      title: '美 Fed, 금리 동결 유지を発表 — 2026년 인하 기대 여부 논쟁',
      text: '연방준비위원회는 만장일치로 기준금리를 현재 수준으로 유지한다고 밝혔다.',
      source: 'Bloomberg',
      image: '',
      url: '#',
    },
    {
      symbol: 'CL=F',
      publishedDate: new Date().toISOString(),
      title: '호르만자 해협 긴장 지속 — WTI 원유 93달러 台',
      text: '이란-미국 협상 진행 속에서 원유 공급 불안이 이어지고 있다.',
      source: 'CNBC',
      image: '',
      url: '#',
    },
    {
      symbol: 'TSLA',
      publishedDate: new Date().toISOString(),
      title: '테슬라, 완전자율주행 기대감에 투자자들 급매집중',
      text: '테슬라의 Robotaxi 서비스 구체化期待が高まっている中、주가가 변동성을 보이고 있다.',
      source: 'Reuters',
      image: '',
      url: '#',
    },
    {
      symbol: 'META',
      publishedDate: new Date().toISOString(),
      title: '메타, AI 광고 매출 증가로 시장 기대를 상회',
      text: '메타의 새로운 AI 기반 광고 플랫폼이 광고주의 만족도를 높이며 매출 성장에 기여했다.',
      source: 'Bloomberg',
      image: '',
      url: '#',
    },
  ];
}

export function getMockChartData() {
  const now = Date.now();
  const data = [];
  let price = 180;

  for (let i = 0; i < 100; i++) {
    const t = now - (100 - i) * 5 * 60 * 1000; // 5분봉
    const change = (Math.random() - 0.48) * 2;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 0.5;
    const low = Math.min(open, close) - Math.random() * 0.5;
    data.push({
      timestamp: t,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(Math.random() * 100000) + 10000,
    });
    price = close;
  }
  return data;
}
