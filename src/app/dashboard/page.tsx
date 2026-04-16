'use client';
import { useState } from 'react';
import { BarChart2, MessageSquare, TrendingUp, AlertCircle, Zap } from 'lucide-react';

const ASSET_TABS = [
  { label: '나스닥선물', symbol: 'NQ' },
  { label: '골드선물', symbol: 'GC' },
  { label: 'WTI선물', symbol: 'CL' },
];

const MOCK_NEWS = [
  { id: 1, tag: 'CRITICAL', tagColor: 'var(--accent-red)', source: 'Reuters', time: '2분 전', title: '美 연방준비위원회 금리 인하 전망 확대', impact: ['NASDAQ SHORT', 'GOLD LONG'] },
  { id: 2, tag: 'HIGH', tagColor: 'var(--accent-yellow)', source: 'Bloomberg', time: '8분 전', title: 'WTI 원유 재고량 예상 외 감소', impact: ['WTI LONG'] },
  { id: 3, tag: 'MEDIUM', tagColor: '#FFA500', source: 'CNBC', time: '15분 전', title: 'S&P500 채권 수익률 역전 관찰', impact: ['EQUITY BEARISH'] },
  { id: 4, tag: 'LOW', tagColor: 'var(--text-secondary)', source: 'FT', time: '32분 전', title: '반도체 수출 규제 추가 확대 가능성', impact: ['NASDAQ BEARISH'] },
];

const MOCK_CHAT = [
  { id: 1, grade: 'WHALE', gradeColor: '#FFD700', nickname: 'WhaleKing', msg: 'NQ 단타 진입했어. 18500 TP, 18420 SL', time: '09:12' },
  { id: 2, grade: 'PRO', gradeColor: 'var(--accent-green)', nickname: 'ScalperPro', msg: 'GOLD 2030 resistance突破. LONG 확인', time: '09:14' },
  { id: 3, grade: 'TOP 1%', gradeColor: '#FF6B6B', nickname: 'TopTrader', msg: 'CL 77.5에서 반등 신호 나옴. 롱 찐', time: '09:18' },
  { id: 4, grade: 'LV.05', gradeColor: '#A855F7', nickname: 'AlgoMaster', msg: 'AI 시그널: NQ BUY 전환, 신뢰도 78%', time: '09:20' },
  { id: 5, grade: 'PRO', gradeColor: 'var(--accent-green)', nickname: 'ScalperPro', msg: '오늘 NQ 약세 추세 유지 중. 스캘핑만', time: '09:25' },
];

const MOCK_SIGNALS = [
  { symbol: 'NQ', type: 'LONG', entry: 18420.5, target: 18580.0, stop: 18340.0, confidence: 78, rationale: '4시간봉 상승 모멘텀 유지, 20 EMA 지지 확인. 미 고용지표 호조로 투자 심리 개선 중.' },
  { symbol: 'GC', type: 'SHORT', entry: 2034.2, target: 2018.0, stop: 2044.0, confidence: 65, rationale: '2030阻力突破 실패, RSI 과매수 구간 진입. 기관 매도 포지션 증가 추세.' },
];

const TICKER_DATA: Record<string, { price: string; change: string; positive: boolean }> = {
  NQ: { price: '18,542.5', change: '+0.42%', positive: true },
  GC: { price: '2,034.2', change: '-0.18%', positive: false },
  CL: { price: '77.84', change: '+0.31%', positive: true },
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('NQ');
  const ticker = TICKER_DATA[activeTab];

  return (
    <div className="flex flex-col h-full">
      {/* Asset tabs bar */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-xs mr-2 shrink-0" style={{ color: 'var(--text-secondary)' }}>종목:</span>
        {ASSET_TABS.map(tab => (
          <button
            key={tab.symbol}
            onClick={() => setActiveTab(tab.symbol)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            style={{
              background: activeTab === tab.symbol ? 'var(--accent-green)' : 'var(--bg-tertiary)',
              color: activeTab === tab.symbol ? '#000' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === tab.symbol ? 'var(--accent-green)' : 'var(--border)'}`,
            }}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-mono font-bold" style={{ color: ticker.positive ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {ticker.price}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold" style={{ color: ticker.positive ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            <TrendingUp size={12} /> {ticker.change}
          </span>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex gap-4 p-4 flex-1 overflow-hidden min-h-0">
        {/* Column 1: 실시간 뉴스 */}
        <div
          className="flex-1 flex flex-col min-w-0 rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-xs font-bold text-white">LIVE FEED</span>
            <span className="w-2 h-2 rounded-full pulse-live" style={{ background: 'var(--accent-green)' }} />
            <span className="ml-auto text-xs" style={{ color: 'var(--text-secondary)' }}>30s polling</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {MOCK_NEWS.map(news => (
              <div
                key={news.id}
                className="rounded-xl p-3 fade-in-up"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${news.tagColor}20`, color: news.tagColor }}
                  >
                    {news.tag}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{news.source}</span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>{news.time}</span>
                </div>
                <p className="text-sm text-white mb-2 leading-snug">{news.title}</p>
                <div className="flex gap-2 flex-wrap">
                  {news.impact.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,255,65,0.08)', color: 'var(--accent-green)', border: '1px solid rgba(0,255,65,0.2)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: 실시간 채팅 */}
        <div
          className="w-80 shrink-0 flex flex-col min-w-0 rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <MessageSquare size={14} style={{ color: 'var(--accent-green)' }} />
            <span className="text-xs font-bold text-white">COMMUNITY</span>
            <span className="ml-auto text-xs" style={{ color: 'var(--text-secondary)' }}>127 Online</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {MOCK_CHAT.map(chat => (
              <div
                key={chat.id}
                className="rounded-xl p-2.5 fade-in-up"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${chat.gradeColor}20`, color: chat.gradeColor }}
                  >
                    {chat.grade}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{chat.nickname}</span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>{chat.time}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{chat.msg}</p>
              </div>
            ))}
          </div>
          {/* Chat input */}
          <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="메시지 입력..."
                className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <button
                className="px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                style={{ background: 'var(--accent-green)', color: '#000' }}
              >
                ↑
              </button>
            </div>
          </div>
        </div>

        {/* Column 3: AI 시그널 분석 */}
        <div
          className="w-96 shrink-0 flex flex-col min-w-0 rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <BarChart2 size={14} style={{ color: 'var(--accent-green)' }} />
            <span className="text-xs font-bold text-white">AI SIGNAL ANALYSIS</span>
            <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: 'var(--accent-green)' }}>
              <span className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: 'var(--accent-green)' }} />
              AUTO
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {MOCK_SIGNALS.map((sig, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 fade-in-up"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
              >
                {/* Header row */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-bold text-white">{sig.symbol}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      background: sig.type === 'LONG' ? 'rgba(0,255,65,0.1)' : 'rgba(255,59,59,0.1)',
                      color: sig.type === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)',
                      border: `1px solid ${sig.type === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                    }}
                  >
                    {sig.type === 'LONG' ? '▲ LONG' : '▼ SHORT'}
                  </span>
                  <div className="ml-auto flex flex-col items-end">
                    <span className="text-xs font-bold" style={{ color: 'var(--accent-green)' }}>{sig.confidence}%</span>
                    <div className="w-16 h-1 rounded-full mt-1" style={{ background: 'var(--border)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${sig.confidence}%`, background: 'var(--accent-green)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Price levels */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: '진입가', val: sig.entry.toLocaleString(), color: 'var(--text-primary)' },
                    { label: '목표가', val: sig.target.toLocaleString(), color: 'var(--accent-green)' },
                    { label: '손절가', val: sig.stop.toLocaleString(), color: 'var(--accent-red)' },
                  ].map(item => (
                    <div key={item.label} className="text-center rounded-xl p-2" style={{ background: 'var(--bg-secondary)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
                      <p className="text-xs font-mono font-bold" style={{ color: item.color }}>{item.val}</p>
                    </div>
                  ))}
                </div>

                {/* Rationale */}
                <div className="rounded-xl p-3" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-1 mb-2">
                    <AlertCircle size={10} style={{ color: 'var(--accent-yellow)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--accent-yellow)' }}>AI 분석 근거</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{sig.rationale}</p>
                </div>
              </div>
            ))}

            {/* AI Bot card */}
            <div
              className="rounded-2xl p-4 fade-in-up"
              style={{ background: 'rgba(0,255,65,0.03)', border: '1px solid rgba(0,255,65,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--accent-green)', color: '#000' }}
                >
                  AI
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--accent-green)' }}>SIGNAL Bot</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>AI 분석 엔진</p>
                </div>
                <span className="ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,65,0.1)', color: 'var(--accent-green)' }}>
                  <Zap size={10} /> ONLINE
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                NQ {activeTab === 'NQ' ? '현재 상승 모멘텀 유지 중. 18500突破 시 추가 상승 가능.' : '선택된 종목의 시그널을 생성하려면 AI 분석 버튼을 눌러주세요.'}
              </p>
              <button
                className="mt-3 w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                style={{ background: 'rgba(0,255,65,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(0,255,65,0.3)' }}
              >
                <Zap size={12} /> AI 시그널 생성
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
