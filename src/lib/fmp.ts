// Market Data Client — FMP (Primary) + Mock (Fallback)
// SERVER ONLY: API Route(route.ts)에서만 임포트

import { Quote, NewsItem, CandleData, FearGreedIndex, EconomicCalendarItem } from './types';

// ─── API Keys ───
const FMP_API_KEY=process.env.FMP_API_KEY || '';
const FMP_BASE = 'https://financialmodelingprep.com/stable';
const FMP_SOURCE_URL = 'https://site.financialmodelingprep.com/developer/docs/economic-calendar-api';

// ─── 심볼 매핑: 내부 심볼 ↔ FMP (선물·지수는 `=F` 연속계약, ws-relay와 동일) ───
const INTERNAL_TO_FMP: Record<string, string> = {
  GCUSD: 'GCUSD',   // 금 선물 — FMP 실시간
  ESUSD: 'ESUSD',   // S&P 500 선물 — FMP 실시간 (참고용)
};

// ═══════════════════════════════════════════════════════════
//  yfinance 백엔드 시세
// ═══════════════════════════════════════════════════════════
const BACKEND_URL = process.env.BACKEND_URL || 'https://ai-signal-talk-backend.onrender.com';

async function getYfinanceQuotes(symbols: string[]): Promise<Quote[]> {
  const res = await fetch(`${BACKEND_URL}/api/v2/quotes`, {
    cache: 'no-store',
    headers: { 'Accept': 'application/json' },
  } as RequestInit);
  if (!res.ok) return [];
  const data: Array<{
    symbol: string;
    price: number;
    change: number;
    changePct: number;
    high: number;
    low: number;
    volume: number;
  }> = await res.json();

  return data.map((d) => ({
    symbol: d.symbol,
    price: d.price,
    changesPercentage: d.changePct,
    change: d.change,
    dayLow: d.low,
    dayHigh: d.high,
    yearHigh: 0,
    yearLow: 0,
    marketCap: 0,
    priceAvg50: 0,
    priceAvg200: 0,
    volume: d.volume,
    avgVolume: 0,
    exchange: '',
    open: 0,
    previousClose: d.price - d.change,
    eps: 0,
    pe: 0,
  }));
}

// ═══════════════════════════════════════════════════════════
//  실시간 시세 (Quote)
// ═══════════════════════════════════════════════════════════
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const mocks = getMockQuotes(symbols);
  const mockMap = new Map(mocks.map((q) => [q.symbol, q]));

  // 백엔드 yfinance 시세 먼저 시도
  try {
    const backendQuotes = await getYfinanceQuotes(symbols);
    if (backendQuotes.length > 0) {
      return symbols.map((sym) => backendQuotes.find((q) => q.symbol === sym) || mockMap.get(sym)!).filter(Boolean) as Quote[];
    }
  } catch (e) {
    console.warn('[yfinance] 백엔드 시세 실패:', e);
  }

  // FMP 시세 시도 (금 등)
  if (FMP_API_KEY) {
    try {
      const live = await fmpGetQuotes(symbols);
      if (live.length > 0) {
        return symbols.map((sym) => live.find((q) => q.symbol === sym) || mockMap.get(sym)!).filter(Boolean) as Quote[];
      }
    } catch (e) {
      console.warn('[FMP] getQuotes 실패:', e);
    }
  }

  return mocks;
}

function quoteFromFmpRow(raw: Record<string, unknown>, internalSymbol: string): Quote {
  const pct = Number(raw.changesPercentage ?? raw.changePercentage ?? 0);
  return {
    symbol: internalSymbol,
    price: Number(raw.price) || 0,
    changesPercentage: Number.isFinite(pct) ? pct : 0,
    change: Number(raw.change) || 0,
    dayLow: Number(raw.dayLow) || 0,
    dayHigh: Number(raw.dayHigh) || 0,
    yearHigh: Number(raw.yearHigh) || 0,
    yearLow: Number(raw.yearLow) || 0,
    marketCap: Number(raw.marketCap) || 0,
    priceAvg50: Number(raw.priceAvg50) || 0,
    priceAvg200: Number(raw.priceAvg200) || 0,
    volume: Number(raw.volume) || 0,
    avgVolume: Number(raw.avgVolume) || 0,
    exchange: String(raw.exchange || ''),
    open: Number(raw.open) || 0,
    previousClose: Number(raw.previousClose) || 0,
    eps: Number(raw.eps) || 0,
    pe: Number(raw.pe) || 0,
  };
}

/** FMP batch quote — 한 번의 HTTP로 병렬 개별 호출 대비 지연·레이트리밋 부담 감소 */
async function fmpGetQuotes(symbols: string[]): Promise<Quote[]> {
  if (symbols.length === 0) return [];

  const pairs = symbols.map((symbol) => ({
    internal: symbol,
    fmp: INTERNAL_TO_FMP[symbol] || symbol,
  }));

  const uniqFmp = [...new Set(pairs.map((p) => p.fmp))];
  const url = `${FMP_BASE}/quote?symbols=${encodeURIComponent(uniqFmp.join(','))}&apikey=${FMP_API_KEY}`;

  const res = await fetch(url, { cache: 'no-store' } as RequestInit);
  if (!res.ok) return [];

  const data: unknown = await res.json();
  const rows: Record<string, unknown>[] = Array.isArray(data)
    ? (data as Record<string, unknown>[])
    : data && typeof data === 'object'
      ? [data as Record<string, unknown>]
      : [];

  const byFmp = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const sym = String(row.symbol || '').trim();
    if (sym) byFmp.set(sym, row);
  }

  return pairs
    .map(({ internal, fmp }) => {
      const raw = byFmp.get(fmp);
      if (!raw || raw.price == null) return null;
      return quoteFromFmpRow(raw, internal);
    })
    .filter((r): r is Quote => r !== null);
}

// ═══════════════════════════════════════════════════════════
//  차트 데이터 (Candlestick)
// ═══════════════════════════════════════════════════════════
export async function getHistoricalChart(
  symbol: string,
  timeframe = '30min'
): Promise<CandleData[]> {
  if (FMP_API_KEY) {
    try {
      const data = await fmpGetChart(symbol, timeframe);
      if (data.length > 0) return data;
    } catch (e) {
      console.warn('[FMP] chart 실패, mock 폴백:', e);
    }
  }

  return getMockChartData(symbol);
}

async function fmpGetChart(symbol: string, timeframe: string): Promise<CandleData[]> {
  const fmpSym = INTERNAL_TO_FMP[symbol] || symbol;
  const periodMap: Record<string, string> = {
    '1min': '5min', '5min': '15min', '15min': '30min',
    '30min': '1hour', '1hour': '4hour', '1day': '1day',
  };
  const period = periodMap[timeframe] || '30min';

  const [chartRes, quoteRes] = await Promise.all([
    fetch(`${FMP_BASE}/historical-chart/${period}?symbol=${fmpSym}&apikey=${FMP_API_KEY}`, { cache: 'no-store' } as RequestInit),
    fetch(`${FMP_BASE}/quote?symbol=${fmpSym}&apikey=${FMP_API_KEY}`, { cache: 'no-store' } as RequestInit),
  ]);

  if (!chartRes.ok) throw new Error(`FMP Chart error: ${chartRes.status}`);
  const chartData = await chartRes.json();
  if (!Array.isArray(chartData)) throw new Error('Invalid chart data');

  const candles: CandleData[] = chartData.slice(-100).map((d: Record<string, string | number>) => ({
    timestamp: new Date(d.date as string).getTime(),
    open: Number(d.open), high: Number(d.high),
    low: Number(d.low), close: Number(d.close), volume: Number(d.volume),
  }));

  // 실시간 quote 마지막 캔들 append
  if (quoteRes.ok) {
    const quoteData = await quoteRes.json();
    if (Array.isArray(quoteData) && quoteData.length > 0) {
      const q = quoteData[0];
      candles.push({
        timestamp: Date.now(),
        open: Number(q.open), high: Number(q.dayHigh),
        low: Number(q.dayLow), close: Number(q.price), volume: Number(q.volume),
      });
    }
  }
  return candles;
}

// ═══════════════════════════════════════════════════════════
//  뉴스 (FMP 전용)
// ═══════════════════════════════════════════════════════════
export async function getNews(symbol = ''): Promise<NewsItem[]> {
  if (!FMP_API_KEY) return getMockNews();

  try {
    const tick = Date.now();
    const url = symbol
      ? `${FMP_BASE}/news?symbol=${symbol}&limit=30&apikey=${FMP_API_KEY}&_t=${tick}`
      : `${FMP_BASE}/news?limit=30&apikey=${FMP_API_KEY}&_t=${tick}`;
    const res = await fetch(url, { cache: 'no-store' } as RequestInit);
    if (!res.ok) throw new Error(`FMP News error: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return getMockNews();

    return data.slice(0, 20).map((item: Record<string, string>) => ({
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

// Economic calendar from FMP. Used by News Room sidebar for US macro releases.
export async function getEconomicCalendar(): Promise<EconomicCalendarItem[]> {
  // 무료 경제지표 캘린더 (Investing.com / faireconomy.media)
  try {
    const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      cache: 'no-store',
    } as RequestInit);
    if (!res.ok) throw new Error(`Economic Calendar error: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return getMockEconomicCalendar();

    return data
      .filter((item: Record<string, unknown>) => {
        const impact = String(item.impact || '').toLowerCase();
        return impact === 'high' || impact === 'medium';
      })
      .map((item: Record<string, unknown>, index: number) => {
        const event = String(item.title || item.event || '');
        return {
          id: `ec-${index}`,
          date: String(item.date || ''),
          country: String(item.country || 'US'),
          event,
          actual: String(item.actual || '-'),
          estimate: String(item.forecast || '-'),
          previous: String(item.previous || '-'),
          impact: (String(item.impact || 'Medium').toLowerCase() === 'high' ? 'high' : String(item.impact || 'Medium').toLowerCase() === 'low' ? 'low' : 'medium') as 'high' | 'medium' | 'low',
          source: 'Investing.com',
          sourceUrl: 'https://www.investing.com/economic-calendar/',
        } satisfies EconomicCalendarItem;
      })
      .slice(0, 8);
  } catch (error) {
    console.error('Economic Calendar error:', error);
    return getMockEconomicCalendar();
  }
}

function formatMacroValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
  return String(value);
}

function inferEconomicImpact(event: string): 'high' | 'medium' | 'low' {
  const normalized = event.toLowerCase();
  const high = ['cpi', 'pce', 'nonfarm', 'payroll', 'unemployment', 'fomc', 'fed', 'gdp', 'ppi', 'retail sales'];
  const medium = ['pmi', 'ism', 'jobless', 'durable', 'consumer confidence', 'housing', 'industrial production'];
  if (high.some((keyword) => normalized.includes(keyword))) return 'high';
  if (medium.some((keyword) => normalized.includes(keyword))) return 'medium';
  return 'low';
}

// ═══════════════════════════════════════════════════════════
//  Fear & Greed Index (CNN Markets)
// ═══════════════════════════════════════════════════════════
const CNN_FG_URL = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
const CNN_FG_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Referer': 'https://www.cnn.com/markets/fear-and-greed',
  'Origin': 'https://www.cnn.com',
};

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
    const res = await fetch(CNN_FG_URL, { headers: CNN_FG_HEADERS, cache: 'no-store' } as RequestInit);
    if (!res.ok) throw new Error(`CNN Fear & Greed error: ${res.status}`);
    const data = await res.json();
    const fg = data.fear_and_greed;
    if (!fg || fg.score === undefined) return getMockFearGreedIndex();

    const subIndicators: FearGreedIndex['subIndicators'] = [];
    for (const [key, label] of Object.entries(CNN_SUB_LABELS)) {
      const sub = data[key];
      if (sub && sub.score !== undefined) {
        subIndicators.push({
          key, label,
          score: typeof sub.score === 'number' ? Math.round(sub.score * 10) / 10 : 0,
          rating: sub.rating || '',
        });
      }
    }

    return {
      value: Math.round(fg.score * 100) / 100,
      valueClassification: capitalizeRating(fg.rating || 'Neutral'),
      timestamp: fg.timestamp || new Date().toISOString(),
      source: 'CNN Business',
      sourceUrl: 'https://www.cnn.com/markets/fear-and-greed',
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

// ═══════════════════════════════════════════════════════════
//  Mock Data
// ═══════════════════════════════════════════════════════════
export function getMockQuotes(symbols: string[]): Quote[] {
  const base: Record<string, Omit<Quote, 'symbol'>> = {
    'GCUSD': { price: 3325.4, changesPercentage: 0.13, change: 4.2, dayLow: 3298.0, dayHigh: 3340.0, yearHigh: 3500.0, yearLow: 2800.0, marketCap: 0, priceAvg50: 3280.0, priceAvg200: 3100.0, volume: 280000, avgVolume: 250000, exchange: 'COMMODITY', open: 3321.0, previousClose: 3321.2, eps: 0, pe: 0 },
    'NQUSD': { price: 21250.0, changesPercentage: 0.35, change: 74.0, dayLow: 21120.0, dayHigh: 21310.0, yearHigh: 22500.0, yearLow: 18500.0, marketCap: 0, priceAvg50: 20800.0, priceAvg200: 19800.0, volume: 150000, avgVolume: 120000, exchange: 'COMMODITY', open: 21176.0, previousClose: 21176.0, eps: 0, pe: 0 },
    'CLUSD': { price: 62.4, changesPercentage: -0.28, change: -0.18, dayLow: 61.9, dayHigh: 63.1, yearHigh: 82.5, yearLow: 55.0, marketCap: 0, priceAvg50: 65.0, priceAvg200: 71.0, volume: 250000, avgVolume: 220000, exchange: 'COMMODITY', open: 62.58, previousClose: 62.58, eps: 0, pe: 0 },
    'KSUSD': { price: 1186.0, changesPercentage: 0.22, change: 2.6, dayLow: 1178.0, dayHigh: 1192.0, yearHigh: 1250.0, yearLow: 1080.0, marketCap: 0, priceAvg50: 1165.0, priceAvg200: 1140.0, volume: 120000, avgVolume: 110000, exchange: 'KRX', open: 1183.4, previousClose: 1183.4, eps: 0, pe: 0 },
  };

  return symbols.map(symbol => ({
    symbol,
    ...(base[symbol] || {
      price: 100, changesPercentage: 0, change: 0, dayLow: 99, dayHigh: 101,
      yearHigh: 110, yearLow: 90, marketCap: 0, priceAvg50: 100, priceAvg200: 95,
      volume: 1000000, avgVolume: 1000000, exchange: 'NASDAQ',
      open: 99.50, previousClose: 99.50, eps: 2, pe: 20,
    }),
  }));
}

export function getMockNews(): NewsItem[] {
  return [
    { symbol: 'NQUSD', publishedDate: new Date().toISOString(), title: '나스닥 선물, 기술주 강세에 사상 최고치 경신', text: 'AI 반도체 수요 급증과 금리 인하 기대로 나스닥 선물이 강세를 보이고 있다.', source: 'Reuters', image: '', url: '#' },
    { symbol: 'GCUSD', publishedDate: new Date().toISOString(), title: '골드 $4,800 돌파 — 글로벌 불확실성 손실回避 수요 급증', text: '지정학적 리스크와 인플레이션 우려로 금 가격이 사상 최고치를 경신하고 있다.', source: 'CNBC', image: '', url: '#' },
    { symbol: 'CLUSD', publishedDate: new Date().toISOString(), title: 'WTI 원유, OPEC+ 감산 연장에 단기 강세 전망', text: '산유국 감산 합의로 원유 공급 축소 기대감이 반영되고 있다.', source: 'Bloomberg', image: '', url: '#' },
    { symbol: 'KSUSD', publishedDate: new Date().toISOString(), title: '코스피, 반도체주 강세에 상승 마감', text: 'AI 수혜주 중심의 매수세 유입으로 코스피가 상승세를 기록했다.', source: '연합뉴스', image: '', url: '#' },
  ];
}

export function getMockChartData(symbol = 'GCUSD'): CandleData[] {
  const now = Date.now();
  const config: Record<string, { basePrice: number; volatility: number }> = {
    'NQUSD': { basePrice: 21250, volatility: 25 },
    'GCUSD': { basePrice: 3325, volatility: 6 },
    'CLUSD': { basePrice: 62.4, volatility: 0.35 },
    'KSUSD': { basePrice: 1186, volatility: 2.5 },
  };
  const { basePrice, volatility } = config[symbol] || config['GCUSD'];
  const data: CandleData[] = [];
  let price = basePrice;
  for (let i = 0; i < 100; i++) {
    const t = now - (100 - i) * 5 * 60 * 1000;
    const change = (Math.random() - 0.48) * volatility;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    data.push({ timestamp: t, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2), volume: Math.floor(Math.random() * 100000) + 10000 });
    price = close;
  }
  return data;
}

export function getMockFearGreedIndex(): FearGreedIndex {
  return {
    value: 45, valueClassification: 'Fear', timestamp: new Date().toISOString(),
    source: 'CNN Business',
    sourceUrl: 'https://www.cnn.com/markets/fear-and-greed',
    previousClose: 42, previous1Week: 38, previous1Month: 55, previous1Year: 62,
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

function getMockEconomicCalendar(): EconomicCalendarItem[] {
  return [
    {
      id: 'mock-cpi',
      date: new Date().toISOString(),
      country: 'US',
      event: 'Consumer Price Index',
      actual: '-',
      estimate: '-',
      previous: '-',
      impact: 'high',
      source: 'Financial Modeling Prep',
      sourceUrl: FMP_SOURCE_URL,
    },
    {
      id: 'mock-nfp',
      date: new Date().toISOString(),
      country: 'US',
      event: 'Nonfarm Payrolls',
      actual: '-',
      estimate: '-',
      previous: '-',
      impact: 'high',
      source: 'Financial Modeling Prep',
      sourceUrl: FMP_SOURCE_URL,
    },
    {
      id: 'mock-jobless',
      date: new Date().toISOString(),
      country: 'US',
      event: 'Initial Jobless Claims',
      actual: '-',
      estimate: '-',
      previous: '-',
      impact: 'medium',
      source: 'Financial Modeling Prep',
      sourceUrl: FMP_SOURCE_URL,
    },
  ];
}
