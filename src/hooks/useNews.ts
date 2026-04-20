'use client';
import { useQuery } from '@tanstack/react-query';
import { type NewsItem } from '@/lib/types';

export type { NewsItem };

interface UseNewsOptions {
  symbol?: string;
  category?: 'macro' | 'commodity' | 'tech' | 'crypto';
  label?: string;
  /** 'breaking' = 시장 영향 실시간 뉴스 (5분), 'column' = 칼럼 분석 (1시간) */
  mode?: 'breaking' | 'column';
}

export function useNews(options?: UseNewsOptions) {
  const params = new URLSearchParams();
  if (options?.symbol) params.set('symbol', options.symbol);
  if (options?.category) params.set('category', options.category);
  if (options?.label) params.set('label', options.label);
  if (options?.mode) params.set('mode', options.mode);

  const qs = params.toString();
  const url = `/api/news${qs ? `?${qs}` : ''}`;

  // breaking: 5분, column: 1시간
  const refetchMs = options?.mode === 'breaking' ? 300000 : 3600000;

  return useQuery<NewsItem[]>({
    queryKey: ['news', options?.mode, options?.symbol, options?.category],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch news');
      return res.json();
    },
    refetchInterval: refetchMs,
  });
}
