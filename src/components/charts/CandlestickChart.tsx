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

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = containerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
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

    // 캔들스틱 시리즈 — v5 API: chart.addSeries(CandlestickSeries, options)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00FF41',
      downColor: '#FF3B3B',
      borderUpColor: '#00FF41',
      borderDownColor: '#FF3B3B',
      wickUpColor: '#00FF41',
      wickDownColor: '#FF3B3B',
    });

    // 볼륨 시리즈
    if (volumeData && volumeData.length > 0) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(volumeData);
    }

    // 데이터 설정
    if (data.length > 0) {
      candleSeries.setData(data);

      // 시그널 오버레이
      if (signal) {
        const lastCandle = data[data.length - 1];

        // 진입가 라인
        candleSeries.createPriceLine({
          price: signal.entryPrice,
          color: '#FFFFFF',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: '진입가',
        });

        // 목표가 라인
        candleSeries.createPriceLine({
          price: signal.targetPrice,
          color: '#00FF41',
          lineWidth: 1,
          lineStyle: 0,
          axisLabelVisible: true,
          title: '목표가',
        });

        // 손절가 라인
        candleSeries.createPriceLine({
          price: signal.stopLoss,
          color: '#FF3B3B',
          lineWidth: 1,
          lineStyle: 0,
          axisLabelVisible: true,
          title: '손절가',
        });
      }

      chart.timeScale().fitContent();
    }

    chartRef.current = chart;

    // 리사이즈 핸들러
    const handleResize = () => {
      if (container && chartRef.current) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [data, volumeData, signal]);

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
