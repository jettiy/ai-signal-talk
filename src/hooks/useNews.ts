'use client';
import { useQuery } from '@tanstack/react-query';
import { type NewsItem } from '@/lib/types';

export type { NewsItem };

interface UseNewsOptions {
  symbol?: string;
  category?: 'macro' | 'commodity' | 'tech' | 'crypto';
  label?: string;
}

export function useNews(options?: UseNewsOptions) {
  const params = new URLSearchParams();
  if (options?.symbol) params.set('symbol', options.symbol);
  if (options?.category) params.set('category', options.category);
  if (options?.label) params.set('label', options.label);

  const qs = params.toString();
  const url = `/api/news${qs ? `?${qs}` : ''}`;

  return useQuery<NewsItem[]>({
    queryKey: ['news', options?.symbol, options?.category],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch news');
      return res.json();
    },
    refetchInterval: 600000, // 10분마다 자동 업데이트
  });
}
