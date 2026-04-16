'use client';
import { useEffect, useRef } from 'react';
import { createChart, IChartApi, CandlestickData } from 'lightweight-charts';

interface Props {
  data: CandlestickData[];
  signal?: { entryPrice: number; targetPrice: number; stopLoss: number };
}

export default function CandlestickChart({ data, signal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: 'transparent' },
        textColor: '#A0A0A0',
      },
      grid: { vertLines: { color: '#1A1A1A' }, horzLines: { color: '#1A1A1A' } },
    });
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00FF41',
      downColor: '#FF3B3B',
      borderUpColor: '#00FF41',
      borderDownColor: '#FF3B3B',
      wickUpColor: '#00FF41',
      wickDownColor: '#FF3B3B',
    });
    candleSeries.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;
    return () => chart.remove();
  }, [data]);

  return <div ref={containerRef} className="w-full" />;
}
