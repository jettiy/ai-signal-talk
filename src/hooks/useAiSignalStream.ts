'use client';

import { useState, useCallback, useRef } from 'react';
import { AiSignalResult } from '@/lib/types';

interface GenerateSignalStreamParams {
  symbol: string;
  price: number;
  changePct: number;
  news: { title: string; text: string; source: string }[];
  timeframe?: string;
}

interface UseAiSignalStreamReturn {
  /** Thinking Mode 추론 텍스트 (누적) */
  thinkingText: string;
  /** JSON 콘텐츠 텍스트 (누적) */
  contentText: string;
  /** 최종 파싱된 AI 시그널 결과 */
  result: AiSignalResult | null;
  /** Thinking 진행 중 여부 */
  isThinking: boolean;
  /** 전체 스트리밍 완료 여부 */
  isComplete: boolean;
  /** 스트리밍 진행 중 여부 (thinking + content) */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 스트리밍 요청 시작 */
  startStream: (params: GenerateSignalStreamParams) => Promise<void>;
  /** 상태 초기화 */
  reset: () => void;
}

export function useAiSignalStream(): UseAiSignalStreamReturn {
  const [thinkingText, setThinkingText] = useState('');
  const [contentText, setContentText] = useState('');
  const [result, setResult] = useState<AiSignalResult | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 중복 요청 방지
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setThinkingText('');
    setContentText('');
    setResult(null);
    setIsThinking(false);
    setIsComplete(false);
    setIsLoading(false);
    setError(null);
  }, []);

  const startStream = useCallback(async (params: GenerateSignalStreamParams) => {
    // 이전 요청 취소
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    // 상태 초기화
    setThinkingText('');
    setContentText('');
    setResult(null);
    setIsThinking(true);
    setIsComplete(false);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-signal-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: '요청 실패' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('스트림을 읽을 수 없습니다.');

      const decoder = new TextDecoder();
      let buffer = '';
      let localThinking = '';
      let localContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE 이벤트 파싱 (event: xxx\ndata: xxx\n\n)
        const parts = buffer.split('\n\n');
        // 마지막 부분은 불완전할 수 있으므로 버퍼에 유지
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n');
          let eventType = '';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6);
            }
          }

          if (!eventType || !dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            switch (eventType) {
              case 'thinking': {
                localThinking += data.chunk || '';
                setThinkingText(localThinking);
                break;
              }
              case 'content': {
                // content가 들어오면 thinking 단계 종료
                if (localThinking) {
                  setIsThinking(false);
                }
                localContent += data.chunk || '';
                setContentText(localContent);
                break;
              }
              case 'done': {
                setIsThinking(false);
                setIsComplete(true);
                setIsLoading(false);
                if (data.result) {
                  // reasoning에 thinking 텍스트 병합
                  const finalResult: AiSignalResult = {
                    ...data.result,
                    reasoning: localThinking || data.result.reasoning || '',
                  };
                  setResult(finalResult);
                }
                if (data.remaining !== undefined) {
                  // remaining 정보 (필요시 활용)
                }
                break;
              }
              case 'error': {
                throw new Error(data.error || '스트리밍 오류');
              }
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== '스트리밍 오류') {
              // JSON 파싱 실패 — 무시
              console.warn('SSE parse error:', parseErr);
            } else {
              throw parseErr;
            }
          }
        }
      }

      // 스트림이 정상 종료되었지만 done 이벤트를 못 받은 경우
      setIsThinking(false);
      setIsLoading(false);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // 사용자 취소 — 무시
        return;
      }
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(message);
      setIsThinking(false);
      setIsLoading(false);
      setIsComplete(false);
    }
  }, []);

  return {
    thinkingText,
    contentText,
    result,
    isThinking,
    isComplete,
    isLoading,
    error,
    startStream,
    reset,
  };
}
