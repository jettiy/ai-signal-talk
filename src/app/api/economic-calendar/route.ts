import { NextResponse } from 'next/server';
import { getEconomicCalendar } from '@/lib/fmp';

export async function GET() {
  const data = await getEconomicCalendar();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
