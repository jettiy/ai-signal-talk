'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Send, Newspaper, Clock, Flame, TrendingUp, TrendingDown,
  Zap, Loader2,
} from 'lucide-react';
import { useMarketData } from '@/hooks/useMarketData';
import { useNews } from '@/hooks/useNews';

// ── 등급 스타일 ────────────────────────────────────────────────
const GRADE_STYLES: Record<string, { color: string; bg: string }> = {
  WHALE: { color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
  PRO: { color: '#00FF41', bg: 'rgba(0,255,65,0.1)' },
  ADMIN: { color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
  BASIC: { color: '#555', bg: 'rgba(85,85,85,0.1)' },
  'TOP 1%': { color: '#FF6B6B', bg: 'rgba(255,107,107,0.1)' },
  'LV.05': { color: '#A855F7', bg: 'rgba(168,85,247,0.1)' },
  BOT: { color: '#00B4D8', bg: 'rgba(0,180,216,0.1)' },
  NEW: { color: '#666', bg: 'rgba(102,102,102,0.1)' },
};

// ── 채널 ──────────────────────────────────────────────────────
const CHANNELS = [
  { id: 'general', label: '전체' },
];

// ── Mock 메시지 ────────────────────────────────────────────────
const MOCK_MESSAGES = [
  { id: 1, grade: 'WHALE', nickname: 'WhaleKing', msg: '골드 4810에서 롱 진입. TP 4850, SL 4780', time: '09:12', channel: 'gc' },
  { id: 2, grade: 'BOT', nickname: 'SIGNAL_BOT', msg: 'GOLD $4,800 돌파 확인. 오버나이즈 모멘텀 강세 전환 감지', time: '09:14', channel: 'gc' },
  { id: 3, grade: 'PRO', nickname: 'ScalperPro', msg: 'NQ 21,280 지지 확인. 여기서 반등 기대', time: '09:16', channel: 'nq' },
  { id: 4, grade: 'BOT', nickname: 'AI_ANALYST', msg: 'AI 시그널: NVDA SHORT 전환, 신뢰도 65%. 오버나이즈 매도 압력 감지', time: '09:18', channel: 'signal' },
  { id: 5, grade: 'PRO', nickname: 'ScalperPro', msg: '오늘 골드 약세없음. 계속 롱 관점', time: '09:22', channel: 'gc' },
  { id: 6, grade: 'WHALE', nickname: 'GoldBull', msg: '4시간봉 EMA 지지 깔끔. 4850 도달 가능', time: '09:25', channel: 'gc' },
  { id: 7, grade: 'TOP 1%', nickname: 'SwiftTrade', msg: 'NQ RSI 과매수. 21,350에서 매도 전환?', time: '09:28', channel: 'nq' },
  { id: 8, grade: 'PRO', nickname: 'OilTrader', msg: 'WTI $64.80 롱 진입. OPEC 감산 연장 호재', time: '09:30', channel: 'cl' },
  { id: 9, grade: 'BOT', nickname: 'SIGNAL_BOT', msg: 'GC 5분봉 매수 시그널 감지. 신뢰도 82%. 강한 매수세 유지 중', time: '09:32', channel: 'signal' },
  { id: 10, grade: 'WHALE', nickname: 'WhaleKing', msg: 'NQ 21,250 응봉 확인. 추가 상승 가능', time: '09:35', channel: 'nq' },
  { id: 11, grade: 'TOP 1%', nickname: 'BearHunter', msg: '15:10 오늘 시장이 열릴 때 조심하세요. 변동성 클 수 있음', time: '09:38', channel: 'general' },
  { id: 12, grade: 'PRO', nickname: 'ScalperPro', msg: '지난 4월 19일 자산가치를 줄인 것 같습니다. 여기서 강조할 점은 리스크 관리입니다', time: '09:42', channel: 'general' },
];

// ── Mock 뉴스 ─────────────────────────────────────────────────
const MOCK_NEWS = [
  { id: 1, title: '연준, 금리 동결 결정... "추가 인하 여지 열어두겠다"', source: 'Reuters', time: '12분 전', impact: 'high' as const, symbol: 'NQUSD' },
  { id: 2, title: '골드, $4,800 돌파... 중앙은행 매수세 + 지정학 리스크', source: 'Bloomberg', time: '28분 전', impact: 'high' as const, symbol: 'GCUSD' },
  { id: 3, title: '엔비디아, AI 칩 수요 견조... 분기 매출 30% 증가 전망', source: 'CNBC', time: '1시간 전', impact: 'medium' as const, symbol: 'NQUSD' },
  { id: 4, title: 'WTI 원유, OPEC+ 감산 연장 소식에 $65 회복', source: 'Energy Voice', time: '2시간 전', impact: 'medium' as const, symbol: 'CLUSD' },
  { id: 5, title: '비트코인, 기관 투자자 유입 본격화... ETF 사상 최대', source: 'CoinDesk', time: '3시간 전', impact: 'high' as const, symbol: 'BTCUSD' },
  { id: 6, title: '애플, AI 기능 탑재 아이폰 17 공급망 물량 20% 증량', source: 'Nikkei Asia', time: '4시간 전', impact: 'low' as const, symbol: 'AAPL' },
  { id: 7, title: '유럽 CPI 예상치 하회... ECB 추가 인하 가능성', source: 'FT', time: '5시간 전', impact: 'medium' as const, symbol: 'NQUSD' },
];

const IMPACT_MAP = {
  high: { label: '높음', color: '#FF3B3B', bg: 'rgba(255,59,59,0.1)' },
  medium: { label: '보통', color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
  low: { label: '낮음', color: '#555', bg: 'rgba(85,85,85,0.1)' },
};

// ── 미니차트 종목 ──────────────────────────────────────────────
const MINI_CHART_ASSETS = [
  { id: 'KOSPI', label: '코스피선물', price: '2,650.30', change: '+0.00', dir: 'buy' as const },
  { id: 'NQUSD', label: '나스닥(QQQ)', price: '21,285.50', change: '+0.42', dir: 'buy' as const },
  { id: 'GCUSD', label: '골드(GLD)', price: '4,821.30', change: '+1.18', dir: 'buy' as const },
  { id: 'CLUSD', label: 'WTI(USO)', price: '64.80', change: '-0.35', dir: 'sell' as const },
];

// ── 시간프레임 ──────────────────────────────────────────────
const TIMEFRAMES = [
  { id: '1min', label: '1M' },
  { id: '5min', label: '5M' },
  { id: '15min', label: '15M' },
  { id: '30min', label: '30M' },
  { id: '1hour', label: '1H' },
  { id: '1day', label: '1D' },
];

// ── @멘션 자동완성 옵션 ──────────────────────────────────
const MENTION_OPTIONS = [
  { key: 'AI', desc: 'AI 분석가 (Z.AI GLM 호출)', emoji: '⚡' },
  { key: '시그널', desc: '시그널 봇 (시그널 요약)', emoji: '📊' },
  { key: '뉴스', desc: '뉴스 봇 (최신 뉴스 요약)', emoji: '📰' },
];

// ── 등급 이니셜 ────────────────────────────────────────────
function getInitials(nickname: string) {
  return nickname.slice(0, 2).toUpperCase();
}

// ── 상대 시간 포맷 ──────────────────────────────────────
function formatRelativeTime(dateStr: string): string {
  try {
    const now = Date.now();
    const published = new Date(dateStr).getTime();
    const diffMin = Math.floor((now - published) / 60000);
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}시간 전`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}일 전`;
    return dateStr.slice(0, 10);
  } catch {
    return '';
  }
}

// ── 원형 신뢰도 게이지 ────────────────────────────────────
function ConfidenceGauge({ value, size = 80 }: { value: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  const isHigh = value >= 70;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1A1A1A"
          strokeWidth={strokeWidth}
        />
        {/* 프로그레스 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isHigh ? '#00FF41' : '#FFD700'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{
            filter: isHigh ? 'drop-shadow(0 0 6px rgba(0,255,65,0.4))' : 'drop-shadow(0 0 6px rgba(255,215,0,0.4))',
          }}
        />
      </svg>
      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black font-mono" style={{ color: isHigh ? '#00FF41' : '#FFD700' }}>
          {value}%
        </span>
        <span className="text-[7px] font-bold" style={{ color: '#555' }}>CONF</span>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────
export default function CommunityPanel({ userName = '트레이더' }: { userName?: string }) {
  const [input, setInput] = useState('');
  const [activeChannel, setActiveChannel] = useState('general');
  const [activeMiniAsset, setActiveMiniAsset] = useState('NQUSD');
  const [activeTimeframe, setActiveTimeframe] = useState('1min');
  const [chatMessages, setChatMessages] = useState<
    { id: number; grade: string; nickname: string; msg: string; time: string; channel: string }[]
  >(MOCK_MESSAGES);
  const [aiLoading, setAiLoading] = useState(false);
  const [signalLoading, setSignalLoading] = useState(false);
  const [mentionDropdownOpen, setMentionDropdownOpen] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // ── AI 시그널 결과 (버튼 클릭 시 저장) ──
  const [signalResult, setSignalResult] = useState<{ entryPrice?: number; targetPrice?: number; stopLoss?: number; confidence?: number; signalType?: string } | null>(null);

  // ── 실시간 뉴스 (FMP Breaking + 한국어 번역) — 5분 간신 ──
  const { data: newsData, isLoading: newsLoading } = useNews({ mode: 'breaking' });

  // 누적 뉴스: 새 응답이 오면 기존에 없는 것만 앞에 추가 (최대 50개)
  const [accumulatedNews, setAccumulatedNews] = useState<any[]>([]);
  const prevTitlesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (newsData && newsData.length > 0) {
      const newItems = newsData.filter((n: any) => !prevTitlesRef.current.has(n.title?.slice(0, 50)));
      if (newItems.length > 0) {
        newItems.forEach((n: any) => prevTitlesRef.current.add(n.title?.slice(0, 50)));
        setAccumulatedNews(prev => [...newItems, ...prev].slice(0, 50));
      }
    }
  }, [newsData]);

  // ── 실시간 시세 데이터 ──
  const { data: allQuotes } = useMarketData();
  const nqQuote = allQuotes?.find(q => q.symbol === 'NQUSD');
  const gcQuote = allQuotes?.find(q => q.symbol === 'GCUSD');
  const clQuote = allQuotes?.find(q => q.symbol === 'CLUSD');

  // 실시간 시세로 MINI_CHART_ASSETS 업데이트
  const liveAssets = [
    { id: 'KOSPI' as const, label: '코스피선물', price: MINI_CHART_ASSETS[0].price, change: MINI_CHART_ASSETS[0].change, dir: 'buy' as 'buy' | 'sell' },
    { id: 'NQUSD' as const, label: '나스닥(QQQ)', price: nqQuote ? nqQuote.price.toLocaleString() : MINI_CHART_ASSETS[1].price, change: nqQuote ? nqQuote.changesPercentage.toFixed(2) : MINI_CHART_ASSETS[1].change, dir: ((nqQuote?.changesPercentage ?? 0) >= 0 ? 'buy' : 'sell') as 'buy' | 'sell' },
    { id: 'GCUSD' as const, label: '골드(GLD)', price: gcQuote ? gcQuote.price.toLocaleString() : MINI_CHART_ASSETS[2].price, change: gcQuote ? gcQuote.changesPercentage.toFixed(2) : MINI_CHART_ASSETS[2].change, dir: ((gcQuote?.changesPercentage ?? 0) >= 0 ? 'buy' : 'sell') as 'buy' | 'sell' },
    { id: 'CLUSD' as const, label: 'WTI(USO)', price: clQuote ? clQuote.price.toLocaleString() : MINI_CHART_ASSETS[3].price, change: clQuote ? clQuote.changesPercentage.toFixed(2) : MINI_CHART_ASSETS[3].change, dir: ((clQuote?.changesPercentage ?? 0) >= 0 ? 'buy' : 'sell') as 'buy' | 'sell' },
  ];

  const activeLiveAsset = liveAssets.find(a => a.id === activeMiniAsset) || liveAssets[0];

  const filteredMessages = activeChannel === 'general'
    ? chatMessages
    : chatMessages.filter((m) => m.channel === activeChannel);

  // ── @멘션 감지 헬퍼 ──────────────────────────────────
  const getCurrentMention = (text: string) => {
    const match = text.match(/@([^\s@]*)$/);
    if (match) {
      return { atIndex: match.index!, filter: match[1] };
    }
    return null;
  };

  const getFilteredMentionOptions = () => {
    const mention = getCurrentMention(input);
    if (!mention) return MENTION_OPTIONS;
    return MENTION_OPTIONS.filter(opt =>
      opt.key.toLowerCase().startsWith(mention.filter.toLowerCase())
    );
  };

  const selectMention = (optionKey: string) => {
    const mention = getCurrentMention(input);
    if (mention) {
      const before = input.slice(0, mention.atIndex);
      const after = input.slice(mention.atIndex + 1 + mention.filter.length);
      setInput(before + '@' + optionKey + ' ' + after);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    setMentionDropdownOpen(false);
    setMentionIndex(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    const mention = getCurrentMention(value);
    if (mention) {
      const filtered = MENTION_OPTIONS.filter(opt =>
        opt.key.toLowerCase().startsWith(mention.filter.toLowerCase())
      );
      if (filtered.length > 0) {
        setMentionDropdownOpen(true);
        setMentionIndex(0);
      } else {
        setMentionDropdownOpen(false);
      }
    } else {
      setMentionDropdownOpen(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const filtered = mentionDropdownOpen ? getFilteredMentionOptions() : [];

    if (mentionDropdownOpen && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filtered.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[mentionIndex]) {
          selectMention(filtered[mentionIndex].key);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionDropdownOpen(false);
        return;
      }
    }

    if (e.key === 'Enter' && !mentionDropdownOpen) {
      handleSend();
    }
  };

  // AI 채팅 에이전트 호출 (+ @멘션 분기)
  const isPrivateAiCall = (text: string) => /(^|\s)@ai(\s|$)/i.test(text);
  const getPrivateAiQuery = (text: string) => text.replace(/(^|\s)@ai(\s|$)/i, ' ').trim();

  const handleSend = async () => {
    if (!input.trim() || aiLoading) return;
    const userMsg = input.trim();
    setInput('');
    setMentionDropdownOpen(false);

    {
      const now = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

      if (isPrivateAiCall(userMsg)) {
        const query = getPrivateAiQuery(userMsg);
        if (!query) {
          setChatMessages((prev) => [...prev, {
            id: Date.now(),
            grade: 'BOT',
            nickname: '@AI',
            msg: '@AI 뒤에 질문을 입력해주세요. 이 대화는 본인 화면에만 표시됩니다.',
            time: now(),
            channel: activeChannel,
          }]);
          return;
        }

        setChatMessages((prev) => [...prev, {
          id: Date.now(),
          grade: 'BASIC',
          nickname: `${userName} · 개인`,
          msg: query,
          time: now(),
          channel: activeChannel,
        }]);

        setAiLoading(true);
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: query }),
          });
          const data = await res.json();
          setChatMessages((prev) => [...prev, {
            id: Date.now() + 1,
            grade: 'BOT',
            nickname: '@AI · 개인',
            msg: data.content || data.error || 'AI 응답을 생성하지 못했습니다.',
            time: now(),
            channel: activeChannel,
          }]);
        } catch {
          setChatMessages((prev) => [...prev, {
            id: Date.now() + 1,
            grade: 'BOT',
            nickname: '@AI · 개인',
            msg: 'AI 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
            time: now(),
            channel: activeChannel,
          }]);
        } finally {
          setAiLoading(false);
        }
        return;
      }

      setChatMessages((prev) => [...prev, {
        id: Date.now(),
        grade: 'BASIC',
        nickname: userName,
        msg: userMsg,
        time: now(),
        channel: activeChannel,
      }]);
      return;
    }

    // 사용자 메시지 추가
    const userMsgObj = {
      id: Date.now(),
      grade: 'BASIC',
      nickname: '나',
      msg: userMsg,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      channel: activeChannel,
    };
    setChatMessages((prev) => [...prev, userMsgObj]);

    // ── @AI 멘션 → AI 분석가 전용 처리 ─────────────────
    if (userMsg.includes('@AI')) {
      const query = userMsg.replace(/@AI\s*/, '').trim();
      if (!query) return;
      setAiLoading(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.content) {
            setChatMessages((prev) => [...prev, {
              id: Date.now() + 1,
              grade: 'BOT',
              nickname: '@AI',
              msg: data.content,
              time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
              channel: activeChannel,
            }]);
          }
        }
      } catch {
        // AI 응답 실패 시 조용히 무시
      }
      setAiLoading(false);
      return;
    }

    // ── @시그널 멘션 → 시그널 봇 Mock 응답 ─────────────
    if (userMsg.includes('@시그널')) {
      const assetInfo = MINI_CHART_ASSETS.find(a => a.id === activeMiniAsset);
      const entryPrice = activeMiniAsset === 'KOSPI' ? '2,645.00' : activeMiniAsset === 'NQUSD' ? '21,210.50' : activeMiniAsset === 'GCUSD' ? '4,810.20' : '64.50';
      const targetPrice = activeMiniAsset === 'KOSPI' ? '2,680.00' : activeMiniAsset === 'NQUSD' ? '21,450.00' : activeMiniAsset === 'GCUSD' ? '4,880.00' : '66.20';
      const direction = assetInfo?.dir === 'buy' ? '매수' : '매도';
      const confidence = 76;

      setChatMessages((prev) => [...prev, {
        id: Date.now() + 1,
        grade: 'BOT',
        nickname: '@시그널',
        msg: `📊 현재 ${assetInfo?.label || activeMiniAsset}(${activeMiniAsset}) ${direction} 시그널 감지. 신뢰도 ${confidence}%. 진입가 ${entryPrice} → 목표가 ${targetPrice}`,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        channel: activeChannel,
      }]);
      return;
    }

    // ── @뉴스 멘션 → 뉴스 봇 Mock 응답 ─────────────────
    if (userMsg.includes('@뉴스')) {
      const topNews = MOCK_NEWS.slice(0, 3);
      const newsSummary = topNews.map((n, i) => `${i + 1}. ${n.title}`).join('\n');

      setChatMessages((prev) => [...prev, {
        id: Date.now() + 1,
        grade: 'BOT',
        nickname: '@뉴스',
        msg: `📰 최신 뉴스 요약:\n${newsSummary}`,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        channel: activeChannel,
      }]);
      return;
    }

    // ── 기본: 기존 /api/chat 호출 ──────────────────────
    setAiLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          const aiMsg = {
            id: Date.now() + 1,
            grade: 'BOT',
            nickname: 'AI_ANALYST',
            msg: data.content,
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            channel: activeChannel,
          };
          setChatMessages((prev) => [...prev, aiMsg]);
        }
      }
    } catch {
      // AI 응답 실패 시 조용히 무시
    }
    setAiLoading(false);
  };

  const currentAsset = liveAssets.find((a) => a.id === activeMiniAsset) || liveAssets[0];

  return (
    <div className="flex h-full">
      {/* ── 왼쪽: 실시간 뉴스 (20%) ──────────────────────── */}
      <div
        className="w-[20%] min-w-[220px] shrink-0 flex flex-col"
        style={{ background: '#0A0A0F', borderRight: '1px solid #1A1A1A' }}
      >
        {/* 헤더 */}
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #1A1A1A' }}>
          <div className="flex items-center gap-2">
            <Newspaper size={13} style={{ color: '#00FF41' }} />
            <span className="text-[11px] font-bold text-white">실시간 뉴스</span>
            <span
              className="flex items-center gap-1 text-[8px] ml-auto px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,255,65,0.08)', color: '#00FF41' }}
            >
              <span className="w-1 h-1 rounded-full pulse-live" style={{ background: '#00FF41' }} />
              LIVE
            </span>
          </div>
        </div>

        {/* 뉴스 리스트 */}
        <div className="flex-1 overflow-y-auto py-1">
          {newsLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={14} className="animate-spin" style={{ color: '#333' }} />
            </div>
          )}
          {(accumulatedNews.length > 0 ? accumulatedNews : newsLoading ? [] : MOCK_NEWS).map((news: any, idx: number) => {
            const impactInfo = (IMPACT_MAP as Record<string, typeof IMPACT_MAP.medium>)[news.impact as string] || IMPACT_MAP.medium;
            const newsUrl = news.url && news.url !== '#' ? news.url : '';
            const newsTime = formatRelativeTime(news.publishedDate || news.time || new Date().toISOString());
            return (
              <a
                key={news.title || idx}
                href={newsUrl || undefined}
                target={newsUrl ? '_blank' : undefined}
                rel={newsUrl ? 'noopener noreferrer' : undefined}
                className="block px-4 py-3 cursor-pointer transition-all hover:bg-white/[0.02]"
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
                    {newsTime}
                  </span>
                </div>

                {/* 제목 */}
                <p className="text-[11px] font-semibold text-white leading-snug mb-1.5 line-clamp-2">
                  {news.title}
                </p>

                {/* 관련 심볼 + 소스 */}
                <div className="flex items-center gap-1.5">
                  {news.symbol && (
                    <span
                      className="text-[8px] font-bold font-mono px-1 py-0.5 rounded"
                      style={{ background: '#0D0D0D', color: '#00FF41', border: '1px solid rgba(0,255,65,0.15)' }}
                    >
                      {news.symbol}
                    </span>
                  )}
                  {news.source && (
                    <span className="text-[8px] ml-auto" style={{ color: '#444' }}>{news.source}</span>
                  )}
                  {newsUrl && (
                    <span className="text-[8px]" style={{ color: '#333' }}>↗</span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* ── 중앙: 실시간 채팅 (60%) ──────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0" style={{ background: '#0D0D0D' }}>
        {/* 채널 탭 + 헤더 */}
        <div
          className="flex items-center gap-1 px-4 py-2.5 shrink-0"
          style={{ borderBottom: '1px solid #1A1A1A', background: '#0A0A0F' }}
        >
          <MessageCircle size={13} style={{ color: '#00FF41' }} />
          <span className="text-[11px] font-bold text-white mr-2">실시간 채팅</span>

          {/* 채널 탭 - 전체 통합 */}
          <span className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(0,255,65,0.1)', color: '#00FF41', border: '1px solid rgba(0,255,65,0.2)' }}>
            전체
          </span>

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
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredMessages.map((msg) => {
            const style = GRADE_STYLES[msg.grade] || GRADE_STYLES.BASIC;
            const isBot = msg.grade === 'BOT';
            return (
              <div key={msg.id} className="flex gap-3">
                {/* 아바타 */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{
                    background: isBot ? 'rgba(0,180,216,0.12)' : style.bg,
                    color: isBot ? '#00B4D8' : style.color,
                    border: isBot ? '1px solid rgba(0,180,216,0.25)' : 'none',
                  }}
                >
                  {isBot ? <Zap size={14} /> : getInitials(msg.nickname)}
                </div>

                {/* 메시지 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {msg.grade}
                    </span>
                    <span className="text-[11px] font-semibold" style={{ color: isBot ? '#00B4D8' : '#FFF' }}>
                      {msg.nickname.startsWith('@') ? (
                        <>
                          <span style={{ color: '#00FF41' }}>@</span>
                          <Zap size={10} style={{ color: '#00B4D8', display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />
                          <span style={{ color: '#00B4D8' }}>{msg.nickname.slice(1)}</span>
                        </>
                      ) : msg.nickname}
                    </span>
                    <span className="text-[9px] ml-auto" style={{ color: '#333' }}>{msg.time}</span>
                  </div>
                  <div
                    className="text-[12px] leading-relaxed rounded-lg px-3 py-2 inline-block max-w-full"
                    style={{
                      color: '#CCC',
                      background: isBot ? 'rgba(0,180,216,0.04)' : 'rgba(255,255,255,0.02)',
                      borderLeft: isBot ? '2px solid rgba(0,180,216,0.3)' : '2px solid transparent',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.msg}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 입력 영역 */}
        <div className="shrink-0 p-3" style={{ borderTop: '1px solid #1A1A1A', background: '#0A0A0F' }}>
          {/* @멘션 자동완성 드롭다운 */}
          {mentionDropdownOpen && getFilteredMentionOptions().length > 0 && (
            <div
              className="mb-2 rounded-lg overflow-hidden"
              style={{ background: '#111118', border: '1px solid #1A1A1A' }}
            >
              {getFilteredMentionOptions().map((opt, idx) => (
                  <div
                    key={opt.key}
                    className="px-3 py-2 cursor-pointer flex items-center gap-2 transition-all"
                    style={{
                      background: idx === mentionIndex ? 'rgba(0,255,65,0.08)' : 'transparent',
                    }}
                    onMouseEnter={() => setMentionIndex(idx)}
                    onClick={() => selectMention(opt.key)}
                  >
                    <span className="text-[14px]">{opt.emoji}</span>
                    <span className="text-[12px]" style={{ color: '#00FF41', fontWeight: 'bold' }}>@</span>
                    <span className="text-[12px] font-bold" style={{ color: '#00B4D8' }}>{opt.key}</span>
                    <span className="text-[10px] ml-1" style={{ color: '#555' }}>— {opt.desc}</span>
                  </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder="@AI 골드 전망 어때?"
              className="flex-1 px-4 py-2.5 rounded-xl text-[12px] outline-none"
              style={{ background: '#111118', border: '1px solid #1A1A1A', color: 'white' }}
              disabled={aiLoading}
            />
            <button
              onClick={handleSend}
              disabled={aiLoading || !input.trim()}
              className="px-4 py-2.5 rounded-xl font-bold text-[12px] cursor-pointer flex items-center gap-1.5 transition-all"
              style={{
                background: aiLoading ? '#333' : '#00FF41',
                color: aiLoading ? '#666' : '#000',
                opacity: !input.trim() ? 0.5 : 1,
              }}
            >
              <Send size={12} />
              {aiLoading ? '분석중' : '전송'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 오른쪽: AI 시그널 미니차트 (20%) ─────────────── */}
      <div
        className="w-[20%] min-w-[260px] shrink-0 flex flex-col"
        style={{ background: '#0A0A0F', borderLeft: '1px solid #1A1A1A' }}
      >
        {/* 헤더 — 현재가 + 변동률 */}
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #1A1A1A' }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} style={{ color: '#00FF41' }} />
            <span className="text-[11px] font-bold text-white">AI 시그널</span>
            <span
              className="flex items-center gap-1 text-[8px] ml-auto px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,255,65,0.08)', color: '#00FF41' }}
            >
              <span className="w-1 h-1 rounded-full pulse-live" style={{ background: '#00FF41' }} />
              LIVE
            </span>
          </div>

          {/* 현재가 */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black font-mono text-white">{currentAsset.price}</span>
            <span
              className="text-[11px] font-bold flex items-center gap-0.5"
              style={{ color: currentAsset.dir === 'buy' ? '#00FF41' : '#FF3B3B' }}
            >
              {currentAsset.dir === 'buy' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {currentAsset.change}%
            </span>
          </div>
        </div>

        {/* 종목 탭 + 시간프레임 */}
        <div className="px-4 py-2.5 shrink-0 flex flex-col gap-2" style={{ borderBottom: '1px solid #1A1A1A' }}>
          {/* 종목 탭 */}
          <div className="flex gap-1">
            {liveAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => { setActiveMiniAsset(asset.id); setSignalResult(null); }}
                className="flex-1 text-[8px] font-bold px-1.5 py-1.5 rounded-lg cursor-pointer transition-all"
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
          {/* 시간프레임 */}
          <div className="flex gap-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setActiveTimeframe(tf.id)}
                className="flex-1 text-[8px] font-bold px-1 py-1 rounded cursor-pointer transition-all"
                style={{
                  background: activeTimeframe === tf.id ? 'rgba(0,255,65,0.08)' : 'transparent',
                  color: activeTimeframe === tf.id ? '#00FF41' : '#444',
                  border: activeTimeframe === tf.id ? '1px solid rgba(0,255,65,0.15)' : '1px solid transparent',
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* 종목별 핵심 정보 요약 — 현재 방향, 변동폭, 간단한 지표 */}
        <div className="shrink-0 px-4 py-3" style={{ borderBottom: '1px solid #1A1A1A', height: 160 }}>
          <div className="flex items-center gap-4 h-full">
            {/* 방향 아이콘 + 현재가 */}
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: currentAsset.dir === 'buy' ? 'rgba(0,255,65,0.08)' : 'rgba(255,59,59,0.08)',
                  border: `2px solid ${currentAsset.dir === 'buy' ? 'rgba(0,255,65,0.3)' : 'rgba(255,59,59,0.3)'}`,
                }}
              >
                {currentAsset.dir === 'buy' ? (
                  <TrendingUp size={24} style={{ color: '#00FF41' }} />
                ) : (
                  <TrendingDown size={24} style={{ color: '#FF3B3B' }} />
                )}
              </div>
              <span
                className="text-[9px] font-bold"
                style={{ color: currentAsset.dir === 'buy' ? '#00FF41' : '#FF3B3B' }}
              >
                {currentAsset.dir === 'buy' ? '상승' : '하락'}
              </span>
            </div>
            {/* 가격 정보 */}
            <div className="flex-1 space-y-1">
              <div>
                <span className="text-[8px] font-bold block" style={{ color: '#555' }}>현재가</span>
                <span className="text-lg font-black font-mono text-white">{currentAsset.price}</span>
              </div>
              <div>
                <span className="text-[8px] font-bold block" style={{ color: '#555' }}>변동률</span>
                <span
                  className="text-sm font-bold flex items-center gap-1"
                  style={{ color: currentAsset.dir === 'buy' ? '#00FF41' : '#FF3B3B' }}
                >
                  {currentAsset.dir === 'buy' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {currentAsset.change}%
                </span>
              </div>
              <div>
                <span className="text-[8px] font-bold block" style={{ color: '#555' }}>현재 방향</span>
                <span className="text-xs font-bold" style={{ color: currentAsset.dir === 'buy' ? '#00FF41' : '#FF3B3B' }}>
                  {currentAsset.dir === 'buy' ? '▲ 상승 추세' : '▼ 하락 추세'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 신뢰도 게이지 + 진입가/목표가 */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid #1A1A1A' }}
        >
          <div className="flex items-center gap-4">
            {/* 원형 신뢰도 게이지 */}
            <ConfidenceGauge value={signalResult?.confidence ?? 76} size={80} />

            {/* 진입가 / 목표가 / 손절가 */}
            <div className="flex-1 space-y-2">
              <div>
                <span className="text-[8px] font-bold block" style={{ color: '#555' }}>ENTRY PRICE</span>
                <span className="text-sm font-black font-mono text-white">
                  {signalResult?.entryPrice?.toLocaleString() ?? '-'}
                </span>
              </div>
              <div>
                <span className="text-[8px] font-bold block" style={{ color: '#555' }}>TARGET</span>
                <span className="text-sm font-black font-mono" style={{ color: '#00FF41' }}>
                  {signalResult?.targetPrice?.toLocaleString() ?? '-'}
                </span>
              </div>
              <div>
                <span className="text-[8px] font-bold block" style={{ color: '#555' }}>STOP LOSS</span>
                <span className="text-sm font-black font-mono" style={{ color: '#FF3B3B' }}>
                  {signalResult?.stopLoss?.toLocaleString() ?? '-'}
                </span>
              </div>
            </div>
          </div>

          {/* 방향 뱃지 */}
          <div className="flex items-center gap-2 mt-2.5">
            <span
              className="text-[9px] font-bold px-2 py-1 rounded"
              style={{
                background: (signalResult?.signalType === 'LONG' ? true : currentAsset.dir === 'buy') ? 'rgba(0,255,65,0.1)' : 'rgba(255,59,59,0.1)',
                color: (signalResult?.signalType === 'LONG' ? true : currentAsset.dir === 'buy') ? '#00FF41' : '#FF3B3B',
              }}
            >
              {signalResult?.signalType === 'LONG' ? '매수' : signalResult?.signalType === 'SHORT' ? '매도' : currentAsset.dir === 'buy' ? '매수' : '매도'} 시그널
            </span>
            <span className="text-[9px]" style={{ color: '#444' }}>{activeTimeframe} 기준</span>
          </div>
        </div>

        {/* AI 분석 요약 */}
        <div className="flex-1 px-4 py-3 overflow-y-auto min-h-0">
          <span className="text-[9px] font-bold block mb-1.5" style={{ color: '#555' }}>시장 분석 요약</span>
          <p className="text-[10px] leading-relaxed" style={{ color: '#888' }}>
            {signalResult?.confidence
              ? `${currentAsset.label} AI 시그널 분석 완료. 신뢰도 ${signalResult.confidence}%. 진입가 ${signalResult.entryPrice?.toLocaleString() ?? '-'} → 목표가 ${signalResult.targetPrice?.toLocaleString() ?? '-'}`
              : activeMiniAsset === 'KOSPI'
              ? '코스피선물 지수 2650선 지지 테스트 중. AI 분석으로 진입가/목표가를 확인하세요.'
              : activeMiniAsset === 'NQUSD'
              ? '나스닥(QQQ) 상승 모멘텀 유지. RSI 58 중립권, 추가 상승 시 돌파 가능. AI 분석 버튼으로 상세 시그널을 확인하세요.'
              : activeMiniAsset === 'GCUSD'
              ? '골드(GLD) 강세 지속. 중앙은행 매수세 + 지정학 리스크 수혜. AI 분석으로 진입가/목표가를 확인하세요.'
              : 'WTI(USO) 단기 조정 후 반등. OPEC+ 감산 연장 호재. AI 분석으로 매수/매도 시그널을 확인하세요.'}
          </p>
        </div>

        {/* AI 시그널 분석 생성 버튼 */}
        <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid #1A1A1A' }}>
          <button
            onClick={async () => {
              if (signalLoading) return;
              setSignalLoading(true);
              try {
                const liveQuote = allQuotes?.find(q => q.symbol === activeMiniAsset);
                const res = await fetch('/api/ai-signal', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    symbol: activeMiniAsset,
                    price: liveQuote?.price || 0,
                    changePct: liveQuote?.changesPercentage || 0,
                    timeframe: activeTimeframe,
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  const direction = data.signalType === 'LONG' ? '매수' : '매도';
                  setSignalResult({
                    entryPrice: data.entryPrice,
                    targetPrice: data.targetPrice,
                    stopLoss: data.stopLoss,
                    confidence: data.confidence,
                    signalType: data.signalType,
                  });
                  const msg = `🤖 AI 시그널: ${currentAsset.label} ${direction} | 진입가 ${data.entryPrice || '-'} | TP ${data.targetPrice || '-'} | SL ${data.stopLoss || '-'} | 신뢰도 ${data.confidence || '-'}%`;
                  setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    grade: 'BOT',
                    nickname: 'SIGNAL_BOT',
                    msg,
                    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                    channel: 'general',
                  }]);
                }
              } catch {
                setChatMessages(prev => [...prev, {
                  id: Date.now(),
                  grade: 'BOT',
                  nickname: 'SIGNAL_BOT',
                  msg: '⚠️ 시그널 분석 요청 실패. 잠시 후 다시 시도해주세요.',
                  time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                  channel: 'general',
                }]);
              } finally {
                setSignalLoading(false);
              }
            }}
            disabled={signalLoading}
            className="w-full py-2.5 rounded-lg font-bold text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: signalLoading ? '#333' : '#00FF41',
              color: signalLoading ? '#666' : '#000',
            }}
          >
            {signalLoading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Zap size={12} />
                AI시그널 분석 생성하기
              </>
            )}
          </button>
          <p className="text-[8px] text-center mt-1.5" style={{ color: '#333' }}>
            Quant Model V2.4.8 &copy; 2026 AI Signal Talk
          </p>
        </div>
      </div>
    </div>
  );
}
