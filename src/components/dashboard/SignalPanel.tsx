'use client';

import { useState } from 'react';
import CandlestickChart from '@/components/charts/CandlestickChart';
import ProbabilityDonut from './signal/ProbabilityDonut';
import PriceTargets from './signal/PriceTargets';
import TradeHistory from './signal/TradeHistory';
import EconomicCalendar from './signal/EconomicCalendar';
import { Zap, History, BarChart3 } from 'lucide-react';

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
  { id: 'CLUSD', label: 'WTI원유' },
] as const;

// ── Mock 데이터: 시간프레임별 AI 시그널 ──────────────────────────
const MOCK_SIGNALS: Record<TimeframeId, {
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
    entry: '21,285', stopLoss: '21,295', takeProfit: '21,305',
    riskReward: '2.0', confidence: 58,
    predictionType: '다음 봉 예측',
    rationale: '1분봉 RSI 30 이하 과매도 구간에서 반등 패턴 감지. 직전 3캔들 하락 모멘텀 약화.',
  },
  '5min': {
    direction: 'sell', buyProb: 35, sellProb: 65,
    entry: '21,283', stopLoss: '21,305', takeProfit: '21,245',
    riskReward: '1.73', confidence: 65,
    predictionType: '다음 봉 예측',
    rationale: '5분봉 상단 밴드 터치 후 거부. MACD 음배열 전환. 거래량 감소하며 상승 동력 소실.',
  },
  '15min': {
    direction: 'buy', buyProb: 71, sellProb: 29,
    entry: '21,280', stopLoss: '21,250', takeProfit: '21,340',
    riskReward: '2.0', confidence: 71,
    predictionType: '현재봉 마감',
    rationale: '현재 15분봉 EMA21 지지 확인. 스토캐스틱 골든크로스 발생. 하락 쐐기 패턴 돌파.',
  },
  '30min': {
    direction: 'buy', buyProb: 58, sellProb: 42,
    entry: '21,275', stopLoss: '21,240', takeProfit: '21,330',
    riskReward: '1.57', confidence: 58,
    predictionType: '현재봉 마감',
    rationale: '30분봉 EMA50 지지선 테스트 중. 현재봉 하꼬리 길게 형성. 매수세 유입 확인.',
  },
  '1hour': {
    direction: 'sell', buyProb: 40, sellProb: 60,
    entry: '21,290', stopLoss: '21,340', takeProfit: '21,190',
    riskReward: '2.0', confidence: 60,
    predictionType: '현재봉 마감',
    rationale: '1시간봉 더블탑 패턴 완성. RSI 70 과매수. 거래량 감소와 함께 상승 종료 신호.',
  },
  '1day': {
    direction: 'buy', buyProb: 74, sellProb: 26,
    entry: '21,250', stopLoss: '21,100', takeProfit: '21,500',
    riskReward: '1.67', confidence: 74,
    predictionType: '현재봉 마감',
    rationale: '일봉 EMA200 지지. 전일 강한 양봉 이어 하락 저항. 기관 매수세 지속 추정.',
  },
};

// ── Mock 캔들 데이터 생성 ────────────────────────────────────────
function generateMockCandles(count: number) {
  const data = [];
  let base = 21250;
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < count; i++) {
    const open = base + (Math.random() - 0.48) * 30;
    const close = open + (Math.random() - 0.45) * 40;
    const high = Math.max(open, close) + Math.random() * 15;
    const low = Math.min(open, close) - Math.random() * 15;
    data.push({
      time: (now - (count - i) * 60) as any,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });
    base = close;
  }
  return data;
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export default function SignalPanel() {
  const [timeframe, setTimeframe] = useState<TimeframeId>('15min');
  const [asset, setAsset] = useState<string>('NQUSD');
  const [rightTab, setRightTab] = useState<'signal' | 'history'>('signal');

  const signal = MOCK_SIGNALS[timeframe];
  const isShortTerm = timeframe === '1min' || timeframe === '5min';
  const mockCandles = generateMockCandles(120);

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
            {signal.predictionType}
          </span>
        </div>

        {/* 차트 영역 */}
        <div className="flex-1 min-h-0" style={{ background: '#0A0A0F' }}>
          <CandlestickChart
            data={mockCandles}
            signal={{
              entryPrice: parseFloat(signal.entry.replace(/,/g, '')),
              targetPrice: parseFloat(signal.takeProfit.replace(/,/g, '')),
              stopLoss: parseFloat(signal.stopLoss.replace(/,/g, '')),
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

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {rightTab === 'signal' ? (
            <div className="p-4 space-y-4">
              {/* 종목 + 시간프레임 표시 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{asset}</span>
                <span className="text-[10px]" style={{ color: '#555' }}>
                  {TIMEFRAMES.find((t) => t.id === timeframe)?.label}
                </span>
              </div>

              {/* 원형 확률 그래프 */}
              <ProbabilityDonut
                direction={signal.direction}
                buyProb={signal.buyProb}
                sellProb={signal.sellProb}
                predictionType={signal.predictionType}
              />

              {/* 진입/손절/목표가 + 손익비 */}
              <PriceTargets
                direction={signal.direction}
                entry={signal.entry}
                stopLoss={signal.stopLoss}
                takeProfit={signal.takeProfit}
                riskReward={signal.riskReward}
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
                      color: signal.confidence >= 70 ? '#00FF41'
                        : signal.confidence >= 50 ? '#FFD700' : '#FF3B3B',
                    }}
                  >
                    {signal.confidence}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A1A1A' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${signal.confidence}%`,
                      background: signal.confidence >= 70
                        ? 'linear-gradient(90deg, #00FF41, #00CC33)'
                        : signal.confidence >= 50
                          ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                          : 'linear-gradient(90deg, #FF3B3B, #CC0000)',
                    }}
                  />
                </div>
              </div>

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
                  {signal.rationale}
                </p>
                <div
                  className="mt-2 text-[9px] px-2 py-1 rounded"
                  style={{ background: 'rgba(255,215,0,0.05)', color: '#FFD700' }}
                >
                  백엔드 구축 후 LLM 실시간 분석 연동 예정
                </div>
              </div>
            </div>
          ) : (
            <TradeHistory />
          )}
        </div>
      </div>
    </div>
  );
}
