'use client';
import { useEffect, useState } from 'react';
import { useAiSignal } from '@/hooks/useAiSignal';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';

interface Props {
  symbol: string;
  price: number;
  changePct: number;
  news: { title: string; text: string; source: string }[];
}

export default function SignalCard({ symbol, price, changePct, news }: Props) {
  const { mutate, data, isPending, error } = useAiSignal();
  const [displayed, setDisplayed] = useState(false);

  useEffect(() => {
    mutate({ symbol, price, changePct, news });
  }, [symbol]);

  useEffect(() => {
    if (data) setDisplayed(true);
  }, [data]);

  const confidenceColor = (c: number) =>
    c >= 80 ? '#00FF41' : c >= 60 ? '#FBBF24' : '#FF3B3B';

  if (isPending || !displayed) {
    return (
      <div className="bg-[#111118] border border-[#1A1A1A] rounded-2xl p-5 animate-pulse">
        <div className="h-4 w-32 bg-[#1A1A1A] rounded mb-4" />
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-full bg-[#1A1A1A]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#1A1A1A] rounded w-3/4" />
            <div className="h-3 bg-[#1A1A1A] rounded w-1/2" />
            <div className="h-3 bg-[#1A1A1A] rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#111118] border border-red-900/30 rounded-2xl p-5 text-red-400 text-sm flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        시그널 생성 실패 — 잠시 후 다시 시도하세요
      </div>
    );
  }

  const isLong = data.signalType === 'LONG';

  return (
    <div className="bg-[#111118] border border-[#1A1A1A] rounded-2xl p-5 hover:border-green-500/20 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">{symbol}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isLong ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {data.signalType}
          </span>
        </div>
        <span className="text-gray-500 text-xs">{data.model}</span>
      </div>

      {/* Confidence Gauge */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#1A1A1A" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke={confidenceColor(data.confidence)}
              strokeWidth="3"
              strokeDasharray={`${(data.confidence / 100) * 88} 88`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {data.confidence}%
          </span>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">신뢰도</div>
          <div className={`text-lg font-bold ${data.confidence >= 70 ? 'text-green-400' : data.confidence >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {data.confidence >= 70 ? '_HIGH' : data.confidence >= 50 ? '_MEDIUM' : '_LOW'}
          </div>
        </div>
      </div>

      {/* Entry / Target / Stop */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#0A0A0F] rounded-xl p-3 text-center">
          <div className="text-gray-500 text-[10px] mb-1">진입가</div>
          <div className="text-white font-bold text-sm">${data.entryPrice.toFixed(2)}</div>
        </div>
        <div className="bg-[#0A0A0F] rounded-xl p-3 text-center">
          <div className="text-gray-500 text-[10px] mb-1">목표가</div>
          <div className="text-green-400 font-bold text-sm flex items-center justify-center gap-1">
            <Target className="w-3 h-3" />${data.targetPrice.toFixed(2)}
          </div>
        </div>
        <div className="bg-[#0A0A0F] rounded-xl p-3 text-center">
          <div className="text-gray-500 text-[10px] mb-1">손절가</div>
          <div className="text-red-400 font-bold text-sm flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />${data.stopLoss.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Rationale */}
      <p className="text-gray-400 text-xs leading-relaxed mb-3">{data.rationale}</p>

      {/* Timeframe badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          data.timeframe.includes('단기') ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
        }`}>
          {data.timeframe}
        </span>
      </div>
    </div>
  );
}