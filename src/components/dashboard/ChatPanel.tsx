'use client';
import { useState } from 'react';
import { Send, Bot, User, TrendingUp } from 'lucide-react';

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

const dummyMessages: Message[] = [
  {
    id: '1',
    role: 'ai',
    text: 'NVDA 강세 신호 확인됨. 단기 진입 고려 가능.',
    time: '21:10',
    signal: { symbol: 'NVDA', type: 'LONG', entry: 875.32, target: 901.00, confidence: 78 },
  },
  {
    id: '2',
    role: 'user',
    text: 'SPY 当前趋势怎么样?',
    time: '21:12',
  },
  {
    id: '3',
    role: 'ai',
    text: 'SPY 상승 추세 유지 중. 523.50 지지선 확인되면 추가 매수 신호.',
    time: '21:12',
    signal: { symbol: 'SPY', type: 'LONG', entry: 522.18, target: 528.00, confidence: 72 },
  },
  {
    id: '4',
    role: 'system',
    text: '📊 시장 업데이트: WTI 원유 93.12$ (-1.23%) — 호르만자 해협 긴장 지속',
    time: '21:15',
  },
];

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(dummyMessages);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1A1A1A]">
        <Bot className="w-5 h-5 text-green-400" />
        <span className="text-white font-bold text-sm">AI 시그널 챗봇</span>
        <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Online
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin">
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
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${
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
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-[#1A1A1A]">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="메시지를 입력하세요..."
          className="flex-1 bg-[#0A0A0F] border border-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50"
        />
        <button
          onClick={handleSend}
          className="w-10 h-10 bg-green-500 hover:bg-green-400 rounded-xl flex items-center justify-center transition-colors shrink-0"
        >
          <Send className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
}