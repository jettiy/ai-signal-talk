'use client';
import { useQuery } from '@tanstack/react-query';
import { type NewsItem } from '@/lib/types';

export type { NewsItem };

export function useNews() {
  return useQuery<NewsItem[]>({
    queryKey: ['news'],
    queryFn: async () => {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('Failed to fetch news');
      return res.json();
    },
    refetchInterval: 30000,
  });
}
