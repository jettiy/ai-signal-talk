'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  id: number;
  user_id: number | null;
  nickname: string;
  content: string;
  is_bot: boolean;
  user_role: string;
  created_at: string;
  /** 클라이언트 전용 */
  isConsecutive?: boolean;
  showDateSep?: boolean;
}

export type ChatStatus = 'connecting' | 'connected' | 'disconnected';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://ai-signal-talk-backend.onrender.com';

const POLL_INTERVAL = 3000; // 3초마다 폴링

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useCommunityChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('disconnected');
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const lastMessageIdRef = useRef<number>(0);

  /* ---------- 메시지 데코레이션 ---------- */
  const decorateMessages = useCallback(
    (msgs: ChatMessage[]): ChatMessage[] => {
      return msgs.map((msg, i) => {
        const prev = msgs[i - 1];
        const isConsecutive =
          prev &&
          prev.user_id != null &&
          msg.user_id != null &&
          prev.user_id === msg.user_id &&
          !prev.is_bot &&
          !msg.is_bot &&
          new Date(msg.created_at).getTime() -
            new Date(prev.created_at).getTime() <
            5 * 60 * 1000;

        const showDateSep =
          !prev ||
          new Date(msg.created_at).toDateString() !==
            new Date(prev.created_at).toDateString();

        return { ...msg, isConsecutive: !!isConsecutive, showDateSep };
      });
    },
    [],
  );

  /* ---------- 메시지 로드 ---------- */
  const loadMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || '';
      const res = await fetch(`${BACKEND_URL}/api/v2/chat/messages?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      if (list.length > 0) {
        lastMessageIdRef.current = list[list.length - 1].id;
      }
      setMessages(decorateMessages(list));
    } catch {
      // 조용히 무시
    }
  }, [decorateMessages]);

  /* ---------- 새 메시지 폴링 ---------- */
  const pollNewMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || '';
      const res = await fetch(`${BACKEND_URL}/api/v2/chat/messages?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      const list: ChatMessage[] = Array.isArray(data) ? data : [];

      // 새 메시지만 필터링
      const newMsgs = list.filter((m) => m.id > lastMessageIdRef.current);
      if (newMsgs.length > 0) {
        lastMessageIdRef.current = newMsgs[newMsgs.length - 1].id;
        setMessages((prev) => {
          // AI 타이핑 표시 중이면 AI 메시지는 타이핑 끄고 추가
          const aiMsg = newMsgs.find((m) => m.is_bot);
          if (aiMsg) {
            setTypingUser(null);
          }
          return decorateMessages([...prev, ...newMsgs]);
        });
      }
    } catch {
      // 무시
    }
  }, [decorateMessages]);

  /* ---------- 메시지 전송 (HTTP POST) ---------- */
  const sendMessage = useCallback(
    async (content: string) => {
      const token = localStorage.getItem('access_token') || '';
      const trimmed = content.trim();
      if (!trimmed) return;

      // 낙관적 업데이트: 내 메시지 바로 추가
      const optimisticMsg: ChatMessage = {
        id: Date.now(),
        user_id: null, // 내 건데 클라이언트에서는 모름
        nickname: '나',
        content: trimmed,
        is_bot: false,
        user_role: 'BASIC',
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => decorateMessages([...prev, optimisticMsg]));

      // @AI 포함 시 타이핑 표시
      const mentionAi = trimmed.toLowerCase().startsWith('@ai');

      try {
        if (mentionAi) {
          // AI 호출 — /api/v2/conversations/{id}/messages 또는 전용 엔드포인트 사용
          const query = trimmed.replace(/^@ai\s*/i, '').trim();
          if (!query) return;

          setSending(true);
          setTypingUser('AI 어시스턴트');

          // 백엔드에 @AI 메시지 전송 엔드포인트 호출
          const res = await fetch(`${BACKEND_URL}/api/v2/chat/ai`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content: trimmed }),
            cache: 'no-store',
          });

          setTypingUser(null);

          if (res.ok) {
            // 폴링으로 AI 응답을 가져올 것
            // 낙관적 메시지 제거 후 전체 리로드
            setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
            await loadMessages();
          }
        } else {
          // 일반 메시지 — POST로 전송
          const res = await fetch(`${BACKEND_URL}/api/v2/chat/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content: trimmed }),
            cache: 'no-store',
          });

          if (res.ok) {
            // 낙관적 메시지 제거 후 전체 리로드
            setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
            await loadMessages();
          }
        }
      } catch {
        // 전송 실패 시에도 낙관적 메시지 유지
      } finally {
        setSending(false);
      }
    },
    [loadMessages, decorateMessages],
  );

  /* ---------- 라이프사이클 ---------- */
  useEffect(() => {
    isMounted.current = true;
    setStatus('connecting');
    loadMessages().then(() => {
      if (isMounted.current) {
        setStatus('connected');
      }
    });

    // 폴링 시작
    pollTimerRef.current = setInterval(() => {
      if (isMounted.current) {
        pollNewMessages();
      }
    }, POLL_INTERVAL);

    return () => {
      isMounted.current = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [loadMessages, pollNewMessages]);

  return {
    messages,
    status,
    onlineCount,
    typingUser,
    sendMessage,
    sending,
  };
}
