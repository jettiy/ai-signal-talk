'use client';

import { useQuery } from '@tanstack/react-query';
import { type EconomicCalendarItem } from '@/lib/types';

export type { EconomicCalendarItem };

export function useEconomicCalendar() {
  return useQuery<EconomicCalendarItem[]>({
    queryKey: ['economic-calendar'],
    queryFn: async () => {
      const res = await fetch('/api/economic-calendar');
      if (!res.ok) throw new Error('Failed to fetch economic calendar');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
