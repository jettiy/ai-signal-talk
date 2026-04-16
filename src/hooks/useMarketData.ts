'use client';
import { useQuery } from '@tanstack/react-query';
import { TRACKED_SYMBOLS, type Quote } from '@/lib/types';

export type MarketQuote = Quote;

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
