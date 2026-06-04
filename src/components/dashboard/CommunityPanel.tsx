'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useCommunityChat, type ChatMessage } from '@/hooks/useCommunityChat';

/* ------------------------------------------------------------------ */
/*  Constants — Discord 느낌 색상 팔레트                              */
/* ------------------------------------------------------------------ */

/** 유저별 닉네임 컬러 (Discord 느낌) */
const NAME_COLORS = [
  '#FF6B6B', // 빨강
  '#51CF66', // 초록
  '#5C7CFA', // 파랑
  '#FF922B', // 주황
  '#CC5DE8', // 보라
  '#FFD43B', // 노랑
  '#22B8CF', // 청록
  '#F06595', // 분홍
  '#94D82D', // 연두
  '#FF8787', // 연빨
  '#748FFC', // 연파
  '#69DB7C', // 연초
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getUserIdColor(userId: number | null): string {
  if (userId == null) return '#57F287';
  return NAME_COLORS[userId % NAME_COLORS.length];
}

/** 날짜 포맷 "2026년 6월 5일" */
function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const wd = weekdays[d.getDay()];
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  if (isToday) return '오늘';
  if (isYesterday) return '어제';
  return `${y}년 ${m}월 ${day}일 (${wd}요일)`;
}

/** 시간 포맷 "오전 1:23" */
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** ISO 문자열 → 오늘/어제면 시간만, 아니면 날짜+시간 */
function formatMessageTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  const time = d.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return time;
  if (isYesterday) return `어제 ${time}`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${time}`;
}

/** 아바타 초성 (첫 글자) */
function getAvatarLetter(nickname: string): string {
  return nickname.trim().charAt(0).toUpperCase() || '?';
}

/** 아바타 배경색 (유저 ID 기반) */
function getAvatarBg(userId: number | null): string {
  if (userId == null) return '#248046'; // AI/System
  const colors = [
    '#5865F2', '#ED4245', '#57F287', '#FEE75C', '#EB459E',
    '#00AFF4', '#FF73FA', '#FFA657', '#80848E', '#4E5058',
    '#949BA4', '#92A1B8',
  ];
  return colors[userId % colors.length];
}

/* ------------------------------------------------------------------ */
/*  컴포넌트                                                           */
/* ------------------------------------------------------------------ */

interface CommunityPanelProps {
  userName?: string;
}

export default function CommunityPanel({ userName: _userName }: CommunityPanelProps) {
  const { messages, status, onlineCount, typingUser, sendMessage } =
    useCommunityChat();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---------- 자동 스크롤 ---------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  /* ---------- 전송 ---------- */
  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const mentionAi = text.startsWith('@AI');
    sendMessage(text, mentionAi);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── 헤더 ── */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-[#1A1A1A] shrink-0">
        <span className="text-[#DBDEE1] font-bold text-base">💬 시그널톡</span>
        <span className="text-[#6D6F78] text-sm ml-auto">
          {onlineCount > 0 ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-[#57F287] mr-1" />
              {onlineCount}명 온라인
            </>
          ) : (
            <span className="text-[#6D6F78]">연결 중...</span>
          )}
        </span>
      </div>

      {/* ── 메시지 영역 ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1E1F22] bg-[#1A1A1E]"
      >
        {/* 로딩 상태 */}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#248046] flex items-center justify-center text-white text-lg">
                💬
              </div>
              <p className="text-[#6D6F78] text-sm">
                {status === 'connecting'
                  ? '채팅방에 연결 중...'
                  : '첫 메시지를 보내보세요!'}
              </p>
            </div>
          </div>
        )}

        {/* 메시지 목록 */}
        {messages.map((msg, idx) => (
          <MessageItem
            key={`${msg.id}-${idx}`}
            message={msg}
            prevMessage={messages[idx - 1] ?? null}
          />
        ))}

        {/* 타이핑 인디케이터 */}
        {typingUser && (
          <div className="px-4 py-1 flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: '#248046' }}
            >
              <span className="text-xs">🤖</span>
            </div>
            <div className="flex items-center gap-1 text-[#949BA4] text-sm">
              <span className="font-medium text-[#57F287]">{typingUser}</span>
              <span className="typing-dots">
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </span>
            </div>
          </div>
        )}

        {/* 보이스카롤 앵커 */}
        <div ref={messagesEndRef} className="h-2" />

        {/* 타이핑 애니메이션 스타일 */}
        <style jsx>{`
          .typing-dots .dot {
            animation: typingBlink 1.4s infinite both;
            font-size: 1.2rem;
            line-height: 1;
          }
          .typing-dots .dot:nth-child(2) {
            animation-delay: 0.2s;
          }
          .typing-dots .dot:nth-child(3) {
            animation-delay: 0.4s;
          }
          @keyframes typingBlink {
            0%,
            80%,
            100% {
              opacity: 0;
            }
            40% {
              opacity: 1;
            }
          }
        `}</style>
      </div>

      {/* ── 입력바 ── */}
      <div className="px-4 py-3 shrink-0 border-t border-[#1A1A1A]">
        <div className="flex items-center gap-2 bg-[#383A40] rounded-lg px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지 보내기..."
            className="flex-1 bg-transparent text-[#DBDEE1] text-sm placeholder-[#6D6F78] outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-8 h-8 flex items-center justify-center rounded-md text-[#6D6F78] hover:text-[#DBDEE1] hover:bg-[#4E5058] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[10px] text-[#6D6F78] mt-1 px-1">
          @AI를 입력하면 AI가 모든 사용자에게 답변합니다
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MessageItem                                                        */
/* ------------------------------------------------------------------ */

function MessageItem({
  message,
  prevMessage,
}: {
  message: ChatMessage;
  prevMessage: ChatMessage | null;
}) {
  const isSystem = message.user_role === 'SYSTEM';
  const isBot = message.is_bot;
  const isConsecutive = message.isConsecutive && !isSystem && !isBot;

  return (
    <>
      {/* 날짜 구분선 */}
      {message.showDateSep && (
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex-1 h-px bg-[#1E1F22]" />
          <span className="text-[#6D6F78] text-xs font-medium whitespace-nowrap">
            {formatDateSeparator(message.created_at)}
          </span>
          <div className="flex-1 h-px bg-[#1E1F22]" />
        </div>
      )}

      {/* 시스템 메시지 */}
      {isSystem ? (
        <div className="px-4 py-1 text-center">
          <span className="text-[#6D6F78] text-xs">{message.content}</span>
        </div>
      ) : isConsecutive ? (
        /* 연속 메시지 — 내용만 */
        <div className="px-4 pl-[72px] py-[1px] group hover:bg-[#1A1A1E]">
          <MessageContent message={message} />
        </div>
      ) : (
        /* 첫 메시지 — 아바타 + 닉네임 + 내용 */
        <div className="px-4 pt-[17px] pb-[1px] group hover:bg-[#1A1A1E]">
          <div className="flex gap-4">
            {/* 아바타 */}
            <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold relative"
              style={{ backgroundColor: getAvatarBg(message.user_id) }}>
              {isBot ? '🤖' : getAvatarLetter(message.nickname)}
            </div>
            <div className="flex-1 min-w-0">
              {/* 닉네임 + 타임스탬프 */}
              <div className="flex items-baseline gap-2 mb-0.5">
                <span
                  className="text-base font-semibold hover:underline cursor-pointer"
                  style={{
                    color: isBot ? '#57F287' : getUserIdColor(message.user_id),
                  }}
                >
                  {message.nickname}
                  {isBot && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor: 'rgba(87,242,135,0.15)',
                        color: '#57F287',
                      }}>
                      Bot
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-[#6D6F78]">
                  {formatMessageTimestamp(message.created_at)}
                </span>
              </div>
              {/* 메시지 내용 */}
              <MessageContent message={message} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  MessageContent                                                     */
/* ------------------------------------------------------------------ */

function MessageContent({ message }: { message: ChatMessage }) {
  return (
    <div className="text-[#DBDEE1] text-sm leading-[1.4] whitespace-pre-wrap break-words">
      {renderContent(message.content)}
    </div>
  );
}

/** @AI 하이라이트 포함 렌더링 */
function renderContent(content: string) {
  const parts = content.split(/(@AI)/g);
  return parts.map((part, i) => {
    if (part === '@AI') {
      return (
        <span
          key={i}
          className="inline-flex items-center gap-0.5 px-1 rounded text-[11px] font-bold"
          style={{
            backgroundColor: 'rgba(87,242,135,0.15)',
            color: '#57F287',
          }}
        >
          🤖 @AI
        </span>
      );
    }
    // URL 자동 링크
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const segments = part.split(urlRegex);
    if (segments.length === 1) return <span key={i}>{segments[0]}</span>;
    return segments.map((seg, j) =>
      urlRegex.test(seg) ? (
        <a
          key={`${i}-${j}`}
          href={seg}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00A8FC] hover:underline"
        >
          {seg}
        </a>
      ) : (
        <span key={`${i}-${j}`}>{seg}</span>
      ),
    );
  });
}
