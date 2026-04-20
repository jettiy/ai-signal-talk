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
import { useAiSignalStream } from '@/hooks/useAiSignalStream';
import { useMarketData } from '@/hooks/useMarketData';
import { useChartData } from '@/hooks/useChartData';
import { useNews } from '@/hooks/useNews';
import { AiSignalResult, FUTURES_SYMBOLS, getPredictionType, UserRole } from '@/lib/types';
import UserBadge from './UserBadge';

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
// 종목별 가격 기준 설정
const FALLBACK_BASE_PRICES: Record<string, { price: number; unit: number; stopUnit: number }> = {
  NQUSD: { price: 21285, unit: 10, stopUnit: 35 },
  GCUSD: { price: 4810, unit: 3, stopUnit: 15 },
  CLUSD: { price: 64.8, unit: 0.2, stopUnit: 0.8 },
};

// 종목별·시간프레임별 폴백 시그널 생성 함수
function getFallbackSignal(asset: string, tf: TimeframeId) {
  const base = FALLBACK_BASE_PRICES[asset] || FALLBACK_BASE_PRICES['NQUSD'];
  const p = base.price;
  const u = base.unit;
  const su = base.stopUnit;

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: asset === 'CLUSD' ? 2 : 0, maximumFractionDigits: asset === 'CLUSD' ? 2 : 0 });

  const signals: Record<TimeframeId, {
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
      entry: fmt(p), stopLoss: fmt(p - u), takeProfit: fmt(p + 2.5 * u),
      riskReward: '2.5', confidence: 58,
      predictionType: '다음 봉 예측',
      rationale: '1분봉 RSI 30 이하 과매도 구간에서 반등 패턴 감지.',
    },
    '5min': {
      direction: 'sell', buyProb: 35, sellProb: 65,
      entry: fmt(p + 0.5 * u), stopLoss: fmt(p + 2 * u), takeProfit: fmt(p - 5 * u),
      riskReward: '2.5', confidence: 65,
      predictionType: '다음 봉 예측',
      rationale: '5분봉 상단 밴드 터치 후 거부. MACD 음배열 전환.',
    },
    '15min': {
      direction: 'buy', buyProb: 71, sellProb: 29,
      entry: fmt(p - 0.5 * u), stopLoss: fmt(p - su), takeProfit: fmt(p + 3.5 * u * 2),
      riskReward: '2.3', confidence: 71,
      predictionType: '현재봉 마감',
      rationale: '15분봉 EMA21 지지 확인. 스토캐스틱 골든크로스 발생.',
    },
    '30min': {
      direction: 'buy', buyProb: 58, sellProb: 42,
      entry: fmt(p - u), stopLoss: fmt(p - su), takeProfit: fmt(p + 3.4 * u),
      riskReward: '1.86', confidence: 58,
      predictionType: '현재봉 마감',
      rationale: '30분봉 EMA50 지지선 테스트 중. 매수세 유입 확인.',
    },
    '1hour': {
      direction: 'sell', buyProb: 40, sellProb: 60,
      entry: fmt(p + u), stopLoss: fmt(p + 4.5 * u), takeProfit: fmt(p - 6.3 * u),
      riskReward: '2.1', confidence: 60,
      predictionType: '현재봉 마감',
      rationale: '1시간봉 더블탑 패턴 완성. RSI 70 과매수.',
    },
    '1day': {
      direction: 'buy', buyProb: 74, sellProb: 26,
      entry: fmt(p - 1.5 * u), stopLoss: fmt(p - su * 5), takeProfit: fmt(p + su * 9),
      riskReward: '1.94', confidence: 74,
      predictionType: '현재봉 마감',
      rationale: '일봉 EMA200 지지. 전일 강한 양봉 이어 하락 저항.',
    },
  };

  return signals[tf];
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export default function SignalPanel({ userRole = 'BASIC' as UserRole }: { userRole?: UserRole }) {
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

  // AI 시그널 (폴백용 기존 훅 유지)
  const signalMutation = useAiSignal();

  // AI 시그널 스트리밍 (Thinking Mode 라이브)
  const {
    thinkingText,
    isThinking: isStreamThinking,
    isLoading: isStreamLoading,
    isComplete: isStreamComplete,
    result: streamResult,
    error: streamError,
    startStream,
    reset: resetStream,
  } = useAiSignalStream();

  // 시그널 수동 생성 — 스트리밍 모드 우선
  const generateSignal = useCallback(() => {
    if (!currentQuote) return;

    // 스트리밍 모드로 시작
    startStream({
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
  }, [asset, timeframe, currentQuote, news, startStream]);

  // 스트리밍 완료 시 AI 결과 업데이트
  useEffect(() => {
    if (isStreamComplete && streamResult) {
      setAiResult(streamResult);
    }
  }, [isStreamComplete, streamResult]);

  // 기존 mutation 결과도 처리 (폴백)
  useEffect(() => {
    if (signalMutation.data) {
      setAiResult(signalMutation.data);
    }
  }, [signalMutation.data]);

  // 스트리밍 에러 시 폴백
  useEffect(() => {
    if (streamError) {
      console.warn('스트리밍 실패, 기존 API로 폴백:', streamError);
      if (currentQuote) {
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
      }
    }
  }, [streamError]);

  // 표시할 시그널 데이터 결정 (AI 결과 우선, 없으면 폴백)
  const fallback = getFallbackSignal(asset, timeframe);
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

  // 스트리밍 중에는 thinkingText를 reasoning에 실시간 표시
  const liveReasoning = isStreamLoading ? thinkingText : displaySignal.reasoning;

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
          className="flex shrink-0 items-center"
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
          <span className="ml-auto pr-3">
            <UserBadge role={userRole} size="sm" />
          </span>
        </div>

        {/* AI 시그널 분석 생성 버튼 */}
        {rightTab === 'signal' && (
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #1A1A1A' }}>
            <button
              onClick={generateSignal}
              disabled={isStreamLoading || signalMutation.isPending || !currentQuote}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all"
              style={{
                background: (isStreamLoading || signalMutation.isPending)
                  ? '#1A1A1A'
                  : 'linear-gradient(135deg, #00FF41 0%, #00CC33 100%)',
                color: (isStreamLoading || signalMutation.isPending) ? '#555' : '#000',
                border: `1px solid ${(isStreamLoading || signalMutation.isPending) ? '#333' : 'rgba(0,255,65,0.3)'}`,
                opacity: !currentQuote ? 0.4 : 1,
              }}
            >
              {(isStreamLoading || signalMutation.isPending) ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {isStreamThinking ? 'AI가 분석하고 있습니다...' : '분석 중...'}
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
                {(isStreamLoading || signalMutation.isPending) && (
                  <Loader2 size={12} className="animate-spin" style={{ color: '#00FF41' }} />
                )}
              </div>

              {/* Thinking Mode 로딩 오버레이 */}
              {isStreamThinking && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,180,216,0.05) 0%, rgba(0,255,65,0.03) 100%)',
                    border: '1px solid rgba(0,180,216,0.2)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 size={12} className="animate-spin" style={{ color: '#00B4D8' }} />
                    <span
                      className="text-[11px] font-bold animate-pulse"
                      style={{ color: '#00B4D8' }}
                    >
                      AI가 분석하고 있습니다...
                    </span>
                  </div>
                  <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(0,180,216,0.1)' }}>
                    <div
                      className="h-full rounded-full animate-pulse"
                      style={{ width: '60%', background: 'linear-gradient(90deg, #00B4D8, #00FF41, #00B4D8)' }}
                    />
                  </div>
                </div>
              )}

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

              {/* Thinking Mode 추론 (Z.AI 확장) — 라이브 스트리밍 + 완료 결과 */}
              {(liveReasoning || isStreamThinking) && (
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(0,180,216,0.03)', border: '1px solid rgba(0,180,216,0.15)' }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain size={10} style={{ color: '#00B4D8' }} />
                    <span className="text-[10px] font-bold" style={{ color: '#00B4D8' }}>AI 추론 과정</span>
                    {isStreamThinking && (
                      <span className="text-[8px] animate-pulse" style={{ color: '#00B4D8' }}>
                        ● LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] leading-relaxed whitespace-pre-wrap" style={{ color: '#7CB9D4' }}>
                    {liveReasoning || '분석을 시작하고 있습니다...'}
                    {isStreamLoading && (
                      <span className="inline-block w-1.5 h-3 ml-0.5 align-middle animate-pulse" style={{ background: '#00B4D8' }} />
                    )}
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
