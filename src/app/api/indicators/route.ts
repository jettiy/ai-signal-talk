// /api/indicators — Twelve Data 기술적 지표
import { NextRequest, NextResponse } from 'next/server';

const TD_API_KEY = process.env.TWELVE_DATA_API_KEY || '';
const TD_BASE = 'https://api.twelvedata.com';
const TD_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const SYMBOL_MAP: Record<string, string> = {
  NQUSD: 'QQQ', GCUSD: 'GLD', CLUSD: 'USO',
  BTCUSD: 'BTC/USD', ETHUSD: 'ETH/USD',
  AAPL: 'AAPL', NVDA: 'NVDA', TSLA: 'TSLA', META: 'META',
  MSFT: 'MSFT', AMZN: 'AMZN', GOOGL: 'GOOGL', AMD: 'AMD',
};

function getTdSymbol(symbol: string): string {
  return SYMBOL_MAP[symbol] || symbol;
}

// timeframe 매핑: 우리 내부 → Twelve Data
const TF_MAP: Record<string, string> = {
  '1min': '1min', '5min': '5min', '15min': '15min',
  '30min': '30min', '1hour': '1h', '1day': '1day',
};

interface IndicatorResult {
  symbol: string;
  timeframe: string;
  rsi?: { value: number; signal: '과매수' | '과매도' | '중립' };
  macd?: { macd: number; signal: number; histogram: number; crossover: '상향돌파' | '하향돌파' | '없음' };
  bb?: { upper: number; middle: number; lower: number; percentB: number; position: '상단밴드 근접' | '하단밴드 근접' | '중간' };
  stoch?: { k: number; d: number; signal: '과매수' | '과매도' | '중립' };
  ema20?: number;
  sma50?: number;
  sma200?: number;
  timestamp: string;
}

async function fetchTd(endpoint: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ ...params, apikey: TD_API_KEY }).toString();
  const url = `${TD_BASE}${endpoint}?${qs}`;
  const req = new Request(url, { headers: { 'User-Agent': TD_UA }, cache: 'no-store' });
  const res = await fetch(req);
  if (!res.ok) throw new Error(`TD ${endpoint}: ${res.status}`);
  return res.json();
}

function getTdTimeframe(tf: string): string {
  return TF_MAP[tf] || '15min';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'NQUSD';
  const timeframe = searchParams.get('timeframe') || '15min';

  if (!TD_API_KEY) {
    return NextResponse.json({ error: 'Twelve Data API key not configured' }, { status: 503 });
  }

  const tdSymbol = getTdSymbol(symbol);
  const tdTf = getTdTimeframe(timeframe);
  const results: IndicatorResult = {
    symbol,
    timeframe,
    timestamp: new Date().toISOString(),
  };

  // 병렬로 모든 지표 호출
  try {
    const [rsiRes, macdRes, bbRes, stochRes, emaRes, sma50Res, sma200Res] = await Promise.allSettled([
      fetchTd('/indicators/rsi', { symbol: tdSymbol, interval: tdTf, outputsize: '1', series_type: 'close' }),
      fetchTd('/indicators/macd', { symbol: tdSymbol, interval: tdTf, outputsize: '1', series_type: 'close' }),
      fetchTd('/indicators/bbands', { symbol: tdSymbol, interval: tdTf, outputsize: '1', series_type: 'close' }),
      fetchTd('/indicators/stoch', { symbol: tdSymbol, interval: tdTf, outputsize: '1' }),
      fetchTd('/indicators/ema', { symbol: tdSymbol, interval: tdTf, outputsize: '1', period: '20', series_type: 'close' }),
      fetchTd('/indicators/sma', { symbol: tdSymbol, interval: tdTf, outputsize: '1', period: '50', series_type: 'close' }),
      fetchTd('/indicators/sma', { symbol: tdSymbol, interval: tdTf, outputsize: '1', period: '200', series_type: 'close' }),
    ]);

    // ── RSI ──
    if (rsiRes.status === 'fulfilled') {
      const vals = rsiRes.value.values;
      if (vals && vals.length > 0) {
        const rsiVal = Number(vals[0].rsi);
        results.rsi = {
          value: Math.round(rsiVal * 10) / 10,
          signal: rsiVal >= 70 ? '과매수' : rsiVal <= 30 ? '과매도' : '중립',
        };
      }
    }

    // ── MACD ──
    if (macdRes.status === 'fulfilled') {
      const vals = macdRes.value.values;
      if (vals && vals.length > 0) {
        const macdVal = Number(vals[0].macd);
        const signalVal = Number(vals[0].macd_signal);
        const hist = Number(vals[0].macd_hist);
        results.macd = {
          macd: Math.round(macdVal * 100) / 100,
          signal: Math.round(signalVal * 100) / 100,
          histogram: Math.round(hist * 100) / 100,
          crossover: hist > 0 && vals.length > 1 && Number(vals[1]?.macd_hist) <= 0 ? '상향돌파'
            : hist < 0 && vals.length > 1 && Number(vals[1]?.macd_hist) >= 0 ? '하향돌파' : '없음',
        };
      }
    }

    // ── Bollinger Bands ──
    if (bbRes.status === 'fulfilled') {
      const vals = bbRes.value.values;
      if (vals && vals.length > 0) {
        const upper = Number(vals[0].upper_band);
        const middle = Number(vals[0].middle_band);
        const lower = Number(vals[0].lower_band);
        // %B = (close - lower) / (upper - lower)
        const quoteRes = await fetchTd('/price', { symbol: tdSymbol }).catch(() => null);
        const price = quoteRes?.price ? Number(quoteRes.price) : middle;
        const percentB = upper !== lower ? (price - lower) / (upper - lower) : 0.5;
        results.bb = {
          upper: Math.round(upper * 100) / 100,
          middle: Math.round(middle * 100) / 100,
          lower: Math.round(lower * 100) / 100,
          percentB: Math.round(percentB * 100) / 100,
          position: percentB > 0.8 ? '상단밴드 근접' : percentB < 0.2 ? '하단밴드 근접' : '중간',
        };
      }
    }

    // ── Stochastic ──
    if (stochRes.status === 'fulfilled') {
      const vals = stochRes.value.values;
      if (vals && vals.length > 0) {
        const kVal = Number(vals[0].slow_k);
        const dVal = Number(vals[0].slow_d);
        results.stoch = {
          k: Math.round(kVal * 10) / 10,
          d: Math.round(dVal * 10) / 10,
          signal: kVal >= 80 ? '과매수' : kVal <= 20 ? '과매도' : '중립',
        };
      }
    }

    // ── EMA 20 ──
    if (emaRes.status === 'fulfilled') {
      const vals = emaRes.value.values;
      if (vals && vals.length > 0) {
        results.ema20 = Math.round(Number(vals[0].ema) * 100) / 100;
      }
    }

    // ── SMA 50 ──
    if (sma50Res.status === 'fulfilled') {
      const vals = sma50Res.value.values;
      if (vals && vals.length > 0) {
        results.sma50 = Math.round(Number(vals[0].sma) * 100) / 100;
      }
    }

    // ── SMA 200 ──
    if (sma200Res.status === 'fulfilled') {
      const vals = sma200Res.value.values;
      if (vals && vals.length > 0) {
        results.sma200 = Math.round(Number(vals[0].sma) * 100) / 100;
      }
    }
  } catch (err) {
    console.error('[Indicators] fetch error:', err);
  }

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
    },
  });
}
