'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, Send, Users, Crown, Hash, TrendingUp, TrendingDown,
  Newspaper, Clock, Flame, BarChart3, Zap,
} from 'lucide-react';
import {
  createChart,
  IChartApi,
  CandlestickData,
  Time,
  CandlestickSeries,
} from 'lightweight-charts';

// ── 등급 스타일 ────────────────────────────────────────────────
const GRADE_STYLES: Record<string, { color: string; bg: string }> = {
  WHALE: { color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
  PRO: { color: '#00FF41', bg: 'rgba(0,255,65,0.1)' },
  'TOP 1%': { color: '#FF6B6B', bg: 'rgba(255,107,107,0.1)' },
  'LV.05': { color: '#A855F7', bg: 'rgba(168,85,247,0.1)' },
  NEW: { color: '#666', bg: 'rgba(102,102,102,0.1)' },
};

// ── 채널 ──────────────────────────────────────────────────────
const CHANNELS = [
  { id: 'general', label: '전체' },
  { id: 'nq', label: '나스닥선물' },
  { id: 'gc', label: '골드선물' },
  { id: 'cl', label: 'WTI원유' },
  { id: 'signal', label: '시그널 공유' },
];

// ── Mock 메시지 ────────────────────────────────────────────────
const MOCK_MESSAGES = [
  { id: 1, grade: 'WHALE', nickname: 'WhaleKing', msg: '골드 4810에서 롱 진입. TP 4850, SL 4780', time: '09:12', channel: 'gc' },
  { id: 2, grade: 'PRO', nickname: 'ScalperPro', msg: 'GOLD $4,800 돌파 확인. 강한 매수세 유지 중', time: '09:14', channel: 'gc' },
  { id: 3, grade: 'TOP 1%', nickname: 'TopTrader', msg: 'NQ 21,280 지지 확인. 여기서 반등 기대', time: '09:16', channel: 'nq' },
  { id: 4, grade: 'LV.05', nickname: 'AlgoMaster', msg: 'AI 시그널: NVDA SHORT 전환, 신뢰도 65%', time: '09:18', channel: 'signal' },
  { id: 5, grade: 'PRO', nickname: 'ScalperPro', msg: '오늘 골드 약세없음. 계속 롱 관점', time: '09:22', channel: 'gc' },
  { id: 6, grade: 'WHALE', nickname: 'GoldBull', msg: '4시간봉 EMA 지지 깔끔. 4850 도달 가능', time: '09:25', channel: 'gc' },
  { id: 7, grade: 'TOP 1%', nickname: 'SwiftTrade', msg: 'NQ RSI 과매수. 21,350에서 매도 전환?', time: '09:28', channel: 'nq' },
  { id: 8, grade: 'PRO', nickname: 'OilTrader', msg: 'WTI $64.80 롱 진입. OPEC 감산 연장 호재', time: '09:30', channel: 'cl' },
  { id: 9, grade: 'LV.05', nickname: 'DataMiner', msg: 'GC 5분봉 매수 시그널 감지. 신뢰도 82%', time: '09:32', channel: 'signal' },
  { id: 10, grade: 'WHALE', nickname: 'WhaleKing', msg: 'NQ 21,250 응봉 확인. 추가 상승 가능', time: '09:35', channel: 'nq' },
];

// ── Mock 뉴스 ─────────────────────────────────────────────────
const MOCK_NEWS = [
  {
    id: 1, title: '연준, 금리 동결 결정... "추가 인하 여지 열어두겠다"',
    source: 'Reuters', time: '12분 전', impact: 'high' as const,
    symbol: 'NQUSD',
  },
  {
    id: 2, title: '골드, $4,800 돌파... 중앙은행 매수세 + 지정학 리스크',
    source: 'Bloomberg', time: '28분 전', impact: 'high' as const,
    symbol: 'GCUSD',
  },
  {
    id: 3, title: '엔비디아, AI 칩 수요 견조... 분기 매출 30% 증가 전망',
    source: 'CNBC', time: '1시간 전', impact: 'medium' as const,
    symbol: 'NQUSD',
  },
  {
    id: 4, title: 'WTI 원유, OPEC+ 감산 연장 소식에 $65 회복',
    source: 'Energy Voice', time: '2시간 전', impact: 'medium' as const,
    symbol: 'CLUSD',
  },
  {
    id: 5, title: '비트코인, 기관 투자자 유입 본격화... ETF 사상 최대',
    source: 'CoinDesk', time: '3시간 전', impact: 'high' as const,
    symbol: 'BTCUSD',
  },
  {
    id: 6, title: '애플, AI 기능 탑재 아이폰 17 공급망 물량 20% 증량',
    source: 'Nikkei Asia', time: '4시간 전', impact: 'low' as const,
    symbol: 'AAPL',
  },
  {
    id: 7, title: '유럽 CPI 예상치 하회... ECB 추가 인하 가능성',
    source: 'FT', time: '5시간 전', impact: 'medium' as const,
    symbol: 'NQUSD',
  },
];

const IMPACT_MAP = {
  high: { label: '높음', color: '#FF3B3B', bg: 'rgba(255,59,59,0.1)' },
  medium: { label: '보통', color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
  low: { label: '낮음', color: '#555', bg: 'rgba(85,85,85,0.1)' },
};

// ── 미니차트 종목 ──────────────────────────────────────────────
const MINI_CHART_ASSETS = [
  { id: 'NQUSD', label: '나스닥선물', price: '21,285', change: '+0.42', dir: 'buy' as const },
  { id: 'GCUSD', label: '골드선물', price: '4,821', change: '+1.18', dir: 'buy' as const },
  { id: 'CLUSD', label: 'WTI원유', price: '64.80', change: '-0.35', dir: 'sell' as const },
];

// ── 미니차트 Mock 데이터 (30개 캔들) ───────────────────────────
function generateMiniCandleData(basePrice: number, volatility: number): CandlestickData[] {
  const data: CandlestickData[] = [];
  let price = basePrice;
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 5 * 60 * 1000);
    const open = price;
    const change = (Math.random() - 0.48) * volatility;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    data.push({
      time: date.toISOString().slice(0, 16).replace('T', ' ') as Time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });
    price = close;
  }
  return data;
}

const MINI_CHART_DATA: Record<string, CandlestickData[]> = {
  NQUSD: generateMiniCandleData(21285, 15),
  GCUSD: generateMiniCandleData(4821, 8),
  CLUSD: generateMiniCandleData(64.8, 0.3),
};

// ── 등급 이니셜 ────────────────────────────────────────────────
function getInitials(nickname: string) {
  return nickname.slice(0, 2).toUpperCase();
}

// ── 미니 캔들차트 컴포넌트 ─────────────────────────────────────
function MiniCandleChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = containerRef.current;
    const data = MINI_CHART_DATA[symbol] || MINI_CHART_DATA.GCUSD;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: 'transparent' },
        textColor: '#555',
        fontSize: 9,
      },
      grid: {
        vertLines: { color: 'rgba(45,45,45,0.2)' },
        horzLines: { color: 'rgba(45,45,45,0.2)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(0,255,65,0.2)', width: 1, style: 2 },
        horzLine: { color: 'rgba(0,255,65,0.2)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: '#1A1A1A',
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: '#1A1A1A',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00FF41',
      downColor: '#FF3B3B',
      borderUpColor: '#00FF41',
      borderDownColor: '#FF3B3B',
      wickUpColor: '#00FF4180',
      wickDownColor: '#FF3B3B80',
    });

    candleSeries.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

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
  }, [symbol]);

  useEffect(() => {
    const cleanup = initChart();
    return () => cleanup?.();
  }, [initChart]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function CommunityPanel() {
  const [input, setInput] = useState('');
  const [activeChannel, setActiveChannel] = useState('general');
  const [activeMiniAsset, setActiveMiniAsset] = useState('NQUSD');

  const filteredMessages = activeChannel === 'general'
    ? MOCK_MESSAGES
    : MOCK_MESSAGES.filter((m) => m.channel === activeChannel);

  const currentAsset = MINI_CHART_ASSETS.find((a) => a.id === activeMiniAsset) || MINI_CHART_ASSETS[0];

  return (
    <div className="flex h-full">
      {/* ── 왼쪽: 실시간 뉴스 ─────────────────────────── */}
      <div
        className="w-[280px] shrink-0 flex flex-col"
        style={{ background: '#0A0A0F', borderRight: '1px solid #1A1A1A' }}
      >
        {/* 헤더 */}
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #1A1A1A' }}>
          <div className="flex items-center gap-2">
            <Newspaper size={13} style={{ color: '#00FF41' }} />
            <span className="text-[11px] font-bold text-white">실시간 뉴스</span>
            <span
              className="flex items-center gap-1 text-[9px] ml-auto px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,255,65,0.08)', color: '#00FF41' }}
            >
              <span className="w-1 h-1 rounded-full pulse-live" style={{ background: '#00FF41' }} />
              LIVE
            </span>
          </div>
        </div>

        {/* 뉴스 리스트 */}
        <div className="flex-1 overflow-y-auto py-2">
          {MOCK_NEWS.map((news) => {
            const impactInfo = IMPACT_MAP[news.impact];
            return (
              <div
                key={news.id}
                className="px-4 py-3 cursor-pointer transition-all hover:bg-white/[0.02]"
                style={{ borderBottom: '1px solid rgba(26,26,26,0.5)' }}
              >
                {/* 임팩트 + 시간 */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5"
                    style={{ background: impactInfo.bg, color: impactInfo.color }}
                  >
                    <Flame size={7} />
                    {impactInfo.label}
                  </span>
                  <span className="text-[8px] ml-auto flex items-center gap-0.5" style={{ color: '#444' }}>
                    <Clock size={7} />
                    {news.time}
                  </span>
                </div>

                {/* 제목 */}
                <p className="text-[11px] font-semibold text-white leading-snug mb-1.5 line-clamp-2">
                  {news.title}
                </p>

                {/* 관련 심볼 + 소스 */}
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[8px] font-bold font-mono px-1 py-0.5 rounded"
                    style={{ background: '#0D0D0D', color: '#00FF41', border: '1px solid rgba(0,255,65,0.15)' }}
                  >
                    {news.symbol}
                  </span>
                  <span className="text-[8px] ml-auto" style={{ color: '#444' }}>{news.source}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 중앙: 실시간 채팅 ─────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0" style={{ background: '#0D0D0D' }}>
        {/* 채널 탭 + 헤더 */}
        <div
          className="flex items-center gap-1 px-4 py-2.5 shrink-0"
          style={{ borderBottom: '1px solid #1A1A1A', background: '#0A0A0F' }}
        >
          <MessageCircle size={13} style={{ color: '#00FF41' }} />
          <span className="text-[11px] font-bold text-white mr-3">실시간 채팅</span>

          {/* 채널 탭 */}
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className="text-[9px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-all"
              style={{
                background: activeChannel === ch.id ? 'rgba(0,255,65,0.1)' : 'transparent',
                color: activeChannel === ch.id ? '#00FF41' : '#555',
                border: activeChannel === ch.id ? '1px solid rgba(0,255,65,0.2)' : '1px solid transparent',
              }}
            >
              {ch.label}
            </button>
          ))}

          {/* 접속자 수 */}
          <span
            className="flex items-center gap-1 text-[9px] ml-auto px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,255,65,0.08)', color: '#00FF41' }}
          >
            <span className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: '#00FF41' }} />
            8 접속 중
          </span>
        </div>

        {/* 채팅 메시지 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredMessages.map((msg) => {
            const style = GRADE_STYLES[msg.grade] || GRADE_STYLES.NEW;
            return (
              <div key={msg.id} className="flex gap-2.5">
                {/* 아바타 */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{ background: style.bg, color: style.color }}
                >
                  {getInitials(msg.nickname)}
                </div>

                {/* 메시지 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-[9px] font-bold px-1 py-0.5 rounded"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {msg.grade}
                    </span>
                    <span className="text-[11px] font-semibold text-white">{msg.nickname}</span>
                    <span className="text-[9px] ml-auto" style={{ color: '#333' }}>{msg.time}</span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: '#BBB' }}>
                    {msg.msg}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 입력 영역 */}
        <div className="shrink-0 p-3" style={{ borderTop: '1px solid #1A1A1A', background: '#0A0A0F' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-2.5 rounded-xl text-[12px] outline-none"
              style={{ background: '#111118', border: '1px solid #1A1A1A', color: 'white' }}
            />
            <button
              className="px-4 py-2.5 rounded-xl font-bold text-[12px] cursor-pointer flex items-center gap-1.5"
              style={{ background: '#00FF41', color: '#000' }}
            >
              <Send size={12} />
              전송
            </button>
          </div>
        </div>
      </div>

      {/* ── 오른쪽: AI 시그널 미니차트 ──────────────────── */}
      <div
        className="w-[300px] shrink-0 flex flex-col"
        style={{ background: '#0A0A0F', borderLeft: '1px solid #1A1A1A' }}
      >
        {/* 헤더 */}
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #1A1A1A' }}>
          <div className="flex items-center gap-2 mb-2.5">
            <Zap size={13} style={{ color: '#00FF41' }} />
            <span className="text-[11px] font-bold text-white">AI 시그널</span>
            <span
              className="flex items-center gap-1 text-[9px] ml-auto px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,255,65,0.08)', color: '#00FF41' }}
            >
              <span className="w-1 h-1 rounded-full pulse-live" style={{ background: '#00FF41' }} />
              실시간
            </span>
          </div>

          {/* 종목 탭 */}
          <div className="flex gap-1">
            {MINI_CHART_ASSETS.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setActiveMiniAsset(asset.id)}
                className="flex-1 text-[9px] font-bold px-2 py-1.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: activeMiniAsset === asset.id ? 'rgba(0,255,65,0.1)' : '#111118',
                  color: activeMiniAsset === asset.id ? '#00FF41' : '#555',
                  border: activeMiniAsset === asset.id ? '1px solid rgba(0,255,65,0.2)' : '1px solid #1A1A1A',
                }}
              >
                {asset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 현재가 + 방향 */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid #1A1A1A' }}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black font-mono text-white">
              {currentAsset.price}
            </span>
            <span
              className="text-[11px] font-bold flex items-center gap-0.5"
              style={{
                color: currentAsset.dir === 'buy' ? '#00FF41' : '#FF3B3B',
              }}
            >
              {currentAsset.dir === 'buy' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {currentAsset.change}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: currentAsset.dir === 'buy' ? 'rgba(0,255,65,0.1)' : 'rgba(255,59,59,0.1)',
                color: currentAsset.dir === 'buy' ? '#00FF41' : '#FF3B3B',
              }}
            >
              {currentAsset.dir === 'buy' ? '매수' : '매도'}
            </span>
            <span className="text-[9px]" style={{ color: '#444' }}>5분봉 기준</span>
          </div>
        </div>

        {/* 미니 캔들차트 */}
        <div className="flex-1 min-h-0 px-2 py-2">
          <MiniCandleChart symbol={activeMiniAsset} />
        </div>

        {/* 하단: HOT 시그널 요약 */}
        <div
          className="shrink-0 px-4 py-3"
          style={{ borderTop: '1px solid #1A1A1A' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Crown size={11} style={{ color: '#FFD700' }} />
            <span className="text-[10px] font-bold text-white">HOT 시그널</span>
          </div>
          {[
            { user: 'WhaleKing', symbol: 'GCUSD', direction: 'buy' as const, confidence: 92 },
            { user: 'ScalperPro', symbol: 'NQUSD', direction: 'buy' as const, confidence: 85 },
            { user: 'TopTrader', symbol: 'NQUSD', direction: 'sell' as const, confidence: 78 },
          ].map((s, i) => {
            const isBuy = s.direction === 'buy';
            return (
              <div
                key={i}
                className="flex items-center gap-2 py-1.5"
                style={{ borderBottom: i < 2 ? '1px solid rgba(26,26,26,0.5)' : 'none' }}
              >
                <span className="text-[9px] font-bold" style={{ color: '#666' }}>{s.user}</span>
                <span
                  className="text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5"
                  style={{
                    background: isBuy ? 'rgba(0,255,65,0.08)' : 'rgba(255,59,59,0.08)',
                    color: isBuy ? '#00FF41' : '#FF3B3B',
                  }}
                >
                  {isBuy ? <TrendingUp size={7} /> : <TrendingDown size={7} />}
                  {isBuy ? '매수' : '매도'}
                </span>
                <span className="text-[9px] font-bold font-mono" style={{ color: '#555' }}>{s.symbol}</span>
                <span className="text-[9px] font-mono ml-auto" style={{ color: '#444' }}>{s.confidence}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
