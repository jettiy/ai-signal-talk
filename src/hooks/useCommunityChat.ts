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
  /** 클라이언트 전용: 이전 메시지와 같은 작성자인지 플래그 */
  isConsecutive?: boolean;
  /** 클라이언트 전용: 새 날짜 구분선이 필요한지 */
  showDateSep?: boolean;
}

export interface PresenceEvent {
  event: 'join' | 'leave';
  nickname: string;
  online_count: number;
}

export type SocketStatus = 'connecting' | 'open' | 'closed';

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  'wss://ai-signal-talk-backend.onrender.com/ws/chat';

const HTTP_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://ai-signal-talk-backend.onrender.com';

/** 재연결 지연 (ms) */
const RECONNECT_DELAY = 3000;

export function useCommunityChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<SocketStatus>('closed');
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  /* ---------- 메시지 날짜 구분선 / 연속 여부 계산 ---------- */
  const decorateMessages = useCallback(
    (msgs: ChatMessage[]): ChatMessage[] => {
      return msgs.map((msg, i) => {
        const prev = msgs[i - 1];
        const isConsecutive =
          prev &&
          prev.user_id != null &&
          msg.user_id != null &&
          prev.user_id === msg.user_id &&
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

  /* ---------- 이전 메시지 불러오기 ---------- */
  const loadHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token') || '';
      const res = await fetch(`${HTTP_URL}/api/v2/chat/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: ChatMessage[] | { messages: ChatMessage[] } =
        await res.json();
      const list = Array.isArray(data) ? data : data.messages ?? [];
      setMessages(decorateMessages(list));
    } catch {
      // 네트워크 오류 — 조용히 무시
    }
  }, [decorateMessages]);

  /* ---------- WebSocket 연결 ---------- */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem('access_token') || '';
    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;

    setStatus('connecting');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted.current) return;
      setStatus('open');
      // 연결 후 히스토리 로드
      loadHistory();
    };

    ws.onmessage = (event) => {
      if (!isMounted.current) return;

      let data: Record<string, unknown>;
      try {
        data = JSON.parse(event.data as string);
      } catch {
        return;
      }

      const type = data.type as string;

      switch (type) {
        case 'message': {
          const msg: ChatMessage = {
            id: (data.id as number) ?? Date.now(),
            user_id: (data.user_id as number | null) ?? null,
            nickname: (data.nickname as string) ?? '알 수 없음',
            content: (data.content as string) ?? '',
            is_bot: !!(data.is_bot as boolean),
            user_role: (data.user_role as string) ?? 'USER',
            created_at: (data.created_at as string) ?? new Date().toISOString(),
          };
          setMessages((prev) => {
            const next = [...prev, msg];
            return decorateMessages(next);
          });
          break;
        }
        case 'presence': {
          const ev = data.event as string;
          const name = (data.nickname as string) ?? '';
          const count = (data.online_count as number) ?? 0;
          setOnlineCount(count);

          // 시스템 메시지 형태로 표시
          if (ev === 'join' || ev === 'leave') {
            const emoji = ev === 'join' ? '🟢' : '🔴';
            const sysMsg: ChatMessage = {
              id: Date.now(),
              user_id: null,
              nickname: 'System',
              content: `${emoji} ${name}님이 ${ev === 'join' ? '입장' : '퇴장'}하셨습니다.`,
              is_bot: false,
              user_role: 'SYSTEM',
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => {
              const next = [...prev, sysMsg];
              return decorateMessages(next);
            });
          }
          break;
        }
        case 'typing': {
          const nick = (data.nickname as string) ?? '';
          setTypingUser(nick);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 4000);
          break;
        }
        case 'system': {
          const sysMsg: ChatMessage = {
            id: Date.now(),
            user_id: null,
            nickname: 'System',
            content: (data.content as string) ?? '',
            is_bot: false,
            user_role: 'SYSTEM',
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => {
            const next = [...prev, sysMsg];
            return decorateMessages(next);
          });
          break;
        }
      }
    };

    ws.onclose = () => {
      if (!isMounted.current) return;
      setStatus('closed');
      wsRef.current = null;
      // 재연결
      reconnectTimerRef.current = setTimeout(() => {
        if (isMounted.current) connect();
      }, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      ws?.close();
    };
  }, [loadHistory, decorateMessages]);

  /* ---------- 메시지 전송 ---------- */
  const sendMessage = useCallback(
    (content: string, mentionAi = false) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const payload = {
        type: 'message',
        content: mentionAi ? `@AI ${content}` : content,
      };
      ws.send(JSON.stringify(payload));
    },
    [],
  );

  /* ---------- 라이프사이클 ---------- */
  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      wsRef.current?.close();
      wsRef.current = null;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [connect]);

  return {
    messages,
    status,
    onlineCount,
    typingUser,
    sendMessage,
    loadHistory,
  };
}
