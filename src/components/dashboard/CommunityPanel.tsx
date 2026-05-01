'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Clock,
  Flame,
  Hash,
  Loader2,
  MessageCircle,
  Newspaper,
  Send,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import { useMarketData } from '@/hooks/useMarketData';
import { useNews } from '@/hooks/useNews';

type AssetId = 'KOSPI' | 'NQUSD' | 'GCUSD' | 'CLUSD' | 'HSIUSD';
type TimeframeId = '1min' | '5min' | '15min' | '30min' | '1hour' | '1day';
type SocketStatus = 'authenticating' | 'connecting' | 'open' | 'closed';

interface ChatMessage {
  id: string;
  nickname: string;
  text: string;
  time: string;
  mine?: boolean;
  system?: boolean;
  isPrivate?: boolean;
}

interface NewsItem {
  id?: number | string;
  title?: string;
  source?: string;
  time?: string;
  publishedDate?: string;
  impact?: 'high' | 'medium' | 'low' | string;
  symbol?: string;
  url?: string;
}

interface SignalResult {
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  confidence?: number;
  signalType?: 'LONG' | 'SHORT' | string;
  rationale?: string;
}

interface Channel {
  id: number;
  name: string;
  symbol: string | null;
}

const BACKEND_HTTP_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ai-signal-talk-backend.onrender.com';

// 채널 API 실패 시 사용할 기본 채널 ID (백엔드 startup에서 생성하는 순서)
const DEFAULT_CHANNELS: Channel[] = [
  { id: 1, name: 'Global', symbol: null },
  { id: 2, name: 'NASDAQ', symbol: 'NQUSD' },
  { id: 3, name: 'HSI', symbol: 'HSIUSD' },
  { id: 4, name: 'GOLD', symbol: 'GCUSD' },
  { id: 5, name: 'OIL', symbol: 'CLUSD' },
  { id: 6, name: 'KOSPI', symbol: 'KSUSD' },
];

const ASSETS: Array<{ id: AssetId; label: string; short: string; fallbackPrice: number }> = [
  { id: 'KOSPI', label: '코스피선물', short: 'KOSPI', fallbackPrice: 2650.3 },
  { id: 'NQUSD', label: '나스닥선물', short: 'NQ', fallbackPrice: 21285.5 },
  { id: 'GCUSD', label: '골드선물', short: 'GOLD', fallbackPrice: 4821.3 },
  { id: 'CLUSD', label: 'WTI선물', short: 'WTI', fallbackPrice: 64.8 },
  { id: 'HSIUSD', label: '항셍선물', short: 'HSI', fallbackPrice: 20850.0 },
];

const CHANNEL_TABS: Array<{ id: string; label: string; icon: string }> = [
  { id: 'global', label: '전체', icon: '🌍' },
  { id: 'NASDAQ', label: '나스닥', icon: '📈' },
  { id: 'HSI', label: '항셍', icon: '🇭🇰' },
  { id: 'GOLD', label: '골드', icon: '🥇' },
  { id: 'OIL', label: '원유', icon: '🛢️' },
  { id: 'KOSPI', label: '코스피', icon: '🇰🇷' },
];

const TIMEFRAMES: Array<{ id: TimeframeId; label: string }> = [
  { id: '1min', label: '1분봉' },
  { id: '5min', label: '5분봉' },
  { id: '15min', label: '15분봉' },
  { id: '30min', label: '30분봉' },
  { id: '1hour', label: '1시간봉' },
  { id: '1day', label: '일봉' },
];

const FALLBACK_NEWS: NewsItem[] = [
  { id: 1, title: '글로벌 증시, 금리 경로 재평가 속 변동성 확대', source: 'Reuters', time: new Date().toISOString(), impact: 'high', symbol: 'NQUSD' },
  { id: 2, title: '골드, 안전자산 수요와 달러 흐름에 민감한 움직임', source: 'Bloomberg', time: new Date().toISOString(), impact: 'medium', symbol: 'GCUSD' },
  { id: 3, title: 'WTI, 재고 지표와 산유국 발언에 단기 방향성 탐색', source: 'MarketWatch', time: new Date().toISOString(), impact: 'medium', symbol: 'CLUSD' },
];

const IMPACT_MAP = {
  high: { label: '중요', color: '#FF3B3B', bg: 'rgba(255,59,59,0.12)' },
  medium: { label: '보통', color: '#FFD700', bg: 'rgba(255,215,0,0.12)' },
  low: { label: '낮음', color: '#666', bg: 'rgba(102,102,102,0.12)' },
};

function formatKstTime(date: Date) {
  return date.toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatKstDateTime(date: Date) {
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatRelativeTime(value?: string) {
  if (!value) return '방금 전';
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) return value;
  const diffMin = Math.max(0, Math.floor((Date.now() - parsed) / 60000));
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${Math.floor(diffHour / 24)}일 전`;
}

function getWsUrl(channelId: number, token: string) {
  const url = new URL(BACKEND_HTTP_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `/ws/chat/${channelId}`;
  url.search = `?token=${encodeURIComponent(token)}`;
  return url.toString();
}

function clearSessionAndRedirect() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

function createSystemMessage(text: string): ChatMessage {
  return {
    id: `system-${Date.now()}-${Math.random()}`,
    nickname: 'SYSTEM',
    text,
    time: formatKstTime(new Date()),
    system: true,
  };
}

function ConfidenceGauge({ value }: { value: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  const color = value >= 70 ? '#00FF41' : value >= 50 ? '#FFD700' : '#FF3B3B';

  return (
    <div className="relative grid h-20 w-20 place-items-center">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#1A1A1A" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-mono text-lg font-black" style={{ color }}>{value}%</p>
        <p className="text-[8px] font-bold text-white/30">PROB</p>
      </div>
    </div>
  );
}

export default function CommunityPanel({ userName = '트레이더' }: { userName?: string }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeAsset, setActiveAsset] = useState<AssetId>('NQUSD');
  const [activeTimeframe, setActiveTimeframe] = useState<TimeframeId>('1min');
  const [signalLoading, setSignalLoading] = useState(false);
  const [signalResult, setSignalResult] = useState<SignalResult | null>(null);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('authenticating');
  const [now, setNow] = useState(() => new Date());
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const [activeChannelTab, setActiveChannelTab] = useState('global');
  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: newsData, isLoading: newsLoading } = useNews({ mode: 'breaking' });
  const { data: allQuotes } = useMarketData();

  const activeAssetMeta = ASSETS.find((asset) => asset.id === activeAsset) || ASSETS[0];
  const quote = allQuotes?.find((item) => item.symbol === activeAsset);
  const price = quote?.price ?? activeAssetMeta.fallbackPrice;
  const change = quote?.changesPercentage ?? 0;
  const direction = change >= 0 ? 'buy' : 'sell';
  const newsItems = ((newsData && newsData.length > 0 ? newsData : FALLBACK_NEWS) as NewsItem[]).slice(0, 30);

  const connectionText = useMemo(() => {
    if (socketStatus === 'open') return '연결됨';
    if (socketStatus === 'authenticating') return '인증 확인 중';
    if (socketStatus === 'connecting') return '연결 중';
    return '재로그인 필요';
  }, [socketStatus]);

  // 채널 목록 로드 (fallback: 기본 채널 ID 사용)
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch(`${BACKEND_HTTP_URL}/api/v2/channels`);
        if (res.ok) {
          const data = await res.json();
          const chs: Channel[] = data.channels || [];
          if (chs.length > 0) {
            setChannels(chs);
            const globalCh = chs.find((c: Channel) => c.name === 'Global');
            setActiveChannelId(globalCh ? globalCh.id : chs[0].id);
            return;
          }
        }
      } catch {
        // API 실패 — fallback 사용
      }
      // fallback: 기본 채널 설정
      console.log('[CHAT] Using fallback channels');
      setChannels(DEFAULT_CHANNELS);
      setActiveChannelId(1); // Global = id 1
    };
    void fetchChannels();
  }, []);

  // 채널 탭 → 채널 ID 매핑
  useEffect(() => {
    const tabToChannelName: Record<string, string> = {
      global: 'Global',
      NASDAQ: 'NASDAQ',
      HSI: 'HSI',
      GOLD: 'GOLD',
      OIL: 'OIL',
      KOSPI: 'KOSPI',
    };
    const targetName = tabToChannelName[activeChannelTab];
    const ch = channels.find((c) => c.name === targetName);
    if (ch) {
      setActiveChannelId(ch.id);
    } else {
      // fallback: 탭 이름으로 기본 채널 ID 추측
      const fallback = DEFAULT_CHANNELS.find((c) => c.name === targetName);
      if (fallback) setActiveChannelId(fallback.id);
    }
  }, [activeChannelTab, channels]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 채널 변경 시 이전 메시지 로드
  useEffect(() => {
    if (!activeChannelId) return;
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const res = await fetch(`${BACKEND_HTTP_URL}/api/v2/channels/${activeChannelId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const loaded: ChatMessage[] = (Array.isArray(data) ? data : []).map((msg: Record<string, unknown>) => ({
            id: String(msg.id),
            nickname: (msg.nickname as string) || '트레이더',
            text: (msg.content as string) || '',
            time: msg.created_at ? formatKstTime(new Date(msg.created_at as string)) : formatKstTime(new Date()),
            mine: (msg.nickname as string) === userName,
          }));
          setMessages([
            createSystemMessage(
              activeChannelTab === 'global'
                ? '전체 채팅방입니다. 모든 트레이더와 소통하세요.'
                : `${CHANNEL_TABS.find((t) => t.id === activeChannelTab)?.label || ''} 종목 채팅방입니다.`
            ),
            ...loaded,
          ]);
        }
      } catch {
        // 메시지 로드 실패
      }
    };
    void fetchMessages();
  }, [activeChannelId, activeChannelTab, userName]);

  // WebSocket 연결 (채널 기반 + 자동 재연결)
  useEffect(() => {
    if (!activeChannelId) return;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT = 5;

    const connect = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setSocketStatus('closed');
        setMessages((prev) => [...prev, createSystemMessage('로그인 인증이 필요합니다.')]);
        clearSessionAndRedirect();
        return;
      }

      if (cancelled) return;

      setSocketStatus('connecting');
      try {
        socket = new WebSocket(getWsUrl(activeChannelId, token));
      } catch (err) {
        console.error('[WS] WebSocket 생성 실패:', err);
        setSocketStatus('closed');
        return;
      }
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts = 0;
        setSocketStatus('open');
      };

      socket.onclose = (event) => {
        setSocketStatus('closed');
        if (event.code === 4001) {
          setMessages((prev) => [...prev, createSystemMessage('채팅 인증이 만료되었습니다. 다시 로그인해주세요.')]);
          clearSessionAndRedirect();
          return;
        }
        // 자동 재연결
        if (!cancelled && reconnectAttempts < MAX_RECONNECT) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT})`);
          reconnectTimer = setTimeout(() => {
            if (!cancelled) void connect();
          }, delay);
        }
      };

      socket.onerror = () => {
        setSocketStatus('closed');
        socket?.close();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'presence') {
            return;
          }

          if (data.type === 'message') {
            setMessages((prev) => [
              ...prev,
              {
                id: `${data.id || Date.now()}-${Math.random()}`,
                nickname: data.nickname || '트레이더',
                text: data.content || '',
                time: data.created_at
                  ? formatKstTime(new Date(data.created_at))
                  : data.timestamp
                    ? formatKstTime(new Date(data.timestamp))
                    : formatKstTime(new Date()),
                mine: data.nickname === userName,
              },
            ]);
            return;
          }

          // AI 개인 응답
          if (data.type === 'private_user' || data.type === 'private_ai' || data.type === 'private_system') {
            setMessages((prev) => [
              ...prev,
              {
                id: `private-${Date.now()}-${Math.random()}`,
                nickname: data.type === 'private_ai' ? '🤖 AI' : data.type === 'private_system' ? 'SYSTEM' : (data.nickname || userName),
                text: data.content || '',
                time: data.timestamp ? formatKstTime(new Date(data.timestamp)) : formatKstTime(new Date()),
                mine: data.type === 'private_user',
                isPrivate: true,
              },
            ]);
          }
        } catch {
          // Ignore malformed socket payloads.
        }
      };
    };

    void connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [activeChannelId, userName]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ content: text }));
      return;
    }

    setMessages((prev) => [
      ...prev,
      createSystemMessage('연결을 확인하는 중입니다. 연결 후 다시 전송해주세요.'),
    ]);
  };

  const handleGenerateSignal = async () => {
    if (signalLoading) return;
    setSignalLoading(true);
    setSignalResult(null);

    try {
      const response = await fetch('/api/ai-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: activeAsset,
          price,
          changePct: change,
          timeframe: activeTimeframe,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI 시그널 분석 실패');
      setSignalResult(data);
    } catch {
      const fallbackConfidence = Math.min(88, Math.max(42, Math.round(58 + Math.abs(change) * 6)));
      const isLong = change >= 0;
      setSignalResult({
        signalType: isLong ? 'LONG' : 'SHORT',
        confidence: fallbackConfidence,
        entryPrice: price,
        targetPrice: isLong ? price * 1.008 : price * 0.992,
        stopLoss: isLong ? price * 0.996 : price * 1.004,
        rationale: '실시간 AI 서버 응답이 지연되어 가격 변동률 기반 임시 시그널을 표시했습니다.',
      });
    } finally {
      setSignalLoading(false);
    }
  };

  const signalType = signalResult?.signalType === 'SHORT' ? 'SHORT' : 'LONG';
  const signalColor = signalType === 'LONG' ? '#00FF41' : '#FF3B3B';
  const confidence = signalResult?.confidence ?? 0;

  return (
    <div className="flex h-full">
      <aside className="flex w-[20%] min-w-[220px] shrink-0 flex-col border-r border-[#1A1A1A] bg-[#0A0A0F]">
        <div className="shrink-0 border-b border-[#1A1A1A] px-4 py-3">
          <div className="flex items-center gap-2">
            <Newspaper size={13} className="text-[#00FF41]" />
            <span className="text-[11px] font-bold text-white">실시간 뉴스</span>
            <span className="ml-auto flex items-center gap-1 rounded-full bg-[#00FF41]/10 px-1.5 py-0.5 text-[8px] font-bold text-[#00FF41]">
              <span className="h-1 w-1 rounded-full bg-[#00FF41] pulse-live" />
              LIVE
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {newsLoading && newsItems.length === FALLBACK_NEWS.length && (
            <div className="mx-4 my-3 border border-[#00FF41]/15 bg-[#00FF41]/5 px-3 py-4">
              <div className="mb-2 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[#00FF41]" />
                <span className="text-xs font-black text-[#00FF41]">AI가 뉴스를 번역 중입니다</span>
              </div>
              <p className="text-[11px] leading-5 text-white/45">
                해외 주요 속보를 수집하고 한국어로 정리하고 있습니다. 잠시만 기다려주세요.
              </p>
            </div>
          )}

          {newsItems.map((news, index) => {
            const impact = IMPACT_MAP[(news.impact || 'medium') as keyof typeof IMPACT_MAP] || IMPACT_MAP.medium;
            const url = news.url && news.url !== '#' ? news.url : undefined;
            return (
              <a
                key={news.id || news.title || index}
                href={url}
                target={url ? '_blank' : undefined}
                rel={url ? 'noopener noreferrer' : undefined}
                className="block border-b border-[#1A1A1A]/60 px-4 py-3 transition hover:bg-white/[0.03]"
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="flex items-center gap-1 rounded px-1 py-0.5 text-[8px] font-bold" style={{ background: impact.bg, color: impact.color }}>
                    <Flame size={7} />
                    {impact.label}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[8px] text-white/28">
                    <Clock size={7} />
                    {formatRelativeTime(news.publishedDate || news.time)}
                  </span>
                </div>
                <p className="mb-1.5 line-clamp-2 text-[11px] font-semibold leading-snug text-white">
                  {news.title || '뉴스 제목을 불러오는 중입니다.'}
                </p>
                <div className="flex items-center gap-1.5">
                  {news.symbol && (
                    <span className="rounded border border-[#00FF41]/15 bg-[#0D0D0D] px-1 py-0.5 font-mono text-[8px] font-bold text-[#00FF41]">
                      {news.symbol}
                    </span>
                  )}
                  <span className="ml-auto text-[8px] text-white/28">{news.source || 'Market'}</span>
                </div>
              </a>
            );
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-[#0D0D0D]">
        {/* 채널 탭 */}
        <div className="flex shrink-0 items-center gap-1 border-b border-[#1A1A1A] bg-[#0A0A0F] px-4 py-2">
          <Hash size={13} className="text-[#00FF41]" />
          {CHANNEL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveChannelTab(tab.id)}
              className="flex items-center gap-1 border px-2 py-1 text-[9px] font-bold transition"
              style={{
                borderColor: activeChannelTab === tab.id ? 'rgba(0,255,65,0.35)' : 'transparent',
                background: activeChannelTab === tab.id ? 'rgba(0,255,65,0.1)' : 'transparent',
                color: activeChannelTab === tab.id ? '#00FF41' : '#555',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          <span className="ml-auto rounded-full bg-white/[0.04] px-2 py-1 text-[9px] font-bold text-white/35">
            {connectionText}
          </span>
        </div>

        {/* 채팅 헤더 */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[#1A1A1A]/50 bg-[#0A0A0F] px-4 py-2">
          <MessageCircle size={13} className="text-[#00FF41]" />
          <span className="text-[11px] font-bold text-white">
            {CHANNEL_TABS.find((t) => t.id === activeChannelTab)?.icon}{' '}
            {CHANNEL_TABS.find((t) => t.id === activeChannelTab)?.label} 채팅
          </span>
          <span className="rounded-lg border border-[#00FF41]/20 bg-[#00FF41]/10 px-2 py-1 text-[9px] font-bold text-[#00FF41]">
            실시간
          </span>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.mine ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10px] font-black ${
                    message.system
                      ? 'bg-white/5 text-white/35'
                      : message.isPrivate
                        ? 'bg-blue-500/10 text-blue-400'
                        : message.mine
                          ? 'bg-[#00FF41]/10 text-[#00FF41]'
                          : 'bg-white/10 text-white/70'
                  }`}
                >
                  {message.system ? <Zap size={14} /> : message.isPrivate && !message.mine ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div className={`min-w-0 max-w-[76%] ${message.mine ? 'text-right' : ''}`}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-white">
                      {message.nickname}
                      {message.isPrivate && <span className="ml-1 text-[8px] text-blue-400">(개인)</span>}
                    </span>
                    <span className="text-[9px] text-white/25">{message.time}</span>
                  </div>
                  <div
                    className={`inline-block max-w-full whitespace-pre-wrap break-words border px-3 py-2 text-[12px] leading-6 ${
                      message.system
                        ? 'border-white/[0.06] bg-white/[0.03] text-white/45'
                        : message.isPrivate
                          ? 'border-blue-500/20 bg-blue-500/10 text-white'
                          : message.mine
                            ? 'border-[#00FF41]/20 bg-[#00FF41]/10 text-white'
                            : 'border-[#1A1A1A] bg-[#111118] text-white/80'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* 메시지 입력 */}
        <footer className="shrink-0 border-t border-[#1A1A1A] bg-[#0A0A0F] p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                socketStatus === 'open'
                  ? `메시지를 입력하세요. @ai 질문으로 AI에게 개인 질문 가능`
                  : '연결 후 메시지를 전송할 수 있습니다.'
              }
              className="min-w-0 flex-1 border border-[#1A1A1A] bg-[#111118] px-4 py-2.5 text-[12px] text-white outline-none placeholder:text-white/25 focus:border-[#00FF41]/50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || socketStatus !== 'open'}
              className="flex items-center gap-1.5 bg-[#00FF41] px-4 py-2.5 text-[12px] font-bold text-black transition hover:bg-[#35ff6a] disabled:cursor-not-allowed disabled:bg-[#333] disabled:text-white/30"
            >
              <Send size={12} />
              전송
            </button>
          </div>
        </footer>
      </section>

      <aside className="flex w-[20%] min-w-[270px] shrink-0 flex-col border-l border-[#1A1A1A] bg-[#0A0A0F]">
        <div className="shrink-0 border-b border-[#1A1A1A] px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <Zap size={13} className="text-[#00FF41]" />
            <span className="text-[11px] font-bold text-white">AI 시그널 분석</span>
            <span className="ml-auto text-[8px] font-bold text-white/35">{formatKstDateTime(now)} KST</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl font-black text-white">{price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <span className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color: direction === 'buy' ? '#00FF41' : '#FF3B3B' }}>
              {direction === 'buy' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {change.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="shrink-0 space-y-3 border-b border-[#1A1A1A] px-4 py-3">
          <div>
            <p className="mb-2 text-[9px] font-bold text-white/30">종목 선택</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ASSETS.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    setActiveAsset(asset.id);
                    setSignalResult(null);
                  }}
                  className="border px-2 py-2 text-[10px] font-bold transition"
                  style={{
                    borderColor: activeAsset === asset.id ? 'rgba(0,255,65,0.35)' : '#1A1A1A',
                    background: activeAsset === asset.id ? 'rgba(0,255,65,0.1)' : '#111118',
                    color: activeAsset === asset.id ? '#00FF41' : '#777',
                  }}
                >
                  {asset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[9px] font-bold text-white/30">시간봉 선택</p>
            <div className="grid grid-cols-3 gap-1.5">
              {TIMEFRAMES.map((timeframe) => (
                <button
                  key={timeframe.id}
                  type="button"
                  onClick={() => {
                    setActiveTimeframe(timeframe.id);
                    setSignalResult(null);
                  }}
                  className="border px-1 py-1.5 text-[9px] font-bold transition"
                  style={{
                    borderColor: activeTimeframe === timeframe.id ? 'rgba(0,255,65,0.35)' : '#1A1A1A',
                    background: activeTimeframe === timeframe.id ? 'rgba(0,255,65,0.08)' : 'transparent',
                    color: activeTimeframe === timeframe.id ? '#00FF41' : '#555',
                  }}
                >
                  {timeframe.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-b border-[#1A1A1A] px-4 py-3">
          <div className="flex items-center gap-4">
            <ConfidenceGauge value={confidence || 0} />
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="text-[8px] font-bold text-white/30">진입가</p>
                <p className="font-mono text-sm font-black text-white">{signalResult?.entryPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-white/30">목표가</p>
                <p className="font-mono text-sm font-black text-[#00FF41]">{signalResult?.targetPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-white/30">손절가</p>
                <p className="font-mono text-sm font-black text-[#FF3B3B]">{signalResult?.stopLoss?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '-'}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="rounded px-2 py-1 text-[9px] font-bold" style={{ background: `${signalColor}18`, color: signalColor }}>
              {signalResult ? (signalType === 'LONG' ? '매수 시그널' : '매도 시그널') : '분석 대기'}
            </span>
            <span className="text-[9px] text-white/25">{activeAssetMeta.label} · {TIMEFRAMES.find((item) => item.id === activeTimeframe)?.label}</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold text-white/35">
            <Target size={12} />
            분석 요약
          </div>
          <p className="text-[11px] leading-6 text-white/55">
            {signalResult
              ? signalResult.rationale || `${activeAssetMeta.label} ${TIMEFRAMES.find((item) => item.id === activeTimeframe)?.label} 기준으로 ${confidence}% 확률의 ${signalType === 'LONG' ? '매수' : '매도'} 시나리오를 산출했습니다.`
              : `${activeAssetMeta.label}과 ${TIMEFRAMES.find((item) => item.id === activeTimeframe)?.label}을 기준으로 AI 시그널 분석을 생성하면 확률, 진입가, 목표가, 손절가가 표시됩니다.`}
          </p>
        </div>

        <div className="shrink-0 border-t border-[#1A1A1A] px-4 py-3">
          <button
            type="button"
            onClick={handleGenerateSignal}
            disabled={signalLoading}
            className="flex w-full items-center justify-center gap-1.5 bg-[#00FF41] py-2.5 text-[11px] font-black text-black transition hover:bg-[#35ff6a] disabled:bg-[#333] disabled:text-white/30"
          >
            {signalLoading ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
            {signalLoading ? 'AI 시그널 분석 중...' : 'AI 시그널 분석 생성하기'}
          </button>
          <p className="mt-1.5 text-center text-[8px] text-white/20">KST {formatKstDateTime(now)}</p>
        </div>
      </aside>
    </div>
  );
}
