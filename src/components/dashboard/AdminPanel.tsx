'use client';

import { useState } from 'react';
import {
  Shield,
  Users,
  Clock,
  MessageSquare,
  CheckCircle,
  ArrowLeft,
  Send,
  X,
  Crown,
  AlertCircle,
} from 'lucide-react';
import type { ConsultQueueItem, ConsultMessage } from '@/lib/types';

/* ── Mock 상담 대기열 데이터 ───────────────────────────── */
const MOCK_QUEUE: ConsultQueueItem[] = [
  {
    id: 'u1',
    name: '김준석',
    email: 'junseok@example.com',
    phone: '010-1234-5678',
    appliedAt: '2026-04-17 23:45',
    status: 'waiting',
    messages: [
      { role: 'user', text: 'PRO 전환 문의드립니다.', time: '23:45' },
    ],
  },
  {
    id: 'u2',
    name: '이하늘',
    email: 'haneul@example.com',
    phone: '010-9876-5432',
    appliedAt: '2026-04-18 00:12',
    status: 'in_progress',
    messages: [
      { role: 'admin', text: '안녕하세요! PRO 전환 상담입니다.', time: '00:12' },
      { role: 'user', text: 'PRO 혜택이 어떻게 되나요?', time: '00:13' },
    ],
  },
  {
    id: 'u3',
    name: '박미래',
    email: 'mirae@example.com',
    phone: '010-5555-1234',
    appliedAt: '2026-04-18 00:30',
    status: 'waiting',
    messages: [
      { role: 'user', text: '1:1 트레이더 배정은 언제 되나요?', time: '00:30' },
    ],
  },
];

const now = () =>
  new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

/* ── 상담 채팅 (관리자 시점) ──────────────────────────── */
function AdminConsultChat({
  item,
  onBack,
  onStatusChange,
}: {
  item: ConsultQueueItem;
  onBack: () => void;
  onStatusChange: (id: string, status: ConsultQueueItem['status']) => void;
}) {
  const [messages, setMessages] = useState<ConsultMessage[]>(item.messages);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { role: 'admin', text, time: now() }]);
    setInput('');
    // 상담 시작으로 상태 변경
    if (item.status === 'waiting') {
      onStatusChange(item.id, 'in_progress');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 헤더 */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ background: '#1A1A1A', borderBottom: '1px solid #2D2D2D' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="transition-colors hover:opacity-80" style={{ color: '#888' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: '#242424', color: '#FFF', border: '1px solid #2D2D2D' }}
          >
            {item.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#FFF' }}>{item.name}</p>
            <p className="text-[10px]" style={{ color: '#888' }}>{item.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStatusChange(item.id, 'done')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: 'rgba(0,255,65,0.1)',
              color: '#00FF41',
              border: '1px solid rgba(0,255,65,0.2)',
            }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            승인 완료
          </button>
          <button onClick={onBack} style={{ color: '#555' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 신청자 정보 스트립 */}
      <div
        className="flex items-center gap-4 px-5 py-2 shrink-0"
        style={{ background: '#0F0F0F', borderBottom: '1px solid #1A1A1A' }}
      >
        <span className="text-[10px]" style={{ color: '#666' }}>
          <span style={{ color: '#888' }}>전화:</span> {item.phone}
        </span>
        <span className="text-[10px]" style={{ color: '#666' }}>
          <span style={{ color: '#888' }}>신청:</span> {item.appliedAt}
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded font-bold"
          style={{
            background: item.status === 'waiting' ? 'rgba(255,215,0,0.1)' : item.status === 'in_progress' ? 'rgba(0,255,65,0.1)' : 'rgba(100,100,100,0.1)',
            color: item.status === 'waiting' ? '#FFD700' : item.status === 'in_progress' ? '#00FF41' : '#666',
          }}
        >
          {item.status === 'waiting' ? '대기중' : item.status === 'in_progress' ? '상담중' : '완료'}
        </span>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className="max-w-[75%] rounded-xl px-4 py-2.5"
              style={{
                background: msg.role === 'admin' ? 'rgba(0,255,65,0.1)' : '#242424',
                border: `1px solid ${msg.role === 'admin' ? 'rgba(0,255,65,0.2)' : '#2D2D2D'}`,
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: '#FFF' }}>{msg.text}</p>
              <p className="text-[10px] mt-1 text-right" style={{ color: '#555' }}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 입력 */}
      <div className="px-4 py-3 shrink-0" style={{ background: '#0A0A0F', borderTop: '1px solid #1A1A1A' }}>
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2.5"
          style={{ background: '#1A1A1A', border: '1px solid #2D2D2D' }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지를 입력하세요..."
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-[#444]"
            style={{ color: '#FFF' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: input.trim() ? '#00FF41' : '#242424',
              color: input.trim() ? '#000' : '#555',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 관리자 대시보드 메인 ─────────────────────────────── */
export default function AdminPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queue, setQueue] = useState<ConsultQueueItem[]>(MOCK_QUEUE);

  const selectedItem = queue.find((q) => q.id === selectedId);

  const handleStatusChange = (id: string, status: ConsultQueueItem['status']) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
  };

  const waitingCount = queue.filter((q) => q.status === 'waiting').length;
  const inProgressCount = queue.filter((q) => q.status === 'in_progress').length;

  // 상담방 열려있으면 채팅 UI
  if (selectedItem) {
    return (
      <AdminConsultChat
        item={selectedItem}
        onBack={() => setSelectedId(null)}
        onStatusChange={handleStatusChange}
      />
    );
  }

  // 대시보드 메인
  return (
    <div className="h-full overflow-auto" style={{ background: '#0D0D0D' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.3)' }}
          >
            <Shield className="w-5 h-5" style={{ color: '#00FF41' }} />
          </div>
          <div>
            <h1 className="text-lg font-black" style={{ color: '#FFF' }}>관리자 대시보드</h1>
            <p className="text-[11px]" style={{ color: '#666' }}>PRO 전환 상담 관리</p>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div
            className="rounded-xl p-4"
            style={{ background: '#1A1A1A', border: '1px solid #2D2D2D' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" style={{ color: '#FFD700' }} />
              <span className="text-[10px] font-bold" style={{ color: '#888' }}>대기중</span>
            </div>
            <p className="text-2xl font-black" style={{ color: '#FFD700' }}>{waitingCount}</p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: '#1A1A1A', border: '1px solid #2D2D2D' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4" style={{ color: '#00FF41' }} />
              <span className="text-[10px] font-bold" style={{ color: '#888' }}>상담중</span>
            </div>
            <p className="text-2xl font-black" style={{ color: '#00FF41' }}>{inProgressCount}</p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: '#1A1A1A', border: '1px solid #2D2D2D' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" style={{ color: '#888' }} />
              <span className="text-[10px] font-bold" style={{ color: '#888' }}>전체 신청</span>
            </div>
            <p className="text-2xl font-black" style={{ color: '#FFF' }}>{queue.length}</p>
          </div>
        </div>

        {/* 상담 대기열 */}
        <div className="mb-4">
          <h2 className="text-sm font-bold mb-4" style={{ color: '#FFF' }}>상담 대기열</h2>
          <div className="space-y-3">
            {queue.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className="w-full rounded-xl p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.01]"
                style={{
                  background: '#1A1A1A',
                  border: `1px solid ${
                    item.status === 'waiting'
                      ? 'rgba(255,215,0,0.2)'
                      : item.status === 'in_progress'
                        ? 'rgba(0,255,65,0.2)'
                        : '#2D2D2D'
                  }`,
                }}
              >
                {/* 아바타 */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: '#242424', color: '#FFF' }}
                >
                  {item.name.charAt(0)}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold" style={{ color: '#FFF' }}>{item.name}</p>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-bold"
                      style={{
                        background: item.status === 'waiting' ? 'rgba(255,215,0,0.1)' : item.status === 'in_progress' ? 'rgba(0,255,65,0.1)' : 'rgba(100,100,100,0.1)',
                        color: item.status === 'waiting' ? '#FFD700' : item.status === 'in_progress' ? '#00FF41' : '#666',
                      }}
                    >
                      {item.status === 'waiting' ? '대기중' : item.status === 'in_progress' ? '상담중' : '완료'}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: '#888' }}>
                    {item.messages[item.messages.length - 1]?.text || '메시지 없음'}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{item.appliedAt}</p>
                </div>

                {/* 미확인 표시 */}
                {item.status === 'waiting' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <AlertCircle className="w-4 h-4" style={{ color: '#FFD700' }} />
                  </div>
                )}
              </button>
            ))}

            {queue.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-8 h-8 mx-auto mb-3" style={{ color: '#333' }} />
                <p className="text-sm" style={{ color: '#555' }}>대기중인 상담이 없습니다</p>
              </div>
            )}
          </div>
        </div>

        {/* PRO 멤버 관리 (추후 확장) */}
        <div
          className="rounded-xl p-4 mt-6"
          style={{ background: '#1A1A1A', border: '1px solid #2D2D2D' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4" style={{ color: '#00FF41' }} />
            <h3 className="text-sm font-bold" style={{ color: '#FFF' }}>PRO 멤버 관리</h3>
          </div>
          <p className="text-xs" style={{ color: '#666' }}>승인된 PRO 멤버 관리 기능이 곧 추가됩니다.</p>
        </div>
      </div>
    </div>
  );
}
