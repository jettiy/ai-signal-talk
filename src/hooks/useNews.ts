'use client';
import { useQuery } from '@tanstack/react-query';
import { NewsItem } from '@/lib/fmp';

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