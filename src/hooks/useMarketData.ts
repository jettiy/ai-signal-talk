'use client';
import { useQuery } from '@tanstack/react-query';
import { TRACKED_SYMBOLS, type Quote } from '@/lib/types';

export type MarketQuote = Quote;

export function useMarketData(selectedSymbol?: string) {
  const query = useQuery<MarketQuote[]>({
    queryKey: ['market-data'],
    queryFn: async () => {
      const res = await fetch('/api/market-data');
      if (!res.ok) throw new Error('Failed to fetch market data');
      return res.json();
    },
    refetchInterval: 10000,
  });

  // 선택된 심볼이 있으면 해당 심볼만 필터링
  if (selectedSymbol && query.data) {
    const filtered = query.data.filter(q => q.symbol === selectedSymbol);
    return { ...query, data: filtered.length > 0 ? filtered : query.data };
  }
  return query;
}
