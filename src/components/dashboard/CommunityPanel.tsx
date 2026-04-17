'use client';

import { useState } from 'react';
import { MessageCircle, Send, Users, Crown, Hash, TrendingUp, TrendingDown } from 'lucide-react';

// ── 등급 스타일 ────────────────────────────────────────────────
const GRADE_STYLES: Record<string, { color: string; bg: string }> = {
  WHALE: { color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
  PRO: { color: '#00FF41', bg: 'rgba(0,255,65,0.1)' },
  'TOP 1%': { color: '#FF6B6B', bg: 'rgba(255,107,107,0.1)' },
  'LV.05': { color: '#A855F7', bg: 'rgba(168,85,247,0.1)' },
  NEW: { color: '#666', bg: 'rgba(102,102,102,0.1)' },
};

// ── 채널 ──────────────────────────────────────────────────────
const CHANNELS = [
  { id: 'general', label: '전체', icon: Hash },
  { id: 'nq', label: '나스닥선물', icon: Hash },
  { id: 'gc', label: '골드선물', icon: Hash },
  { id: 'cl', label: 'WTI원유', icon: Hash },
  { id: 'signal', label: '시그널 공유', icon: Crown },
];

// ── Mock 메시지 ────────────────────────────────────────────────
const MOCK_MESSAGES = [
  { id: 1, grade: 'WHALE', nickname: 'WhaleKing', msg: '골드 4810에서 롱 진입. TP 4850, SL 4780', time: '09:12', channel: 'gc' },
  { id: 2, grade: 'PRO', nickname: 'ScalperPro', msg: 'GOLD $4,800 돌파 확인. 강한 매수세 유지 중', time: '09:14', channel: 'gc' },
  { id: 3, grade: 'TOP 1%', nickname: 'TopTrader', msg: 'NQ 21,280 지지 확인. 여기서 반등 기대', time: '09:16', channel: 'nq' },
  { id: 4, grade: 'LV.05', nickname: 'AlgoMaster', msg: 'AI 시그널: NVDA SHORT 전환, 신뢰도 65%', time: '09:18', channel: 'signal' },
  { id: 5, grade: 'PRO', nickname: 'ScalperPro', msg: '오늘 골드 약세없음. 계속 롱 관점', time: '09:22', channel: 'gc' },
  { id: 6, grade: 'WHALE', nickname: 'GoldBull', msg: '4시간봉 EMA 지지 깔끔. 4850 도달 가능', time: '09:25', channel: 'gc' },
  { id: 7, grade: 'TOP 1%', nickname: 'SwiftTrade', msg: 'NQ RSI 과매수. 21,350에서 매도 전환?', time: '09:28', channel: 'nq' },
  { id: 8, grade: 'PRO', nickname: 'OilTrader', msg: 'WTI $64.80 롱 진입. OPEC 감산 연장 호재', time: '09:30', channel: 'cl' },
  { id: 9, grade: 'LV.05', nickname: 'DataMiner', msg: 'GC 5분봉 매수 시그널 감지. 신뢰도 82%', time: '09:32', channel: 'signal' },
  { id: 10, grade: 'WHALE', nickname: 'WhaleKing', msg: 'NQ 21,250 응봉 확인. 추가 상승 가능', time: '09:35', channel: 'nq' },
];

// ── 온라인 유저 ────────────────────────────────────────────────
const ONLINE_USERS = [
  { name: 'WhaleKing', grade: 'WHALE' },
  { name: 'ScalperPro', grade: 'PRO' },
  { name: 'TopTrader', grade: 'TOP 1%' },
  { name: 'AlgoMaster', grade: 'LV.05' },
  { name: 'GoldBull', grade: 'WHALE' },
  { name: 'SwiftTrade', grade: 'TOP 1%' },
  { name: 'OilTrader', grade: 'PRO' },
  { name: 'DataMiner', grade: 'LV.05' },
];

// ── 인기 시그널 ────────────────────────────────────────────────
const HOT_SIGNALS = [
  { user: 'WhaleKing', symbol: 'GCUSD', direction: 'buy' as const, confidence: 92 },
  { user: 'ScalperPro', symbol: 'NQUSD', direction: 'buy' as const, confidence: 85 },
  { user: 'TopTrader', symbol: 'NQUSD', direction: 'sell' as const, confidence: 78 },
  { user: 'OilTrader', symbol: 'CLUSD', direction: 'buy' as const, confidence: 74 },
];

// ── 등급 이니셜 ────────────────────────────────────────────────
function getInitials(nickname: string) {
  return nickname.slice(0, 2).toUpperCase();
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function CommunityPanel() {
  const [input, setInput] = useState('');
  const [activeChannel, setActiveChannel] = useState('general');

  const filteredMessages = activeChannel === 'general'
    ? MOCK_MESSAGES
    : MOCK_MESSAGES.filter((m) => m.channel === activeChannel);

  return (
    <div className="flex h-full">
      {/* ── 왼쪽: 채널 사이드바 ─────────────────────────── */}
      <div
        className="w-48 shrink-0 flex flex-col"
        style={{ background: '#0A0A0F', borderRight: '1px solid #1A1A1A' }}
      >
        <div className="px-3 py-3" style={{ borderBottom: '1px solid #1A1A1A' }}>
          <span className="text-[11px] font-bold text-white">채널</span>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer transition-all"
                style={{
                  background: activeChannel === ch.id ? 'rgba(0,255,65,0.06)' : 'transparent',
                  borderLeft: activeChannel === ch.id ? '2px solid #00FF41' : '2px solid transparent',
                }}
              >
                <Icon size={12} style={{ color: activeChannel === ch.id ? '#00FF41' : '#444' }} />
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: activeChannel === ch.id ? '#FFF' : '#666' }}
                >
                  {ch.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 중앙: 채팅 영역 ─────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0" style={{ background: '#0D0D0D' }}>
        {/* 헤더 */}
        <div
          className="flex items-center gap-2 px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid #1A1A1A', background: '#0A0A0F' }}
        >
          <MessageCircle size={14} style={{ color: '#00FF41' }} />
          <span className="text-xs font-bold text-white">
            {CHANNELS.find((c) => c.id === activeChannel)?.label}
          </span>
          <span
            className="flex items-center gap-1 text-[10px] ml-2 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,255,65,0.08)', color: '#00FF41' }}
          >
            <span className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: '#00FF41' }} />
            {ONLINE_USERS.length} 접속 중
          </span>
        </div>

        {/* 채팅 메시지 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredMessages.map((msg) => {
            const style = GRADE_STYLES[msg.grade] || GRADE_STYLES.NEW;
            return (
              <div key={msg.id} className="flex gap-3">
                {/* 아바타 (이니셜) */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0"
                  style={{ background: style.bg, color: style.color }}
                >
                  {getInitials(msg.nickname)}
                </div>

                {/* 메시지 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {msg.grade}
                    </span>
                    <span className="text-xs font-semibold text-white">{msg.nickname}</span>
                    <span className="text-[10px] ml-auto" style={{ color: '#444' }}>{msg.time}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#CCC' }}>
                    {msg.msg}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 입력 영역 */}
        <div className="shrink-0 p-3" style={{ borderTop: '1px solid #1A1A1A', background: '#0A0A0F' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#111118', border: '1px solid #1A1A1A', color: 'white' }}
            />
            <button
              className="px-4 py-3 rounded-xl font-bold text-sm cursor-pointer flex items-center gap-1.5"
              style={{ background: '#00FF41', color: '#000' }}
            >
              <Send size={14} />
              전송
            </button>
          </div>
        </div>
      </div>

      {/* ── 오른쪽: 온라인 유저 + 인기 시그널 ────────────── */}
      <div
        className="w-60 shrink-0 flex flex-col"
        style={{ background: '#0A0A0F', borderLeft: '1px solid #1A1A1A' }}
      >
        {/* 온라인 유저 */}
        <div className="shrink-0 p-4" style={{ borderBottom: '1px solid #1A1A1A' }}>
          <div className="flex items-center gap-2 mb-3">
            <Users size={12} style={{ color: '#00FF41' }} />
            <span className="text-[11px] font-bold text-white">온라인</span>
            <span className="text-[10px] font-mono" style={{ color: '#444' }}>{ONLINE_USERS.length}</span>
          </div>
          <div className="space-y-2">
            {ONLINE_USERS.map((user) => {
              const s = GRADE_STYLES[user.grade] || GRADE_STYLES.NEW;
              return (
                <div key={user.name} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-black"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {getInitials(user.name)}
                  </div>
                  <span className="text-[11px] font-semibold text-white">{user.name}</span>
                  <span
                    className="text-[9px] font-bold px-1 py-0.5 rounded ml-auto"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {user.grade}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 오늘의 인기 시그널 */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={12} style={{ color: '#FFD700' }} />
            <span className="text-[11px] font-bold text-white">HOT 시그널</span>
          </div>
          {HOT_SIGNALS.map((s, i) => {
            const isBuy = s.direction === 'buy';
            return (
              <div
                key={i}
                className="rounded-lg p-2.5 mb-2"
                style={{
                  background: '#111118',
                  border: `1px solid ${isBuy ? 'rgba(0,255,65,0.1)' : 'rgba(255,59,59,0.1)'}`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold" style={{ color: '#888' }}>{s.user}</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                    style={{
                      background: isBuy ? 'rgba(0,255,65,0.08)' : 'rgba(255,59,59,0.08)',
                      color: isBuy ? '#00FF41' : '#FF3B3B',
                    }}
                  >
                    {isBuy ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                    {isBuy ? '매수' : '매도'}
                  </span>
                  <span className="text-[10px] ml-auto font-mono" style={{ color: '#555' }}>{s.confidence}%</span>
                </div>
                <span className="text-xs font-bold text-white">{s.symbol}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
