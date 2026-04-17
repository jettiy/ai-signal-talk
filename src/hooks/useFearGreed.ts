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
    refetchInterval: 60000, // 1분마다 갱신
  });
}
