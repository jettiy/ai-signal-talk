'use client';
import { useQuery } from '@tanstack/react-query';
import { type FearGreedIndex } from '@/lib/types';

export type { FearGreedIndex };

export function useFearGreed() {
  return useQuery<FearGreedIndex>({
    queryKey: ['fear-greed'],
    queryFn: async () => {
      const res = await fetch('/api/fear-greed');
      if (!res.ok) throw new Error('Failed to fetch Fear & Greed Index');
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000,     // 24시간 stale (캐시 유지)
    refetchInterval: 24 * 60 * 60 * 1000, // 24시간마다 갱신
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
