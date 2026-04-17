'use client';

import { useState, useMemo } from 'react';
import {
  AlertCircle,
  Zap,
  MessageSquare,
  BarChart2,
  Clock,
} from 'lucide-react';
import CandlestickChart from '@/components/charts/CandlestickChart';
import SignalGauge from '@/components/dashboard/SignalGauge';
import { FUTURES_SYMBOLS, TIMEFRAMES, type FuturesTab } from '@/lib/types';
import type { CandlestickData, Time } from 'lightweight-charts';

// ===== 목업 데이터 (FMP API 키 연동 후 실데이터로 교체) =====

const MOCK_NEWS = [
  { id: 1, tag: 'CRITICAL' as const, source: 'Reuters', time: '2분 전', title: '美 연방준비위원회 금리 인하 전망 확대', impact: ['NASDAQ LONG', 'GOLD LONG'] },
  { id: 2, tag: 'HIGH' as const, source: 'Bloomberg', time: '8분 전', title: 'WTI 원유 재고량 예상 외 감소', impact: ['WTI LONG'] },
  { id: 3, tag: 'MEDIUM' as const, source: 'CNBC', time: '15분 전', title: 'S&P500 채권 수익률 역전 관찰', impact: ['EQUITY BEARISH'] },
  { id: 4, tag: 'LOW' as const, source: 'FT', time: '32분 전', title: '반도체 수출 규제 추가 확대 가능성', impact: ['NASDAQ BEARISH'] },
  { id: 5, tag: 'HIGH' as const, source: 'Yonhap', time: '45분 전', title: '한국 수출 6개월 연속 증가 — 반도체 견인', impact: ['KOSPI BULLISH'] },
];

const MOCK_CHAT = [
  { id: 1, grade: 'WHALE', gradeColor: '#FFD700', nickname: 'WhaleKing', msg: 'NQ 단타 진입했어. 18500 TP, 18420 SL', time: '09:12' },
  { id: 2, grade: 'PRO', gradeColor: '#00FF41', nickname: 'ScalperPro', msg: 'GOLD 2030 resistance 돌파. LONG 확인', time: '09:14' },
  { id: 3, grade: 'TOP 1%', gradeColor: '#FF6B6B', nickname: 'TopTrader', msg: 'CL 77.5에서 반등 신호 나옴. 롱 찐', time: '09:18' },
  { id: 4, grade: 'LV.05', gradeColor: '#A855F7', nickname: 'AlgoMaster', msg: 'AI 시그널: NQ BUY 전환, 신뢰도 78%', time: '09:20' },
  { id: 5, grade: 'PRO', gradeColor: '#00FF41', nickname: 'ScalperPro', msg: '오늘 NQ 약세 추세 유지 중. 스캘핑만', time: '09:25' },
];

const MOCK_SIGNALS: Record<string, { type: 'LONG' | 'SHORT'; entry: number; target: number; stop: number; confidence: number; rationale: string }> = {
  NQ: { type: 'LONG', entry: 18420.5, target: 18580.0, stop: 18340.0, confidence: 78, rationale: '4시간봉 상승 모멘텀 유지, 20 EMA 지지 확인. 미 고용지표 호조로 투자 심리 개선 중.' },
  GC: { type: 'SHORT', entry: 2034.2, target: 2018.0, stop: 2044.0, confidence: 65, rationale: '2030 저항 돌파 실패, RSI 과매수 구간 진입. 기관 매도 포지션 증가 추세.' },
  CL: { type: 'LONG', entry: 77.84, target: 79.50, stop: 76.80, confidence: 72, rationale: '원유 재고 감소 + 중동 리스크 프리미엄. 77달러 지지 확인.' },
};

const TICKER_DATA: Record<string, { price: string; change: string; positive: boolean }> = {
  NQ: { price: '18,542.5', change: '+0.42%', positive: true },
  GC: { price: '2,034.2', change: '-0.18%', positive: false },
  CL: { price: '77.84', change: '+0.31%', positive: true },
};

// 목업 차트 데이터 생성
function generateMockCandleData(basePrice: number, volatility: number): CandlestickData[] {
  const data: CandlestickData[] = [];
  let price = basePrice;
  const now = new Date();

  for (let i = 100; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 5 * 60 * 1000);
    const timeStr = date.toISOString().slice(0, 19) as Time;
    const change = (Math.random() - 0.48) * volatility;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.3;
    const low = Math.min(open, close) - Math.random() * volatility * 0.3;

    data.push({
      time: timeStr,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
    });
    price = close;
  }
  return data;
}

const IMPACT_COLORS = {
  CRITICAL: { bg: 'rgba(255,59,59,0.08)', border: 'rgba(255,59,59,0.2)', text: '#FF3B3B' },
  HIGH: { bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.2)', text: '#FFD700' },
  MEDIUM: { bg: 'rgba(255,165,0,0.08)', border: 'rgba(255,165,0,0.2)', text: '#FFA500' },
  LOW: { bg: 'rgba(160,160,160,0.08)', border: 'rgba(160,160,160,0.2)', text: '#A0A0A0' },
};

// ===== Main Dashboard =====

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<FuturesTab>('NQ');
  const [activeTimeframe, setActiveTimeframe] = useState<string>('5min');
  const ticker = TICKER_DATA[activeTab];
  const signal = MOCK_SIGNALS[activeTab];

  const chartData = useMemo(() => {
    const basePrice = activeTab === 'NQ' ? 18500 : activeTab === 'GC' ? 2034 : 77.8;
    const volatility = activeTab === 'NQ' ? 8 : activeTab === 'GC' ? 3 : 0.5;
    return generateMockCandleData(basePrice, volatility);
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full">
      {/* 종목 탭바 */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 shrink-0"
        style={{ background: '#0A0A0F', borderBottom: '1px solid #1A1A1A' }}
      >
        <span className="text-[10px] mr-1 font-semibold" style={{ color: '#555' }}>종목</span>
        {(Object.entries(FUTURES_SYMBOLS) as [FuturesTab, typeof FUTURES_SYMBOLS[FuturesTab]][]).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            style={{
              background: activeTab === key ? 'rgba(0,255,65,0.1)' : 'transparent',
              color: activeTab === key ? '#00FF41' : '#555',
              border: `1px solid ${activeTab === key ? 'rgba(0,255,65,0.3)' : 'transparent'}`,
            }}
          >
            {val.label}
          </button>
        ))}

        {/* 현재가 */}
        <div className="ml-auto flex items-center gap-3">
          <span
            className="text-sm font-mono font-bold"
            style={{ color: ticker?.positive ? '#00FF41' : '#FF3B3B' }}
          >
            {ticker?.price}
          </span>
          <span
            className="flex items-center gap-1 text-[11px] font-bold font-mono"
            style={{ color: ticker?.positive ? '#00FF41' : '#FF3B3B' }}
          >
            {ticker?.change}
          </span>
        </div>
      </div>

      {/* 3-column 레이아웃 */}
      <div className="flex gap-3 p-3 flex-1 overflow-hidden min-h-0">
        {/* ====== Column 1: 실시간 뉴스 (25%) ====== */}
        <div
          className="flex flex-col min-w-0 rounded-2xl overflow-hidden"
          style={{ flex: '0 0 25%', background: '#0A0A0F', border: '1px solid #1A1A1A' }}
        >
          {/* 헤더 */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 shrink-0"
            style={{ borderBottom: '1px solid #1A1A1A' }}
          >
            <span className="text-[11px] font-bold text-white">LIVE FEED</span>
            <span
              className="w-1.5 h-1.5 rounded-full pulse-live"
              style={{ background: '#00FF41' }}
            />
            <span className="ml-auto text-[10px]" style={{ color: '#555' }}>30s polling</span>
          </div>

          {/* 뉴스 리스트 */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {MOCK_NEWS.map(news => {
              const colors = IMPACT_COLORS[news.tag];
              return (
                <div
                  key={news.id}
                  className="rounded-xl p-3 fade-in-up"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: `${colors.text}15`, color: colors.text }}
                    >
                      {news.tag}
                    </span>
                    <span className="text-[10px]" style={{ color: '#555' }}>{news.source}</span>
                    <span className="text-[10px] ml-auto" style={{ color: '#444' }}>{news.time}</span>
                  </div>
                  <p className="text-xs text-white leading-snug mb-2">{news.title}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {news.impact.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(0,255,65,0.06)',
                          color: '#00FF41',
                          border: '1px solid rgba(0,255,65,0.15)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 채팅 미니 패널 */}
          <div
            className="shrink-0"
            style={{ borderTop: '1px solid #1A1A1A' }}
          >
            <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid #1A1A1A' }}>
              <MessageSquare size={12} style={{ color: '#00FF41' }} />
              <span className="text-[10px] font-bold text-white">COMMUNITY</span>
              <span className="ml-auto text-[10px]" style={{ color: '#555' }}>127 Online</span>
            </div>
            <div className="max-h-32 overflow-y-auto p-2 space-y-1.5">
              {MOCK_CHAT.slice(0, 3).map(chat => (
                <div
                  key={chat.id}
                  className="rounded-lg p-2"
                  style={{ background: '#111118' }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-[9px] font-bold px-1 py-0.5 rounded"
                      style={{ background: `${chat.gradeColor}15`, color: chat.gradeColor }}
                    >
                      {chat.grade}
                    </span>
                    <span className="text-[10px] font-semibold text-white">{chat.nickname}</span>
                    <span className="text-[9px] ml-auto" style={{ color: '#444' }}>{chat.time}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: '#888' }}>{chat.msg}</p>
                </div>
              ))}
            </div>
            <div className="p-2">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="메시지 입력..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-[10px] outline-none"
                  style={{ background: '#111118', border: '1px solid #1A1A1A', color: 'white' }}
                />
                <button
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                  style={{ background: '#00FF41', color: '#000' }}
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ====== Column 2: AI 시그널 분석 (30%) ====== */}
        <div
          className="flex flex-col min-w-0 rounded-2xl overflow-hidden"
          style={{ flex: '0 0 30%', background: '#0A0A0F', border: '1px solid #1A1A1A' }}
        >
          {/* 헤더 */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 shrink-0"
            style={{ borderBottom: '1px solid #1A1A1A' }}
          >
            <BarChart2 size={13} style={{ color: '#00FF41' }} />
            <span className="text-[11px] font-bold text-white">AI SIGNAL</span>
            <span
              className="ml-auto flex items-center gap-1 text-[10px]"
              style={{ color: '#00FF41' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full pulse-live"
                style={{ background: '#00FF41' }}
              />
              AUTO
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Signal Gauge + 정보 */}
            <div
              className="rounded-xl p-4"
              style={{ background: '#111118', border: '1px solid #1A1A1A' }}
            >
              <div className="flex items-start gap-4">
                <SignalGauge
                  confidence={signal.confidence}
                  size={100}
                  signalType={signal.type}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base font-bold text-white">
                      {FUTURES_SYMBOLS[activeTab].label}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{
                        background: signal.type === 'LONG' ? 'rgba(0,255,65,0.1)' : 'rgba(255,59,59,0.1)',
                        color: signal.type === 'LONG' ? '#00FF41' : '#FF3B3B',
                        border: `1px solid ${signal.type === 'LONG' ? 'rgba(0,255,65,0.3)' : 'rgba(255,59,59,0.3)'}`,
                      }}
                    >
                      {signal.type === 'LONG' ? '▲ LONG' : '▼ SHORT'}
                    </span>
                  </div>

                  {/* 가격 레벨 */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '진입가', val: signal.entry.toLocaleString(), color: '#FFFFFF' },
                      { label: '목표가', val: signal.target.toLocaleString(), color: '#00FF41' },
                      { label: '손절가', val: signal.stop.toLocaleString(), color: '#FF3B3B' },
                    ].map(item => (
                      <div
                        key={item.label}
                        className="text-center rounded-lg p-2"
                        style={{ background: '#0A0A0F' }}
                      >
                        <p className="text-[9px] mb-0.5" style={{ color: '#555' }}>{item.label}</p>
                        <p className="text-xs font-mono font-bold" style={{ color: item.color }}>
                          {item.val}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 분석 근거 */}
            <div
              className="rounded-xl p-3"
              style={{ background: '#111118', border: '1px solid #1A1A1A' }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle size={11} style={{ color: '#FFD700' }} />
                <span className="text-[10px] font-bold" style={{ color: '#FFD700' }}>AI 분석 근거</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#A0A0A0' }}>
                {signal.rationale}
              </p>
            </div>

            {/* 과거 시그널 목록 */}
            <div
              className="rounded-xl p-3"
              style={{ background: '#111118', border: '1px solid #1A1A1A' }}
            >
              <span className="text-[10px] font-bold text-white mb-2 block">RECENT SIGNALS</span>
              {[
                { symbol: 'PRO_SCALPER', type: 'LONG', conf: 92, time: '09:12' },
                { symbol: 'BEAR_HUNTER', type: 'SHORT', conf: 87, time: '08:45' },
                { symbol: 'MOMENTUM_X', type: 'LONG', conf: 74, time: '08:30' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-1.5"
                  style={{ borderBottom: i < 2 ? '1px solid #1A1A1A' : 'none' }}
                >
                  <span className="text-[10px] font-mono font-bold" style={{ color: '#A0A0A0' }}>
                    {s.symbol}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: s.type === 'LONG' ? 'rgba(0,255,65,0.08)' : 'rgba(255,59,59,0.08)',
                      color: s.type === 'LONG' ? '#00FF41' : '#FF3B3B',
                    }}
                  >
                    {s.type}
                  </span>
                  <span className="text-[10px] font-mono ml-auto" style={{ color: '#555' }}>
                    {s.conf}%
                  </span>
                  <span className="text-[9px]" style={{ color: '#444' }}>{s.time}</span>
                </div>
              ))}
            </div>

            {/* AI Bot 카드 */}
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(0,255,65,0.02)', border: '1px solid rgba(0,255,65,0.15)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: '#00FF41', color: '#000' }}
                >
                  AI
                </div>
                <div>
                  <p className="text-[10px] font-bold" style={{ color: '#00FF41' }}>SIGNAL Bot</p>
                  <p className="text-[9px]" style={{ color: '#555' }}>AI 분석 엔진</p>
                </div>
                <span
                  className="ml-auto flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(0,255,65,0.08)', color: '#00FF41' }}
                >
                  <Zap size={9} /> ONLINE
                </span>
              </div>
              <button
                className="mt-2 w-full py-2 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                style={{
                  background: 'rgba(0,255,65,0.08)',
                  color: '#00FF41',
                  border: '1px solid rgba(0,255,65,0.2)',
                }}
              >
                <Zap size={11} /> AI 시그널 생성
              </button>
            </div>
          </div>
        </div>

        {/* ====== Column 3: 캔들스틱 차트 (45%) ====== */}
        <div
          className="flex flex-col min-w-0 rounded-2xl overflow-hidden"
          style={{ flex: '1 1 45%', background: '#0A0A0F', border: '1px solid #1A1A1A' }}
        >
          {/* 차트 헤더 + 시간프레임 */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 shrink-0"
            style={{ borderBottom: '1px solid #1A1A1A' }}
          >
            <Clock size={12} style={{ color: '#555' }} />
            <span className="text-[10px] font-bold" style={{ color: '#555' }}>TIMEFRAME</span>
            <div className="flex gap-1 ml-2">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => setActiveTimeframe(tf.value)}
                  className="px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer"
                  style={{
                    background: activeTimeframe === tf.value ? 'rgba(0,255,65,0.1)' : 'transparent',
                    color: activeTimeframe === tf.value ? '#00FF41' : '#555',
                    border: `1px solid ${activeTimeframe === tf.value ? 'rgba(0,255,65,0.3)' : 'transparent'}`,
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] font-mono" style={{ color: '#555' }}>
                {FUTURES_SYMBOLS[activeTab].label}
              </span>
            </div>
          </div>

          {/* 차트 영역 */}
          <div className="flex-1 min-h-0">
            <CandlestickChart
              data={chartData}
              signal={{
                entryPrice: signal.entry,
                targetPrice: signal.target,
                stopLoss: signal.stop,
              }}
            />
          </div>

          {/* Signal Strength Bar */}
          <div
            className="shrink-0 px-4 py-2.5"
            style={{ borderTop: '1px solid #1A1A1A' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold" style={{ color: '#555' }}>SIGNAL STRENGTH</span>
              <div className="flex-1 h-2 rounded-full" style={{ background: '#1A1A1A' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${signal.confidence}%`,
                    background: signal.confidence >= 70
                      ? 'linear-gradient(90deg, #00FF41, #00CC33)'
                      : signal.confidence >= 50
                      ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                      : 'linear-gradient(90deg, #FF3B3B, #CC0000)',
                    boxShadow: signal.confidence >= 70
                      ? '0 0 8px rgba(0,255,65,0.4)'
                      : 'none',
                  }}
                />
              </div>
              <span
                className="text-xs font-mono font-bold"
                style={{
                  color: signal.confidence >= 70 ? '#00FF41' : signal.confidence >= 50 ? '#FFD700' : '#FF3B3B',
                }}
              >
                {signal.confidence}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
