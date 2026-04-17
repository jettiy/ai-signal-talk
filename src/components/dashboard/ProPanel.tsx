'use client';

import { useState } from 'react';
import {
  Crown,
  UserCheck,
  TrendingUp,
  Globe,
  Phone,
  Mail,
  User,
  Send,
  ArrowLeft,
  MessageSquare,
  X,
} from 'lucide-react';

/* ── PRO 기능 소개 데이터 ──────────────────────────────── */
const PRO_FEATURES = [
  {
    icon: UserCheck,
    title: '1:1 트레이더 배정',
    desc: '검증된 전문 트레이더가 개인 맞춤형 시그널과 멘토링을 제공합니다.',
  },
  {
    icon: TrendingUp,
    title: '실시간 고급도 시그널',
    desc: 'AI 프리미엄 분석 + 전문가 검증으로 더 높은 정확도의 매매 시그널을 받습니다.',
  },
  {
    icon: Globe,
    title: '글로벌 인텔리전스 리포트',
    desc: '글로벌 거시경제, 지정학 리스크, 기관 자금 흐름 등 심층 분석 리포트를 제공합니다.',
  },
];

type Step = 'landing' | 'form' | 'chat';

interface ProPanelProps {
  onBack?: () => void;
}

export default function ProPanel({ onBack }: ProPanelProps) {
  const [step, setStep] = useState<Step>('landing');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'admin'; text: string; time: string }[]
  >([
    {
      role: 'admin',
      text: '안녕하세요! AI 시그널톡 PRO 전환 상담입니다. 궁금한 점을 자유롭게 문의해주세요.',
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  const now = () =>
    new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  /* ── 랜딩 화면 ──────────────────────────────── */
  if (step === 'landing') {
    return (
      <div className="flex items-center justify-center h-full overflow-auto">
        <div className="max-w-lg w-full px-6 py-10">
          {/* PRO 뱃지 */}
          <div className="flex justify-center mb-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold"
              style={{
                background: 'rgba(0,255,65,0.1)',
                color: '#00FF41',
                border: '1px solid rgba(0,255,65,0.3)',
                boxShadow: '0 0 20px rgba(0,255,65,0.15)',
              }}
            >
              <Crown className="w-4 h-4" />
              PRO LEVEL ACCESS
            </div>
          </div>

          {/* 메인 타이틀 */}
          <h1
            className="text-2xl font-black text-center leading-tight mb-3"
            style={{ color: '#FFF' }}
          >
            전문 트레이더가 만든
            <br />
            <span style={{ color: '#00FF41', textShadow: '0 0 20px rgba(0,255,65,0.4)' }}>
              AI 시그널톡 PRO
            </span>
          </h1>
          <p className="text-center text-sm mb-10" style={{ color: '#888' }}>
            프리미엄 시그널과 전문가 멘토링으로 트레이딩을 한 차원 높이세요.
          </p>

          {/* 3가지 기능 카드 */}
          <div className="space-y-4 mb-10">
            {PRO_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-4 flex items-start gap-4 transition-all hover:scale-[1.02]"
                style={{
                  background: '#1A1A1A',
                  border: '1px solid #2D2D2D',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(0,255,65,0.1)',
                    border: '1px solid rgba(0,255,65,0.2)',
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#00FF41' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1" style={{ color: '#FFF' }}>
                    {title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#888' }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA 버튼 */}
          <button
            onClick={() => setStep('form')}
            className="w-full py-3.5 rounded-xl text-sm font-black transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #00FF41, #00CC33)',
              color: '#000',
              boxShadow: '0 0 24px rgba(0,255,65,0.3)',
            }}
          >
            PRO 전환 신청하기
          </button>
        </div>
      </div>
    );
  }

  /* ── 신청 폼 화면 ──────────────────────────────── */
  if (step === 'form') {
    const canSubmit = formData.name.trim() && formData.phone.trim() && formData.email.trim();

    return (
      <div className="flex items-center justify-center h-full overflow-auto">
        <div className="max-w-md w-full px-6 py-10">
          {/* 뒤로가기 */}
          <button
            onClick={() => setStep('landing')}
            className="flex items-center gap-2 text-xs mb-6 transition-colors hover:opacity-80"
            style={{ color: '#888' }}
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </button>

          {/* 타이틀 */}
          <h2 className="text-xl font-black mb-2" style={{ color: '#FFF' }}>
            PRO 등록 신청
          </h2>
          <p className="text-xs mb-8" style={{ color: '#888' }}>
            전문 상담사가 기꺼이 연락드리겠습니다.
          </p>

          {/* 입력 필드 */}
          <div className="space-y-4 mb-8">
            {/* 성명 */}
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: '#AAA' }}>
                성명
              </label>
              <div
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: '#242424', border: '1px solid #2D2D2D' }}
              >
                <User className="w-4 h-4 shrink-0" style={{ color: '#555' }} />
                <input
                  type="text"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="bg-transparent outline-none text-sm flex-1 placeholder:text-[#444]"
                  style={{ color: '#FFF' }}
                />
              </div>
            </div>

            {/* 전화번호 */}
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: '#AAA' }}>
                전화번호
              </label>
              <div
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: '#242424', border: '1px solid #2D2D2D' }}
              >
                <Phone className="w-4 h-4 shrink-0" style={{ color: '#555' }} />
                <input
                  type="tel"
                  placeholder="010-1234-5678"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  className="bg-transparent outline-none text-sm flex-1 placeholder:text-[#444]"
                  style={{ color: '#FFF' }}
                />
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: '#AAA' }}>
                이메일 주소
              </label>
              <div
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: '#242424', border: '1px solid #2D2D2D' }}
              >
                <Mail className="w-4 h-4 shrink-0" style={{ color: '#555' }} />
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="bg-transparent outline-none text-sm flex-1 placeholder:text-[#444]"
                  style={{ color: '#FFF' }}
                />
              </div>
            </div>
          </div>

          {/* 신청 버튼 */}
          <button
            onClick={() => {
              if (!canSubmit) return;
              setChatMessages((prev) => [
                ...prev,
                {
                  role: 'admin',
                  text: `${formData.name}님, PRO 전환 신청이 접수되었습니다. 확인 후 빠르게 연락드리겠습니다. 궁금한 점이 있으시면 지금 바로 문의해주세요!`,
                  time: now(),
                },
              ]);
              setStep('chat');
            }}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl text-sm font-black transition-all"
            style={{
              background: canSubmit
                ? 'linear-gradient(135deg, #00FF41, #00CC33)'
                : '#242424',
              color: canSubmit ? '#000' : '#555',
              boxShadow: canSubmit ? '0 0 24px rgba(0,255,65,0.3)' : 'none',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            신청 및 상담 시작하기
          </button>
        </div>
      </div>
    );
  }

  /* ── 관리자 1:1 상담창 ──────────────────────────────── */
  const handleSend = () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: 'user', text, time: now() }]);
    setChatInput('');

    // 관리자 자동 응답 (실제로는 WebSocket이나 API로 대체)
    setTimeout(() => {
      const replies = [
        '네, 확인했습니다. PRO 전환 절차를 안내해드리겠습니다.',
        '현재 PRO 멤버십은 관리자 승인 후 이용 가능합니다. 영업일 기준 1~2일 내에 승인됩니다.',
        'PRO 전환 시 1:1 전담 트레이더가 배정되며, 실시간 고급 시그널과 글로벌 인텔리전스 리포트를 이용하실 수 있습니다.',
        '추가 문의사항이 있으시면 언제든 말씀해주세요!',
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      setChatMessages((prev) => [...prev, { role: 'admin', text: reply, time: now() }]);
    }, 800 + Math.random() * 1200);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 헤더 */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ background: '#1A1A1A', borderBottom: '1px solid #2D2D2D' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('form')}
            className="transition-colors hover:opacity-80"
            style={{ color: '#888' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.3)' }}
          >
            <Crown className="w-4 h-4" style={{ color: '#00FF41' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#FFF' }}>
              PRO 상담 관리자
            </p>
            <p className="text-[10px] flex items-center gap-1" style={{ color: '#00FF41' }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#00FF41' }} />
              온라인
            </p>
          </div>
        </div>
        {onBack && (
          <button onClick={onBack} style={{ color: '#555' }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 채팅 메시지 영역 */}
      <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[75%] rounded-xl px-4 py-2.5"
              style={{
                background: msg.role === 'user' ? 'rgba(0,255,65,0.1)' : '#242424',
                border: `1px solid ${msg.role === 'user' ? 'rgba(0,255,65,0.2)' : '#2D2D2D'}`,
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: '#FFF' }}>
                {msg.text}
              </p>
              <p className="text-[10px] mt-1 text-right" style={{ color: '#555' }}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 채팅 입력 */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ background: '#0A0A0F', borderTop: '1px solid #1A1A1A' }}
      >
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2.5"
          style={{ background: '#1A1A1A', border: '1px solid #2D2D2D' }}
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지를 입력하세요..."
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-[#444]"
            style={{ color: '#FFF' }}
          />
          <button
            onClick={handleSend}
            disabled={!chatInput.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: chatInput.trim() ? '#00FF41' : '#242424',
              color: chatInput.trim() ? '#000' : '#555',
              cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
