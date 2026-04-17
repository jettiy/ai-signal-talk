'use client';
import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
}

interface UseChatOptions {
  onThinking?: (chunk: string) => void;
}

export function useChat(options?: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const mutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-10),
        }),
      });
      if (!res.ok) throw new Error('채팅 요청 실패');
      return res.json();
    },
    onSuccess: (data, userMessage) => {
      // 사용자 메시지 추가
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

      // AI 응답 추가
      if (data.content) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.content,
            reasoning: data.reasoning,
          },
        ]);
      }
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      mutation.mutate(message);
    },
    [mutation]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
