'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, TrendingUp, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  time: string;
  signal?: {
    symbol: string;
    type: 'LONG' | 'SHORT';
    entry: number;
    target: number;
    confidence: number;
  };
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    const userText = input;
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'ai')
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.text }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history }),
      });

      const data = await res.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: data.content || data.error || '응답을 가져올 수 없습니다.',
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        text: '⚠️ AI 응답 연결 실패. 잠시 후 다시 시도해주세요.',
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1A1A1A]">
        <Bot className="w-5 h-5 text-green-400" />
        <span className="text-white font-bold text-sm">AI 시그널 챗봇</span>
        <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-400' : 'bg-green-400'} animate-pulse`} />
          {loading ? '생각 중...' : 'Online'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 text-sm py-8">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>AI에게 시장 분석이나 트레이딩 질문을 해보세요</p>
          </div>
        )}
        {messages.map(msg => {
          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-gray-600 text-xs">{msg.text}</span>
              </div>
            );
          }
          return (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === 'ai' ? 'bg-green-500/10' : 'bg-blue-500/10'
              }`}>
                {msg.role === 'ai' ? <Bot className="w-4 h-4 text-green-400" /> : <User className="w-4 h-4 text-blue-400" />}
              </div>
              <div className={`max-w-[80%] ${msg.role === 'ai' ? '' : 'items-end'}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === 'ai'
                    ? 'bg-[#111118] border border-[#1A1A1A] text-gray-200'
                    : 'bg-blue-500/10 border border-blue-500/20 text-white'
                }`}>
                  {msg.text}
                </div>
                {/* Signal card in AI message */}
                {msg.signal && (
                  <div className={`mt-2 rounded-xl px-3 py-2.5 border text-xs ${
                    msg.signal.type === 'LONG'
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className={`w-3 h-3 ${msg.signal.type === 'LONG' ? 'text-green-400' : 'text-red-400 rotate-180'}`} />
                      <span className={`font-bold ${msg.signal.type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                        {msg.signal.symbol} {msg.signal.type}
                      </span>
                      <span className="text-gray-500 ml-auto">conf: {msg.signal.confidence}%</span>
                    </div>
                    <div className="text-gray-400">
                      Entry ${msg.signal.entry} → Target ${msg.signal.target}
                    </div>
                  </div>
                )}
                <div className="text-gray-600 text-[10px] mt-1">{msg.time}</div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-green-500/10">
              <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
            </div>
            <div className="rounded-2xl px-4 py-2.5 text-sm bg-[#111118] border border-[#1A1A1A] text-gray-500">
              분석 중...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-[#1A1A1A]">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="메시지를 입력하세요..."
          disabled={loading}
          className="flex-1 bg-[#0A0A0F] border border-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="w-10 h-10 bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors shrink-0"
        >
          <Send className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
}
