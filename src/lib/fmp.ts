// FMP API Client — SERVER ONLY
// 이 파일은 API Route(route.ts)에서만 임포트해야 함
// 클라이언트 번들에 절대 포함되지 않도록 주의

import { Quote, NewsItem, CandleData, FearGreedIndex } from './types';

const FMP_API_KEY = process.env.FMP_API_KEY || '';
const FMP_BASE = 'https://financialmodelingprep.com/stable';

// 구독 가능한 심볼 목록 (골드선물 + 주요 주식/ETF)
const AVAILABLE_SYMBOLS = [
  'GCUSD',   // 골드선물
  'AAPL', 'NVDA', 'TSLA', 'META', 'MSFT', 'AMZN',
  'SPY', 'QQQ',
];

// 실시간 시세 조회 (개별 심볼 병렬 호출)
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (!FMP_API_KEY) {
    console.warn('FMP_API_KEY not set, returning mock data');
    return getMockQuotes(symbols);
  }

  try {
    const validSymbols = symbols.filter(s => AVAILABLE_SYMBOLS.includes(s));
    const results = await Promise.all(
      validSymbols.map(async (symbol) => {
        const res = await fetch(
          `${FMP_BASE}/quote?symbol=${symbol}&apikey=${FMP_API_KEY}`,
          { cache: 'no-store' } as RequestInit
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.length === 0) return null;
        const raw = data[0];
        // stable API 응답 → Quote 타입 매핑
        return {
          symbol: raw.symbol,
          price: raw.price ?? 0,
          changesPercentage: raw.changePercentage ?? 0,
          change: raw.change ?? 0,
          dayLow: raw.dayLow ?? 0,
          dayHigh: raw.dayHigh ?? 0,
          yearHigh: raw.yearHigh ?? 0,
          yearLow: raw.yearLow ?? 0,
          marketCap: raw.marketCap ?? 0,
          priceAvg50: raw.priceAvg50 ?? 0,
          priceAvg200: raw.priceAvg200 ?? 0,
          volume: raw.volume ?? 0,
          avgVolume: raw.avgVolume ?? 0,
          exchange: raw.exchange ?? '',
          open: raw.open ?? 0,
          previousClose: raw.previousClose ?? 0,
          eps: raw.eps ?? 0,
          pe: raw.pe ?? 0,
        } as Quote;
      })
    );
    // null 제거
    return results.filter((r): r is Quote => r !== null);
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
      ? `${FMP_BASE}/news?symbol=${symbol}&limit=20&apikey=${FMP_API_KEY}`
      : `${FMP_BASE}/news?limit=20&apikey=${FMP_API_KEY}`;

    const res = await fetch(url, { cache: 'no-store' } as RequestInit);
    if (!res.ok) throw new Error(`FMP News error: ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data)) return getMockNews();

    return data.slice(0, 10).map((item: Record<string, string>) => ({
      symbol: item.symbol || '',
      publishedDate: item.publishedDate || new Date().toISOString(),
      title: item.title || '',
      text: item.text || item.description || '',
      source: item.source || item.site || '',
      image: item.image || '',
      url: item.url || '#',
    }));
  } catch (error) {
    console.error('FMP getNews error:', error);
    return getMockNews();
  }
}

// 차트 데이터 (Candlestick)
export async function getHistoricalChart(
  symbol: string,
  timeframe = '30min'
): Promise<CandleData[]> {
  if (!FMP_API_KEY) {
    return getMockChartData();
  }

  const periodMap: Record<string, string> = {
    '1M': '5min',
    '5M': '15min',
    '15M': '30min',
    '30M': '1hour',
    '1H': '4hour',
    '1D': '1day',
  };

  const period = periodMap[timeframe] || '30min';

  try {
    const res = await fetch(
      `${FMP_BASE}/historical-chart/${period}?symbol=${symbol}&apikey=${FMP_API_KEY}`,
      { cache: 'no-store' } as RequestInit
    );

    if (!res.ok) throw new Error(`FMP Chart error: ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data)) return getMockChartData();

    return data.slice(-100).map((d: Record<string, string | number>) => ({
      timestamp: new Date(d.date as string).getTime(),
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close),
      volume: Number(d.volume),
    }));
  } catch (error) {
    console.error('FMP getHistoricalChart error:', error);
    return getMockChartData();
  }
}

// Fear & Greed Index 조회 (CNN Markets)
const CNN_FG_URL = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
const CNN_FG_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Referer': 'https://www.cnn.com/markets/fear-and-greed',
  'Origin': 'https://www.cnn.com',
};

// CNN 서브 지표 키 → 한국어 라벨
const CNN_SUB_LABELS: Record<string, string> = {
  market_momentum_sp500: '시장 모멘텀',
  stock_price_strength: '주가 강도',
  stock_price_breadth: '주가 폭',
  put_call_options: '풋/콜 옵션',
  market_volatility_vix: 'VIX 변동성',
  junk_bond_demand: '정크본드 수요',
  safe_haven_demand: '안전자산 수요',
};

export async function getFearGreedIndex(): Promise<FearGreedIndex> {
  try {
    const res = await fetch(CNN_FG_URL, {
      headers: CNN_FG_HEADERS,
      cache: 'no-store',
    } as RequestInit);

    if (!res.ok) throw new Error(`CNN Fear & Greed error: ${res.status}`);
    const data = await res.json();

    const fg = data.fear_and_greed;
    if (!fg || fg.score === undefined) {
      return getMockFearGreedIndex();
    }

    // 서브 지표 추출
    const subIndicators: FearGreedIndex['subIndicators'] = [];
    for (const [key, label] of Object.entries(CNN_SUB_LABELS)) {
      const sub = data[key];
      if (sub && sub.score !== undefined) {
        subIndicators.push({
          key,
          label,
          score: typeof sub.score === 'number' ? Math.round(sub.score * 10) / 10 : 0,
          rating: sub.rating || '',
        });
      }
    }

    return {
      value: Math.round(fg.score * 100) / 100,
      valueClassification: capitalizeRating(fg.rating || 'Neutral'),
      timestamp: fg.timestamp || new Date().toISOString(),
      previousClose: fg.previous_close ?? 0,
      previous1Week: fg.previous_1_week ?? 0,
      previous1Month: fg.previous_1_month ?? 0,
      previous1Year: fg.previous_1_year ?? 0,
      subIndicators,
    };
  } catch (error) {
    console.error('CNN getFearGreedIndex error:', error);
    return getMockFearGreedIndex();
  }
}

function capitalizeRating(r: string): string {
  return r.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ========== Mock Data (API 키 없을 때) ==========

export function getMockQuotes(symbols: string[]): Quote[] {
  const base: Record<string, Omit<Quote, 'symbol'>> = {
    'GCUSD': { price: 4814.7, changesPercentage: 0.13, change: 6.4, dayLow: 4785.9, dayHigh: 4827.2, yearHigh: 5626.8, yearLow: 3123.3, marketCap: 0, priceAvg50: 4891.3, priceAvg200: 4377.5, volume: 28029, avgVolume: 25000, exchange: 'COMMODITY', open: 4811.8, previousClose: 4808.3, eps: 0, pe: 0 },
    'AAPL': { price: 263.4, changesPercentage: 1.23, change: 3.2, dayLow: 260.0, dayHigh: 264.5, yearHigh: 270.0, yearLow: 200.0, marketCap: 4000000000000, priceAvg50: 255.0, priceAvg200: 240.0, volume: 52432100, avgVolume: 48000000, exchange: 'NASDAQ', open: 260.5, previousClose: 260.2, eps: 6.58, pe: 40.0 },
    'NVDA': { price: 198.35, changesPercentage: 3.45, change: 6.6, dayLow: 192.0, dayHigh: 200.5, yearHigh: 210.0, yearLow: 100.0, marketCap: 4800000000000, priceAvg50: 185.0, priceAvg200: 160.0, volume: 38234500, avgVolume: 35000000, exchange: 'NASDAQ', open: 191.8, previousClose: 191.7, eps: 3.20, pe: 61.8 },
    'TSLA': { price: 388.9, changesPercentage: -2.34, change: -9.3, dayLow: 382.0, dayHigh: 400.0, yearHigh: 420.0, yearLow: 250.0, marketCap: 1200000000000, priceAvg50: 370.0, priceAvg200: 340.0, volume: 95234000, avgVolume: 90000000, exchange: 'NASDAQ', open: 398.2, previousClose: 398.2, eps: 4.20, pe: 92.6 },
    'SPY': { price: 701.66, changesPercentage: 0.87, change: 6.1, dayLow: 696.0, dayHigh: 703.0, yearHigh: 710.0, yearLow: 600.0, marketCap: 0, priceAvg50: 690.0, priceAvg200: 660.0, volume: 78234500, avgVolume: 75000000, exchange: 'NYSE', open: 695.6, previousClose: 695.6, eps: 22.10, pe: 31.8 },
    'QQQ': { price: 640.47, changesPercentage: 1.15, change: 7.3, dayLow: 633.0, dayHigh: 642.0, yearHigh: 650.0, yearLow: 550.0, marketCap: 0, priceAvg50: 625.0, priceAvg200: 600.0, volume: 45234500, avgVolume: 42000000, exchange: 'NASDAQ', open: 633.2, previousClose: 633.2, eps: 9.80, pe: 65.4 },
    'META': { price: 676.87, changesPercentage: 1.78, change: 11.8, dayLow: 665.0, dayHigh: 680.0, yearHigh: 690.0, yearLow: 500.0, marketCap: 1700000000000, priceAvg50: 650.0, priceAvg200: 600.0, volume: 18234000, avgVolume: 16000000, exchange: 'NASDAQ', open: 665.1, previousClose: 665.1, eps: 22.50, pe: 30.1 },
    'MSFT': { price: 420.26, changesPercentage: 0.65, change: 2.7, dayLow: 417.0, dayHigh: 422.0, yearHigh: 430.0, yearLow: 370.0, marketCap: 3100000000000, priceAvg50: 410.0, priceAvg200: 390.0, volume: 22000000, avgVolume: 20000000, exchange: 'NASDAQ', open: 417.6, previousClose: 417.6, eps: 12.0, pe: 35.0 },
    'AMZN': { price: 249.7, changesPercentage: 0.92, change: 2.3, dayLow: 247.0, dayHigh: 251.0, yearHigh: 260.0, yearLow: 180.0, marketCap: 2600000000000, priceAvg50: 240.0, priceAvg200: 220.0, volume: 30000000, avgVolume: 28000000, exchange: 'NASDAQ', open: 247.4, previousClose: 247.4, eps: 5.0, pe: 49.9 },
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
      text: '엔비디아가 4분기 예상치를 뛰어넘는 실적을 기록하며 AI 칩 시장에 강력한 수요가 있음을 입증했다.',
      source: 'Reuters',
      image: '',
      url: '#',
    },
    {
      symbol: 'SPY',
      publishedDate: new Date().toISOString(),
      title: '美 Fed, 금리 동결 유지 발표 — 2026년 인하 기대 여부 논쟁',
      text: '연방준비위원회는 만장일치로 기준금리를 현재 수준으로 유지한다고 밝혔다.',
      source: 'Bloomberg',
      image: '',
      url: '#',
    },
    {
      symbol: 'GCUSD',
      publishedDate: new Date().toISOString(),
      title: '골드 $4,800 돌파 — 글로벌 불확실성 손실回避 수요 급증',
      text: '지정학적 리스크와 인플레이션 우려로 금 가격이 사상 최고치를 경신하고 있다.',
      source: 'CNBC',
      image: '',
      url: '#',
    },
    {
      symbol: 'TSLA',
      publishedDate: new Date().toISOString(),
      title: '테슬라, 완전자율주행 기대감에 투자자들 급매집중',
      text: '테슬라의 Robotaxi 서비스 구체화 기대가 높아지는 가운데, 주가가 변동성을 보이고 있다.',
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

export function getMockChartData(): CandleData[] {
  const now = Date.now();
  const data: CandleData[] = [];
  let price = 4810;

  for (let i = 0; i < 100; i++) {
    const t = now - (100 - i) * 5 * 60 * 1000;
    const change = (Math.random() - 0.48) * 4;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
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

export function getMockFearGreedIndex(): FearGreedIndex {
  return {
    value: 45,
    valueClassification: 'Fear',
    timestamp: new Date().toISOString(),
    previousClose: 42,
    previous1Week: 38,
    previous1Month: 55,
    previous1Year: 62,
    subIndicators: [
      { key: 'market_momentum_sp500', label: '시장 모멘텀', score: 35, rating: 'fear' },
      { key: 'stock_price_strength', label: '주가 강도', score: 28, rating: 'extreme fear' },
      { key: 'stock_price_breadth', label: '주가 폭', score: 42, rating: 'fear' },
      { key: 'put_call_options', label: '풋/콜 옵션', score: 55, rating: 'neutral' },
      { key: 'market_volatility_vix', label: 'VIX 변동성', score: 60, rating: 'greed' },
      { key: 'junk_bond_demand', label: '정크본드 수요', score: 48, rating: 'neutral' },
      { key: 'safe_haven_demand', label: '안전자산 수요', score: 30, rating: 'fear' },
    ],
  };
}
