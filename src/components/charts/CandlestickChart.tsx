'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  CandlestickSeries,
  HistogramSeries,
  IPriceLine,
} from 'lightweight-charts';

interface SignalOverlay {
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
}

interface Props {
  data: CandlestickData[];
  volumeData?: { time: Time; value: number; color: string }[];
  signal?: SignalOverlay;
  timeframe?: string;
}

export default function CandlestickChart({ data, volumeData, signal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const dataRef = useRef(data);
  const volumeDataRef = useRef(volumeData);
  const signalRef = useRef(signal);
  // price line 추적 — 새 시그널 시 기존 라인 제거용
  const priceLinesRef = useRef<IPriceLine[]>([]);

  // 최신 props를 ref에 유지
  dataRef.current = data;
  volumeDataRef.current = volumeData;
  signalRef.current = signal;

  // 기존 price lines 전부 제거
  const clearPriceLines = useCallback(() => {
    const series = candleSeriesRef.current;
    if (!series) return;
    for (const line of priceLinesRef.current) {
      try { series.removePriceLine(line); } catch {}
    }
    priceLinesRef.current = [];
  }, []);

  // 차트 초기화 (한 번만)
  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    // 기존 차트 제거
    if (chartRef.current) {
      try { chartRef.current.remove(); } catch {}
      chartRef.current = null;
    }

    const container = containerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth || 400,
      height: container.clientHeight || 300,
      layout: {
        background: { color: 'transparent' },
        textColor: '#A0A0A0',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(45,45,45,0.4)' },
        horzLines: { color: 'rgba(45,45,45,0.4)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(0,255,65,0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(0,255,65,0.3)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: '#2D2D2D',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#2D2D2D',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // 캔들스틱 시리즈
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00FF41',
      downColor: '#FF3B3B',
      borderUpColor: '#00FF41',
      borderDownColor: '#FF3B3B',
      wickUpColor: '#00FF41',
      wickDownColor: '#FF3B3B',
    });
    candleSeriesRef.current = candleSeries;

    // 볼륨 시리즈 (필요 시)
    if (volumeDataRef.current && volumeDataRef.current.length > 0) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(volumeDataRef.current);
    }

    chartRef.current = chart;

    // 리사이즈 핸들러
    const handleResize = () => {
      try {
        if (container && chartRef.current) {
          chartRef.current.applyOptions({
            width: container.clientWidth,
            height: container.clientHeight,
          });
        }
      } catch {}
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      try { chart.remove(); } catch {}
    };
  }, []); // 마운트 시 한 번만

  // 데이터 업데이트 (시그널 변경 시에도 호출)
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series || !dataRef.current || dataRef.current.length === 0) return;

    try {
      series.setData(dataRef.current);

      // 항상 기존 price lines 먼저 제거
      clearPriceLines();

      // 새 시그널이 있으면 한 세트만 생성
      if (signalRef.current) {
        const sig = signalRef.current;

        const entryLine = series.createPriceLine({
          price: sig.entryPrice,
          color: '#FFFFFF',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: '진입가',
        });

        const targetLine = series.createPriceLine({
          price: sig.targetPrice,
          color: '#00FF41',
          lineWidth: 1,
          lineStyle: 0,
          axisLabelVisible: true,
          title: '목표가',
        });

        const stopLine = series.createPriceLine({
          price: sig.stopLoss,
          color: '#FF3B3B',
          lineWidth: 1,
          lineStyle: 0,
          axisLabelVisible: true,
          title: '손절가',
        });

        priceLinesRef.current = [entryLine, targetLine, stopLine];
      }

      chartRef.current?.timeScale().fitContent();
    } catch (e) {
      console.warn('Chart update error:', (e as Error).message);
    }
  }, [data, signal, clearPriceLines]);

  useEffect(() => {
    const cleanup = initChart();
    return () => cleanup?.();
  }, [initChart]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
