'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Crown,
  ShieldAlert,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Activity,
  MessageSquare,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import Sidebar from '@/components/layout/Sidebar';
import TickerBar from '@/components/dashboard/TickerBar';

/* ── Mock 데이터 ─────────────────────────────────────── */

// KPI
const MOCK_KPI = {
  totalUsers: 1247,
  monthlyGrowth: 12.4,
  activeMembers: 893,
  activeRatio: 71.6,
  proMembers: 186,
  pendingVerification: 34,
};

// 사용자 증가 추이 (최근 30일)
const MOCK_GROWTH = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    users: Math.floor(Math.random() * 20) + 5,
  };
});

// 상담 대기열
const MOCK_CONSULT_QUEUE = [
  { id: 'c1', name: '김준석', message: 'PRO 전환 문의드립니다.', time: '23:45', status: 'waiting' },
  { id: 'c2', name: '이하늘', message: 'PRO 혜택이 어떻게 되나요?', time: '00:13', status: 'in_progress' },
  { id: 'c3', name: '박미래', message: '1:1 트레이더 배정은 언제 되나요?', time: '00:30', status: 'waiting' },
  { id: 'c4', name: '정태양', message: '결제 오류가 발생했습니다.', time: '01:02', status: 'waiting' },
];

// 사용자 테이블
const MOCK_USERS = Array.from({ length: 48 }, (_, i) => ({
  id: `u${i + 1}`,
  name: ['김준석', '이하늘', '박미래', '정태양', '최수진', '한도윤', '윤서연', '강민호', '임채원', '송지훈'][i % 10],
  email: `user${i + 1}@example.com`,
  avatar: null,
  role: (['ADMIN', 'PRO', 'BASIC', 'PENDING'] as const)[i % 4],
  status: (['활성', '비활성', '정지'] as const)[i % 3],
  lastLogin: `2026-04-${String(21 - (i % 7)).padStart(2, '0')} ${String(8 + (i % 14)).padStart(2, '0')}:00`,
}));

/* ── 실시간 시계 ──────────────────────────────────────── */
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleString('ko-KR', {
          timeZone: 'Asia/Seoul',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-xs font-mono" style={{ color: '#888' }}>{time} KST</span>;
}

/* ── KPI 카드 ─────────────────────────────────────────── */
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: '#1A1A1A', border: '1px solid #2D2D2D' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#666' }}>
          {label}
        </span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-2xl font-black" style={{ color: '#FFF' }}>{value}</p>
      <span className="text-[11px] font-semibold" style={{ color }}>
        {sub}
      </span>
    </div>
  );
}

/* ── 상담 대기열 미니 ─────────────────────────────────── */
function ConsultMiniQueue() {
  return (
    <div
      className="rounded-xl p-4 h-full flex flex-col"
      style={{ background: '#1A1A1A', border: '1px solid #2D2D2D' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold" style={{ color: '#FFF' }}>상담 대기열</h3>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-bold"
          style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.2)' }}
        >
          {MOCK_CONSULT_QUEUE.filter(c => c.status === 'waiting').length} 대기
        </span>
      </div>
      <div className="space-y-2 flex-1 overflow-auto">
        {MOCK_CONSULT_QUEUE.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg p-3 transition-colors"
            style={{ background: '#0F0F0F', border: '1px solid #1A1A1A' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: '#242424', color: '#FFF' }}
            >
              {item.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold" style={{ color: '#FFF' }}>{item.name}</p>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{
                    background: item.status === 'waiting' ? 'rgba(255,215,0,0.1)' : 'rgba(0,255,65,0.1)',
                    color: item.status === 'waiting' ? '#FFD700' : '#00FF41',
                  }}
                >
                  {item.status === 'waiting' ? '대기' : '상담중'}
                </span>
              </div>
              <p className="text-[10px] truncate" style={{ color: '#666' }}>{item.message}</p>
            </div>
            <span className="text-[10px] shrink-0" style={{ color: '#444' }}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 사용자 테이블 ────────────────────────────────────── */

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  ADMIN: { bg: 'rgba(0,255,65,0.1)', color: '#00FF41' },
  PRO: { bg: 'rgba(168,85,247,0.1)', color: '#A855F7' },
  BASIC: { bg: 'rgba(100,100,100,0.1)', color: '#888' },
  PENDING: { bg: 'rgba(255,215,0,0.1)', color: '#FFD700' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  활성: { bg: 'rgba(0,255,65,0.1)', color: '#00FF41' },
  비활성: { bg: 'rgba(100,100,100,0.1)', color: '#666' },
  정지: { bg: 'rgba(255,59,59,0.1)', color: '#FF3B3B' },
};

function UserTable() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_USERS.filter(
    u =>
      u.name.includes(search) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#1A1A1A', border: '1px solid #2D2D2D' }}
    >
      {/* 검색 + 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold" style={{ color: '#FFF' }}>사용자 관리</h3>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: '#0F0F0F', border: '1px solid #2D2D2D' }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: '#555' }} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="이름 또는 이메일 검색..."
              className="bg-transparent outline-none text-xs placeholder:text-[#444] w-48"
              style={{ color: '#FFF' }}
            />
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
            style={{ background: '#00FF41', color: '#000' }}
          >
            <Plus className="w-3.5 h-3.5" />
            신규 등록
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: '1px solid #2D2D2D' }}>
              <th className="text-[10px] font-bold uppercase tracking-wider pb-3 pl-3" style={{ color: '#555' }}>사용자</th>
              <th className="text-[10px] font-bold uppercase tracking-wider pb-3" style={{ color: '#555' }}>역할</th>
              <th className="text-[10px] font-bold uppercase tracking-wider pb-3" style={{ color: '#555' }}>상태</th>
              <th className="text-[10px] font-bold uppercase tracking-wider pb-3" style={{ color: '#555' }}>마지막 접속</th>
              <th className="text-[10px] font-bold uppercase tracking-wider pb-3 pr-3 text-right" style={{ color: '#555' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(u => {
              const rs = ROLE_STYLES[u.role];
              const ss = STATUS_STYLES[u.status];
              return (
                <tr
                  key={u.id}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: '1px solid #1A1A1A' }}
                >
                  {/* 사용자 */}
                  <td className="py-3 pl-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: '#242424', color: '#FFF' }}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold" style={{ color: '#FFF' }}>{u.name}</p>
                        <p className="text-[10px]" style={{ color: '#555' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* 역할 */}
                  <td className="py-3">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-bold"
                      style={{ background: rs.bg, color: rs.color }}
                    >
                      {u.role}
                    </span>
                  </td>
                  {/* 상태 */}
                  <td className="py-3">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-bold"
                      style={{ background: ss.bg, color: ss.color }}
                    >
                      {u.status}
                    </span>
                  </td>
                  {/* 마지막 접속 */}
                  <td className="py-3">
                    <span className="text-[10px] font-mono" style={{ color: '#666' }}>{u.lastLogin}</span>
                  </td>
                  {/* 관리 */}
                  <td className="py-3 pr-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: '#555' }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10 hover:text-red-400" style={{ color: '#555' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid #1A1A1A' }}>
        <span className="text-[10px]" style={{ color: '#555' }}>
          전체 {filtered.length}명 중 {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: page === 1 ? '#333' : '#888', background: page === 1 ? 'transparent' : '#242424' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
              style={{
                background: page === i + 1 ? '#00FF41' : '#242424',
                color: page === i + 1 ? '#000' : '#888',
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: page === totalPages ? '#333' : '#888', background: page === totalPages ? 'transparent' : '#242424' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 메인 페이지 ──────────────────────────────────────── */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<string>('admin');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0D0D0D' }}>
      <Sidebar active={"admin" as any} onNavigate={setActiveTab} userRole="ADMIN" />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 상단 헤더 */}
        <header
          className="flex items-center justify-between px-5 shrink-0"
          style={{ height: 48, background: '#0A0A0F', borderBottom: '1px solid #1A1A1A' }}
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5" style={{ color: '#00FF41' }} />
            <h1 className="text-sm font-black" style={{ color: '#FFF' }}>AI 시그널톡 관리자</h1>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
              style={{ background: 'rgba(0,255,65,0.1)', color: '#00FF41', border: '1px solid rgba(0,255,65,0.2)' }}
            >
              <Activity className="w-3 h-3" />
              LIVE DATA FEED
            </span>
          </div>
          <LiveClock />
        </header>

        <TickerBar />

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-auto px-6 py-6 space-y-6" style={{ background: '#0A0A0F' }}>
          {/* KPI 카드 4개 */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              icon={Users}
              label="전체 사용자"
              value={MOCK_KPI.totalUsers.toLocaleString()}
              sub={`▲ ${MOCK_KPI.monthlyGrowth}% 전월 대비`}
              color="#00FF41"
            />
            <KpiCard
              icon={UserCheck}
              label="활성 멤버"
              value={MOCK_KPI.activeMembers.toLocaleString()}
              sub={`${MOCK_KPI.activeRatio}% 접속률`}
              color="#3B82F6"
            />
            <KpiCard
              icon={Crown}
              label="PRO 멤버십"
              value={MOCK_KPI.proMembers.toLocaleString()}
              sub="Top Tier Access"
              color="#A855F7"
            />
            <KpiCard
              icon={ShieldAlert}
              label="대기 중 검증"
              value={MOCK_KPI.pendingVerification.toLocaleString()}
              sub="Verification Pending"
              color="#FFD700"
            />
          </div>

          {/* 활성 멤버 프로그레스 바 */}
          <div
            className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: '#1A1A1A', border: '1px solid #2D2D2D' }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ color: '#666' }}>
              활성률
            </span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#242424' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${MOCK_KPI.activeRatio}%`, background: 'linear-gradient(90deg, #00FF41, #3B82F6)' }}
              />
            </div>
            <span className="text-xs font-bold" style={{ color: '#00FF41' }}>{MOCK_KPI.activeRatio}%</span>
          </div>

          {/* 중간 2칸: 차트 + 상담 대기열 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 사용자 증가 추이 */}
            <div
              className="rounded-xl p-4"
              style={{ background: '#1A1A1A', border: '1px solid #2D2D2D' }}
            >
              <h3 className="text-sm font-bold mb-4" style={{ color: '#FFF' }}>사용자 증가 추이</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_GROWTH}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#555' }}
                      axisLine={{ stroke: '#2D2D2D' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#555' }}
                      axisLine={{ stroke: '#2D2D2D' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#242424',
                        border: '1px solid #2D2D2D',
                        borderRadius: 8,
                        fontSize: 11,
                        color: '#FFF',
                      }}
                      labelStyle={{ color: '#888' }}
                    />
                    <Bar dataKey="users" fill="#00FF41" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 상담 대기열 */}
            <ConsultMiniQueue />
          </div>

          {/* 사용자 테이블 */}
          <UserTable />
        </main>
      </div>
    </div>
  );
}
