'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AtSign, Bot, LockKeyhole, MessageCircle, Send, ShieldCheck, User, Wifi, WifiOff } from 'lucide-react';

type SocketStatus = 'connecting' | 'open' | 'closed';

interface PublicMessage {
  id: string;
  userId?: number;
  nickname: string;
  content: string;
  timestamp: string;
  mine?: boolean;
  system?: boolean;
}

interface PrivateMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
}

interface IncomingChatEvent {
  type: 'presence' | 'public_message' | 'private_user' | 'private_ai' | 'private_system' | 'error';
  user_id?: number;
  nickname?: string;
  content?: string;
  message?: string;
  online_count?: number;
  timestamp?: string;
}

const BACKEND_HTTP_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ai-signal-talk-backend.onrender.com';

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(value?: string) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function getChatWebSocketUrl(token: string) {
  const url = new URL(BACKEND_HTTP_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `/ws/chat/${encodeURIComponent(token)}`;
  url.search = '';
  return url.toString();
}

function isAiMention(text: string) {
  return /(^|\s)@ai(\s|$)/i.test(text);
}

function stripAiMention(text: string) {
  return text.replace(/(^|\s)@ai(\s|$)/i, ' ').trim();
}

export default function CommunityPanel({ userName = '트레이더' }: { userName?: string }) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const [onlineCount, setOnlineCount] = useState(0);
  const [showMention, setShowMention] = useState(false);
  const [privateLoading, setPrivateLoading] = useState(false);
  const [publicMessages, setPublicMessages] = useState<PublicMessage[]>([
    {
      id: 'system-welcome',
      nickname: 'SYSTEM',
      content: '공개 채팅은 접속한 유저들에게 공유됩니다. @AI 호출 내용은 본인에게만 표시됩니다.',
      timestamp: new Date().toISOString(),
      system: true,
    },
  ]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([
    {
      id: 'private-guide',
      role: 'system',
      content: '@AI를 입력한 질문과 답변은 이 개인 영역에만 남습니다.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const publicBottomRef = useRef<HTMLDivElement>(null);
  const privateBottomRef = useRef<HTMLDivElement>(null);

  const connectionLabel = useMemo(() => {
    if (status === 'open') return '실시간 연결됨';
    if (status === 'connecting') return '연결 중';
    return '오프라인 모드';
  }, [status]);

  useEffect(() => {
    publicBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [publicMessages]);

  useEffect(() => {
    privateBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [privateMessages, privateLoading]);

  useEffect(() => {
    let disposed = false;

    const connect = () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setStatus('closed');
        return;
      }

      setStatus('connecting');
      const socket = new WebSocket(getChatWebSocketUrl(token));
      socketRef.current = socket;

      socket.onopen = () => {
        if (disposed) return;
        setStatus('open');
      };

      socket.onmessage = (event) => {
        if (disposed) return;
        const payload = JSON.parse(event.data) as IncomingChatEvent;
        const timestamp = payload.timestamp || new Date().toISOString();

        if (payload.type === 'presence') {
          setOnlineCount(payload.online_count || 0);
          return;
        }

        if (payload.type === 'public_message') {
          setPublicMessages((prev) => [
            ...prev,
            {
              id: makeId('public'),
              userId: payload.user_id,
              nickname: payload.nickname || '트레이더',
              content: payload.content || '',
              timestamp,
              mine: payload.nickname === userName,
            },
          ]);
          return;
        }

        if (payload.type === 'private_user') {
          setPrivateMessages((prev) => [
            ...prev,
            { id: makeId('private-user'), role: 'user', content: payload.content || '', timestamp },
          ]);
          setPrivateLoading(true);
          return;
        }

        if (payload.type === 'private_ai') {
          setPrivateMessages((prev) => [
            ...prev,
            { id: makeId('private-ai'), role: 'ai', content: payload.content || '응답을 생성하지 못했습니다.', timestamp },
          ]);
          setPrivateLoading(false);
          return;
        }

        setPrivateMessages((prev) => [
          ...prev,
          { id: makeId('private-system'), role: 'system', content: payload.message || payload.content || '처리 중 오류가 발생했습니다.', timestamp },
        ]);
        setPrivateLoading(false);
      };

      socket.onclose = () => {
        if (disposed) return;
        setStatus('closed');
        reconnectTimerRef.current = setTimeout(connect, 3500);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [userName]);

  const sendPrivateAiFallback = async (query: string) => {
    const timestamp = new Date().toISOString();
    setPrivateMessages((prev) => [
      ...prev,
      { id: makeId('private-user'), role: 'user', content: query, timestamp },
    ]);
    setPrivateLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      const data = await response.json();
      setPrivateMessages((prev) => [
        ...prev,
        {
          id: makeId('private-ai'),
          role: 'ai',
          content: data.content || data.error || 'AI 응답을 생성하지 못했습니다.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setPrivateMessages((prev) => [
        ...prev,
        {
          id: makeId('private-system'),
          role: 'system',
          content: 'AI 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setPrivateLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || privateLoading) return;

    setInput('');
    setShowMention(false);

    if (isAiMention(text)) {
      const query = stripAiMention(text);
      if (!query) {
        setPrivateMessages((prev) => [
          ...prev,
          {
            id: makeId('private-system'),
            role: 'system',
            content: '@AI 뒤에 질문을 입력해주세요.',
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ai_private', content: query }));
        return;
      }

      await sendPrivateAiFallback(query);
      return;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'public_message', content: text }));
      return;
    }

    setPublicMessages((prev) => [
      ...prev,
      {
        id: makeId('local-system'),
        nickname: 'SYSTEM',
        content: '실시간 서버와 연결되지 않아 메시지를 전송하지 못했습니다.',
        timestamp: new Date().toISOString(),
        system: true,
      },
    ]);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setShowMention(/@[^ ]*$/i.test(value));
  };

  const selectAiMention = () => {
    const next = input.replace(/@[^ ]*$/i, '@AI ');
    setInput(next.includes('@AI') ? next : `${input}@AI `);
    setShowMention(false);
  };

  return (
    <div className="grid h-full grid-cols-[260px_minmax(0,1fr)_330px] overflow-hidden bg-[#0D0D0D] text-white">
      <aside className="flex min-w-0 flex-col border-r border-[#1A1A1A] bg-[#0A0A0F]">
        <div className="border-b border-[#1A1A1A] px-4 py-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={15} className="text-[#00FF41]" />
            <h2 className="text-sm font-black">커뮤니티 채팅</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-white/40">
            모든 일반 메시지는 공개 채팅에 표시됩니다.
          </p>
        </div>
        <div className="space-y-3 p-4">
          <div className="border border-[#1A1A1A] bg-black/25 p-3">
            <p className="text-[10px] font-black uppercase text-white/35">Public Room</p>
            <p className="mt-1 text-sm font-bold text-white">전체 채팅</p>
            <p className="mt-2 text-xs text-white/42">트레이더들이 실시간으로 대화하는 공용 공간입니다.</p>
          </div>
          <div className="border border-[#00FF41]/15 bg-[#00FF41]/5 p-3">
            <div className="flex items-center gap-2 text-[#00FF41]">
              <LockKeyhole size={14} />
              <p className="text-xs font-black">개인 AI 호출</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/45">
              입력창에서 <span className="font-bold text-[#00FF41]">@AI</span>를 선택하면 질문과 답변은 오른쪽 개인 영역에만 표시됩니다.
            </p>
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[#1A1A1A] bg-[#0A0A0F] px-4">
          <MessageCircle size={14} className="text-[#00FF41]" />
          <span className="text-sm font-black">실시간 유저 채팅</span>
          <span className="ml-auto flex items-center gap-1.5 rounded-full border border-[#1A1A1A] px-2 py-1 text-[10px] font-bold text-white/45">
            {status === 'open' ? <Wifi size={12} className="text-[#00FF41]" /> : <WifiOff size={12} className="text-[#FF3B3B]" />}
            {connectionLabel}
          </span>
          <span className="rounded-full bg-[#00FF41]/10 px-2 py-1 text-[10px] font-bold text-[#00FF41]">
            {onlineCount || '-'} online
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-3">
            {publicMessages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.mine ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10px] font-black ${
                    message.system ? 'bg-white/5 text-white/35' : message.mine ? 'bg-[#00FF41]/10 text-[#00FF41]' : 'bg-[#222831] text-white/75'
                  }`}
                >
                  {message.system ? <ShieldCheck size={14} /> : <User size={14} />}
                </div>
                <div className={`min-w-0 max-w-[78%] ${message.mine ? 'text-right' : ''}`}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-white/75">{message.nickname}</span>
                    <span className="text-[10px] text-white/25">{formatTime(message.timestamp)}</span>
                  </div>
                  <div
                    className={`inline-block max-w-full whitespace-pre-wrap break-words border px-3 py-2 text-sm leading-6 ${
                      message.system
                        ? 'border-white/[0.06] bg-white/[0.03] text-white/45'
                        : message.mine
                          ? 'border-[#00FF41]/20 bg-[#00FF41]/10 text-white'
                          : 'border-[#1A1A1A] bg-[#111118] text-white/80'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={publicBottomRef} />
          </div>
        </div>

        <footer className="relative shrink-0 border-t border-[#1A1A1A] bg-[#0A0A0F] p-3">
          {showMention && (
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                selectAiMention();
              }}
              className="absolute bottom-[64px] left-3 flex w-[260px] items-center gap-3 border border-[#00FF41]/20 bg-[#111118] px-3 py-2 text-left hover:bg-[#00FF41]/5"
            >
              <Bot size={16} className="text-[#00FF41]" />
              <span>
                <span className="block text-xs font-black text-[#00FF41]">@AI</span>
                <span className="block text-[11px] text-white/42">개인 AI 대화로 보내기</span>
              </span>
            </button>
          )}

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(event) => handleInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="메시지를 입력하세요. @AI 질문은 본인에게만 보입니다."
              className="min-w-0 flex-1 border border-[#1A1A1A] bg-[#111118] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#00FF41]/55"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim() || privateLoading}
              className="grid h-12 w-12 place-items-center bg-[#00FF41] text-black transition hover:bg-[#35ff6a] disabled:cursor-not-allowed disabled:bg-[#273027] disabled:text-white/20"
              aria-label="메시지 전송"
            >
              <Send size={17} />
            </button>
          </div>
        </footer>
      </section>

      <aside className="flex min-w-0 flex-col border-l border-[#1A1A1A] bg-[#0A0A0F]">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[#1A1A1A] px-4">
          <LockKeyhole size={14} className="text-[#00FF41]" />
          <span className="text-sm font-black">개인 AI 대화</span>
          <span className="ml-auto rounded-full bg-[#00FF41]/10 px-2 py-1 text-[10px] font-bold text-[#00FF41]">Private</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {privateMessages.map((message) => (
              <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    message.role === 'ai' ? 'bg-[#00FF41]/10 text-[#00FF41]' : message.role === 'user' ? 'bg-white/10 text-white/65' : 'bg-white/5 text-white/35'
                  }`}
                >
                  {message.role === 'ai' ? <Bot size={14} /> : message.role === 'user' ? <User size={14} /> : <AtSign size={14} />}
                </div>
                <div className={`min-w-0 max-w-[82%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block max-w-full whitespace-pre-wrap break-words border px-3 py-2 text-xs leading-5 ${
                      message.role === 'ai'
                        ? 'border-[#00FF41]/15 bg-[#00FF41]/5 text-white/82'
                        : message.role === 'user'
                          ? 'border-white/10 bg-white/[0.06] text-white/75'
                          : 'border-white/[0.06] bg-white/[0.03] text-white/42'
                    }`}
                  >
                    {message.content}
                  </div>
                  <p className="mt-1 text-[10px] text-white/22">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            ))}

            {privateLoading && (
              <div className="flex gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#00FF41]/10 text-[#00FF41]">
                  <Bot size={14} />
                </div>
                <div className="border border-[#00FF41]/15 bg-[#00FF41]/5 px-3 py-2 text-xs text-white/45">
                  AI가 개인 응답을 생성하고 있습니다...
                </div>
              </div>
            )}
            <div ref={privateBottomRef} />
          </div>
        </div>
      </aside>
    </div>
  );
}
