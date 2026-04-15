'use client';
import { useQuery } from '@tanstack/react-query';
import { TRACKED_SYMBOLS } from '@/lib/fmp';

export interface MarketQuote {
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

export function useMarketData(selectedSymbol?: string) {
  return useQuery<MarketQuote[]>({
    queryKey: ['market-data'],
    queryFn: async () => {
      const res = await fetch('/api/market-data');
      if (!res.ok) throw new Error('Failed to fetch market data');
      return res.json();
    },
    refetchInterval: 10000,
  });
}