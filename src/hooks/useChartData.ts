'use client';
import { useQuery } from '@tanstack/react-query';
import { type CandleData } from '@/lib/types';

export function useChartData(symbol: string, timeframe = '30min') {
  return useQuery<CandleData[]>({
    queryKey: ['chart', symbol, timeframe],
    queryFn: async () => {
      const params = new URLSearchParams({ symbol, timeframe });
      const res = await fetch(`/api/chart?${params}`);
      if (!res.ok) throw new Error('Failed to fetch chart data');
      return res.json();
    },
    refetchInterval: 30000,
    enabled: !!symbol,
  });
}
