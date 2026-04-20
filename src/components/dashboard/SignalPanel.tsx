'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

// lightweight-charts는 SSR에서 로드 불가 → dynamic import + ssr:false
const CandlestickChart = dynamic(
  () => import('@/components/charts/CandlestickChart'),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center text-[11px]" style={{ color: '#444' }}>차트 로딩중...</div> }
);
import ProbabilityDonut from './signal/ProbabilityDonut';
import PriceTargets from './signal/PriceTargets';
import TradeHistory from './signal/TradeHistory';
import EconomicCalendar from './signal/EconomicCalendar';
import { Zap, History, BarChart3, Brain, ExternalLink, Loader2 } from 'lucide-react';
import { useAiSignal } from '@/hooks/useAiSignal';
import { useMarketData } from '@/hooks/useMarketData';
import { useChartData } from '@/hooks/useChartData';
import { useNews } from '@/hooks/useNews';
import { AiSignalResult, FUTURES_SYMBOLS, getPredictionType } from '@/lib/types';

// ── Timeframe 설정 ──────────────────────────────────────────────
const TIMEFRAMES = [
  { id: '1min', label: '1분' },
  { id: '5min', label: '5분' },
  { id: '15min', label: '15분' },
  { id: '30min', label: '30분' },
  { id: '1hour', label: '60분' },
  { id: '1day', label: '일봉' },
] as const;

type TimeframeId = (typeof TIMEFRAMES)[number]['id'];

// ── 종목 탭 ─────────────────────────────────────────────────────
const ASSETS = [
  { id: 'NQUSD', label: '나스닥선물' },
  { id: 'GCUSD', label: '골드선물' },
  { id: 'CLUSD', label: 'WTI선물' },
] as const;

// ── Fallback Mock (API 응답 없을 때) ──────────────────────────
// 나스닥선물 기준 가격 (NQUSD ~21,285)
const FALLBACK_SIGNALS: Record<TimeframeId, {
  direction: 'buy' | 'sell';
  buyProb: number;
  sellProb: number;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  riskReward: string;
  confidence: number;
  rationale: string;
  predictionType: string;
}> = {
  '1min': {
    direction: 'buy', buyProb: 62, sellProb: 38,
    entry: '21,285', stopLoss: '21,275', takeProfit: '21,310',
    riskReward: '2.5', confidence: 58,
    predictionType: '다음 봉 예측',
    rationale: '1분봉 RSI 30 이하 과매도 구간에서 반등 패턴 감지.',
  },
  '5min': {
    direction: 'sell', buyProb: 35, sellProb: 65,
    entry: '21,290', stopLoss: '21,310', takeProfit: '21,240',
    riskReward: '2.5', confidence: 65,
    predictionType: '다음 봉 예측',
    rationale: '5분봉 상단 밴드 터치 후 거부. MACD 음배열 전환.',
  },
  '15min': {
    direction: 'buy', buyProb: 71, sellProb: 29,
    entry: '21,280', stopLoss: '21,250', takeProfit: '21,350',
    riskReward: '2.3', confidence: 71,
    predictionType: '현재봉 마감',
    rationale: '15분봉 EMA21 지지 확인. 스토캐스틱 골든크로스 발생.',
  },
  '30min': {
    direction: 'buy', buyProb: 58, sellProb: 42,
    entry: '21,275', stopLoss: '21,240', takeProfit: '21,340',
    riskReward: '1.86', confidence: 58,
    predictionType: '현재봉 마감',
    rationale: '30분봉 EMA50 지지선 테스트 중. 매수세 유입 확인.',
  },
  '1hour': {
    direction: 'sell', buyProb: 40, sellProb: 60,
    entry: '21,295', stopLoss: '21,340', takeProfit: '21,200',
    riskReward: '2.1', confidence: 60,
    predictionType: '현재봉 마감',
    rationale: '1시간봉 더블탑 패턴 완성. RSI 70 과매수.',
  },
  '1day': {
    direction: 'buy', buyProb: 74, sellProb: 26,
    entry: '21,270', stopLoss: '21,100', takeProfit: '21,600',
    riskReward: '1.94', confidence: 74,
    predictionType: '현재봉 마감',
    rationale: '일봉 EMA200 지지. 전일 강한 양봉 이어 하락 저항.',
  },
};

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export default function SignalPanel() {
  const [timeframe, setTimeframe] = useState<TimeframeId>('15min');
  const [asset, setAsset] = useState<string>('NQUSD');
  const [rightTab, setRightTab] = useState<'signal' | 'history'>('signal');
  const [aiResult, setAiResult] = useState<AiSignalResult | null>(null);

  // 실시간 시세
  const { data: quotes } = useMarketData(asset);
  const currentQuote = quotes?.[0];

  // 차트 데이터
  const { data: chartData } = useChartData(asset, timeframe);

  // 뉴스
  const { data: news } = useNews({ symbol: asset });

  // AI 시그널
  const signalMutation = useAiSignal();

  // 시그널 자동 생성 (종목/시간프레임 변경 시)
  const generateSignal = useCallback(() => {
    if (!currentQuote) return;
    signalMutation.mutate({
      symbol: asset,
      price: currentQuote.price,
      changePct: currentQuote.changesPercentage,
      news: (news || []).slice(0, 5).map((n) => ({
        title: n.title,
        text: n.text,
        source: n.source,
      })),
      timeframe,
    });
  }, [asset, timeframe, currentQuote, news]);

  // 종목/시간프레임 변경 시 자동 호출
  useEffect(() => {
    const timer = setTimeout(generateSignal, 500);
    return () => clearTimeout(timer);
  }, [generateSignal]);

  // AI 결과 업데이트
  useEffect(() => {
    if (signalMutation.data) {
      setAiResult(signalMutation.data);
    }
  }, [signalMutation.data]);

  // 표시할 시그널 데이터 결정 (AI 결과 우선, 없으면 폴백)
  const fallback = FALLBACK_SIGNALS[timeframe];
  const isShortTerm = timeframe === '1min' || timeframe === '5min';
  const predictionType = getPredictionType(timeframe);

  const displaySignal = aiResult
    ? {
        direction: (aiResult.signalType === 'LONG' ? 'buy' : 'sell') as 'buy' | 'sell',
        buyProb: aiResult.buyProbability ?? (aiResult.signalType === 'LONG' ? aiResult.confidence : 100 - aiResult.confidence),
        sellProb: aiResult.sellProbability ?? (aiResult.signalType === 'SHORT' ? aiResult.confidence : 100 - aiResult.confidence),
        entry: aiResult.entryPrice?.toLocaleString() ?? '-',
        stopLoss: aiResult.stopLoss?.toLocaleString() ?? '-',
        takeProfit: aiResult.targetPrice?.toLocaleString() ?? '-',
        riskReward: aiResult.riskRewardRatio?.toString() || fallback.riskReward,
        confidence: aiResult.confidence ?? 50,
        rationale: aiResult.rationale || '',
        predictionType: aiResult.predictionType || predictionType,
        reasoning: aiResult.reasoning || '',
        sources: aiResult.sources || [],
        model: aiResult.model || '',
      }
    : { ...fallback, reasoning: '', sources: [], model: '' };

  return (
    <div className="flex h-full" style={{ background: '#0A0A0F' }}>
      {/* ── 중앙: 차트 + 경제지표 ──────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* 종목 탭 */}
        <div
          className="flex items-center gap-1 px-4 py-2 shrink-0"
          style={{ borderBottom: '1px solid #1A1A1A' }}
        >
          {ASSETS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAsset(a.id)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all"
              style={{
                background: asset === a.id ? 'rgba(0,255,65,0.08)' : 'transparent',
                color: asset === a.id ? '#00FF41' : '#555',
                border: `1px solid ${asset === a.id ? 'rgba(0,255,65,0.2)' : 'transparent'}`,
              }}
            >
              {a.label}
            </button>
          ))}
          {/* 현재가 표시 */}
          {currentQuote && (
            <span className="ml-2 text-[11px] font-mono" style={{ color: '#999' }}>
              ${currentQuote.price.toLocaleString()}
              <span
                className="ml-1"
                style={{
                  color: currentQuote.changesPercentage >= 0 ? '#00FF41' : '#FF3B3B',
                }}
              >
                {currentQuote.changesPercentage >= 0 ? '+' : ''}
                {currentQuote.changesPercentage.toFixed(2)}%
              </span>
            </span>
          )}
          <span className="ml-auto text-[10px] font-mono" style={{ color: '#444' }}>
            {new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' })} KST
          </span>
        </div>

        {/* 시간프레임 선택 */}
        <div
          className="flex items-center gap-1 px-4 py-2 shrink-0"
          style={{ borderBottom: '1px solid #1A1A1A' }}
        >
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className="text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer transition-all"
              style={{
                background: timeframe === tf.id ? 'rgba(0,255,65,0.1)' : '#111118',
                color: timeframe === tf.id ? '#00FF41' : '#555',
                border: `1px solid ${timeframe === tf.id ? 'rgba(0,255,65,0.25)' : '#1A1A1A'}`,
              }}
            >
              {tf.label}
            </button>
          ))}
          {/* 예측 타입 표시 */}
          <span
            className="text-[9px] font-bold px-2 py-1 rounded ml-2"
            style={{
              background: isShortTerm ? 'rgba(0,180,216,0.1)' : 'rgba(168,85,247,0.1)',
              color: isShortTerm ? '#00B4D8' : '#A855F7',
            }}
          >
            {displaySignal.predictionType}
          </span>
          {/* AI 모델 표시 */}
          {displaySignal.model && (
            <span
              className="text-[9px] px-2 py-1 rounded ml-1"
              style={{ background: 'rgba(0,255,65,0.05)', color: '#00FF41' }}
            >
              {displaySignal.model}
            </span>
          )}
        </div>

        {/* 차트 영역 */}
        <div className="flex-1 min-h-0" style={{ background: '#0A0A0F' }}>
          <CandlestickChart
            data={chartData?.map((d) => ({
              time: (d.timestamp / 1000) as any,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
            })) || []}
            signal={{
              entryPrice: aiResult?.entryPrice || parseFloat(fallback.entry.replace(/,/g, '')),
              targetPrice: aiResult?.targetPrice || parseFloat(fallback.takeProfit.replace(/,/g, '')),
              stopLoss: aiResult?.stopLoss || parseFloat(fallback.stopLoss.replace(/,/g, '')),
            }}
          />
        </div>

        {/* 주요 경제지표 일정 */}
        <EconomicCalendar />
      </div>

      {/* ── 오른쪽: AI 시그널 분석 ─────────────────────── */}
      <div
        className="w-80 shrink-0 flex flex-col"
        style={{ background: '#0A0A0F', borderLeft: '1px solid #1A1A1A' }}
      >
        {/* 오른쪽 탭: AI시그널 | 매매히스토리 */}
        <div
          className="flex shrink-0"
          style={{ borderBottom: '1px solid #1A1A1A' }}
        >
          <button
            onClick={() => setRightTab('signal')}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold cursor-pointer transition-all"
            style={{
              color: rightTab === 'signal' ? '#00FF41' : '#555',
              borderBottom: rightTab === 'signal' ? '2px solid #00FF41' : '2px solid transparent',
            }}
          >
            <Zap size={12} />
            AI 시그널
          </button>
          <button
            onClick={() => setRightTab('history')}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold cursor-pointer transition-all"
            style={{
              color: rightTab === 'history' ? '#00FF41' : '#555',
              borderBottom: rightTab === 'history' ? '2px solid #00FF41' : '2px solid transparent',
            }}
          >
            <History size={12} />
            매매 히스토리
          </button>
        </div>

        {/* AI 시그널 분석 생성 버튼 */}
        {rightTab === 'signal' && (
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #1A1A1A' }}>
            <button
              onClick={generateSignal}
              disabled={signalMutation.isPending || !currentQuote}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all"
              style={{
                background: signalMutation.isPending
                  ? '#1A1A1A'
                  : 'linear-gradient(135deg, #00FF41 0%, #00CC33 100%)',
                color: signalMutation.isPending ? '#555' : '#000',
                border: `1px solid ${signalMutation.isPending ? '#333' : 'rgba(0,255,65,0.3)'}`,
                opacity: !currentQuote ? 0.4 : 1,
              }}
            >
              {signalMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Zap size={14} />
                  AI 시그널 분석 생성하기
                </>
              )}
            </button>
          </div>
        )}

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {rightTab === 'signal' ? (
            <div className="p-4 space-y-4">
              {/* 종목 + 시간프레임 표시 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {ASSETS.find((a) => a.id === asset)?.label || asset}
                </span>
                <span className="text-[10px]" style={{ color: '#555' }}>
                  {TIMEFRAMES.find((t) => t.id === timeframe)?.label}
                </span>
                {signalMutation.isPending && (
                  <Loader2 size={12} className="animate-spin" style={{ color: '#00FF41' }} />
                )}
              </div>

              {/* 원형 확률 그래프 */}
              <ProbabilityDonut
                direction={displaySignal.direction}
                buyProb={displaySignal.buyProb}
                sellProb={displaySignal.sellProb}
                predictionType={displaySignal.predictionType}
              />

              {/* 진입/손절/목표가 + 손익비 */}
              <PriceTargets
                direction={displaySignal.direction}
                entry={displaySignal.entry}
                stopLoss={displaySignal.stopLoss}
                takeProfit={displaySignal.takeProfit}
                riskReward={displaySignal.riskReward}
              />

              {/* 신뢰도 */}
              <div
                className="rounded-xl p-3"
                style={{ background: '#111118', border: '1px solid #1A1A1A' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold" style={{ color: '#555' }}>AI 신뢰도</span>
                  <span
                    className="text-xs font-bold font-mono"
                    style={{
                      color: displaySignal.confidence >= 70 ? '#00FF41'
                        : displaySignal.confidence >= 50 ? '#FFD700' : '#FF3B3B',
                    }}
                  >
                    {displaySignal.confidence}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A1A1A' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${displaySignal.confidence}%`,
                      background: displaySignal.confidence >= 70
                        ? 'linear-gradient(90deg, #00FF41, #00CC33)'
                        : displaySignal.confidence >= 50
                          ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                          : 'linear-gradient(90deg, #FF3B3B, #CC0000)',
                    }}
                  />
                </div>
              </div>

              {/* Thinking Mode 추론 (Z.AI 확장) */}
              {displaySignal.reasoning && (
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(0,180,216,0.03)', border: '1px solid rgba(0,180,216,0.15)' }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain size={10} style={{ color: '#00B4D8' }} />
                    <span className="text-[10px] font-bold" style={{ color: '#00B4D8' }}>AI 추론 과정</span>
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: '#7CB9D4' }}>
                    {displaySignal.reasoning.slice(0, 300)}
                    {displaySignal.reasoning.length > 300 ? '...' : ''}
                  </p>
                </div>
              )}

              {/* 근거 요약 */}
              <div
                className="rounded-xl p-3"
                style={{ background: '#111118', border: '1px solid #1A1A1A' }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 size={10} style={{ color: '#00FF41' }} />
                  <span className="text-[10px] font-bold" style={{ color: '#555' }}>근거 요약</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: '#999' }}>
                  {displaySignal.rationale}
                </p>
              </div>

              {/* 참조 소스 (Z.AI Web Search) */}
              {displaySignal.sources?.length > 0 && (
                <div
                  className="rounded-xl p-3"
                  style={{ background: '#111118', border: '1px solid #1A1A1A' }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <ExternalLink size={10} style={{ color: '#FFD700' }} />
                    <span className="text-[10px] font-bold" style={{ color: '#555' }}>참조 소스</span>
                  </div>
                  <div className="space-y-1.5">
                    {displaySignal.sources.slice(0, 3).map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[10px] truncate hover:underline"
                        style={{ color: '#7CB9D4' }}
                      >
                        {src.title || src.snippet?.slice(0, 60) || src.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <TradeHistory />
          )}
        </div>
      </div>
    </div>
  );
}
