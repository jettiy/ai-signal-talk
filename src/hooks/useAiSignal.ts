'use client';
import { useMutation } from '@tanstack/react-query';
import { AiSignalResult } from '@/lib/types';

interface GenerateSignalParams {
  symbol: string;
  price: number;
  changePct: number;
  news: { title: string; text: string; source: string }[];
  timeframe?: string;
}

export function useAiSignal() {
  return useMutation<AiSignalResult, Error, GenerateSignalParams>({
    mutationFn: async (params) => {
      const res = await fetch('/api/ai-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('AI 분석 요청 실패');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
  });
}
