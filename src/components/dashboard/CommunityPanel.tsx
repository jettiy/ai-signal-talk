'use client';

import { useState } from 'react';
import { MessageCircle, Send, Users, Crown, Zap } from 'lucide-react';

const GRADE_STYLES: Record<string, { color: string; bg: string }> = {
  WHALE: { color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
  PRO: { color: '#00FF41', bg: 'rgba(0,255,65,0.1)' },
  'TOP 1%': { color: '#FF6B6B', bg: 'rgba(255,107,107,0.1)' },
  'LV.05': { color: '#A855F7', bg: 'rgba(168,85,247,0.1)' },
  NEW: { color: '#666', bg: 'rgba(102,102,102,0.1)' },
};

const MOCK_MESSAGES = [
  { id: 1, grade: 'WHALE', nickname: 'WhaleKing', msg: '골드 4810에서 롱 진입. TP 4850, SL 4780', time: '09:12', avatar: '🐋' },
  { id: 2, grade: 'PRO', nickname: 'ScalperPro', msg: 'GOLD $4,800 돌파 확인. 강한 매수세 유지 중', time: '09:14', avatar: '⚡' },
  { id: 3, grade: 'TOP 1%', nickname: 'TopTrader', msg: 'AAPL 262 지지 확인. 여기서 반등 기대', time: '09:16', avatar: '🔥' },
  { id: 4, grade: 'LV.05', nickname: 'AlgoMaster', msg: 'AI 시그널: NVDA SHORT 전환, 신뢰도 65%', time: '09:18', avatar: '🤖' },
  { id: 5, grade: 'PRO', nickname: 'ScalperPro', msg: '오늘 골드 약세없음. 계속 롱 관점', time: '09:22', avatar: '⚡' },
  { id: 6, grade: 'WHALE', nickname: 'GoldBull', msg: '4시간봉 EMA 지지 깔끔. 4850 도달 가능', time: '09:25', avatar: '🐂' },
  { id: 7, grade: 'TOP 1%', nickname: 'SwiftTrade', msg: 'NVDA RSI 과매수. $200에서 공매 전환?', time: '09:28', avatar: '🐻' },
  { id: 8, grade: 'NEW', nickname: '초보트레이더', msg: '골드 처음인데 롱이 뭔가요?', time: '09:30', avatar: '👶' },
];

export default function CommunityPanel() {
  const [input, setInput] = useState('');

  return (
    <div className="flex h-full">
      {/* 메인 채팅 영역 */}
      <div className="flex flex-col flex-1 min-w-0" style={{ background: '#0A0A0F' }}>
        {/* 헤더 */}
        <div
          className="flex items-center gap-2 px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid #1A1A1A' }}
        >
          <MessageCircle size={14} style={{ color: '#00FF41' }} />
          <span className="text-xs font-bold text-white">실시간 커뮤니티</span>
          <span
            className="flex items-center gap-1 text-[10px] ml-2 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,255,65,0.08)', color: '#00FF41' }}
          >
            <span className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: '#00FF41' }} />
            127 접속 중
          </span>
        </div>

        {/* 채팅 메시지 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {MOCK_MESSAGES.map((msg) => {
            const style = GRADE_STYLES[msg.grade] || GRADE_STYLES.NEW;
            return (
              <div key={msg.id} className="flex gap-3 fade-in-up">
                {/* 아바타 */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ background: style.bg }}
                >
                  {msg.avatar}
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
        <div
          className="shrink-0 p-3"
          style={{ borderTop: '1px solid #1A1A1A' }}
        >
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

      {/* 오른쪽: 온라인 유저 + 인기 시그널 */}
      <div
        className="w-64 shrink-0 flex flex-col"
        style={{ background: '#0A0A0F', borderLeft: '1px solid #1A1A1A' }}
      >
        {/* 온라인 유저 */}
        <div
          className="shrink-0 p-4"
          style={{ borderBottom: '1px solid #1A1A1A' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Users size={12} style={{ color: '#00FF41' }} />
            <span className="text-[11px] font-bold text-white">온라인 트레이더</span>
          </div>
          <div className="space-y-2">
            {[
              { name: 'WhaleKing', grade: 'WHALE', avatar: '🐋' },
              { name: 'ScalperPro', grade: 'PRO', avatar: '⚡' },
              { name: 'TopTrader', grade: 'TOP 1%', avatar: '🔥' },
              { name: 'AlgoMaster', grade: 'LV.05', avatar: '🤖' },
              { name: 'GoldBull', grade: 'WHALE', avatar: '🐂' },
              { name: 'SwiftTrade', grade: 'TOP 1%', avatar: '🐻' },
            ].map((user) => {
              const s = GRADE_STYLES[user.grade] || GRADE_STYLES.NEW;
              return (
                <div key={user.name} className="flex items-center gap-2">
                  <span className="text-sm">{user.avatar}</span>
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
            <span className="text-[11px] font-bold text-white">오늘의 HOT 시그널</span>
          </div>
          {[
            { user: 'WhaleKing', symbol: 'GOLD', type: 'LONG', conf: 92 },
            { user: 'ScalperPro', symbol: 'AAPL', type: 'LONG', conf: 85 },
            { user: 'TopTrader', symbol: 'NVDA', type: 'SHORT', conf: 78 },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-lg p-2.5 mb-2"
              style={{ background: '#111118', border: '1px solid #1A1A1A' }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold" style={{ color: '#888' }}>{s.user}</span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: s.type === 'LONG' ? 'rgba(0,255,65,0.08)' : 'rgba(255,59,59,0.08)',
                    color: s.type === 'LONG' ? '#00FF41' : '#FF3B3B',
                  }}
                >
                  {s.type}
                </span>
                <span className="text-[10px] ml-auto font-mono" style={{ color: '#555' }}>{s.conf}%</span>
              </div>
              <span className="text-xs font-bold text-white">{s.symbol}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
