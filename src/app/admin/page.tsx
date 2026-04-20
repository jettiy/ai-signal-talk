'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

/* ── 타입 ───────────────────────────────────────────── */

interface Consultation {
  id: number;
  user_id: number;
  nickname: string;
  email: string;
  title: string;
  last_message: string;
  message_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ConsultationsResponse {
  consultations: Consultation[];
  pending_count: number;
}

interface DailySignup {
  date: string;
  count: number;
}

interface DailySignupsResponse {
  daily: DailySignup[];
}

/* ── API 호출 헬퍼 ───────────────────────────────────── */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function fetchJSON<T>(url: string): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('인증이 필요합니다');
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('데이터를 불러올 수 없습니다');
  return res.json();
}

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

/* ── 스켈레톤 UI ─────────────────────────────────────── */
function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded ${className ?? ''}`}
      style={{ background: '#1A1A1A', ...style }}
    />
  );
}

/* ── KPI 카드 ─────────────────────────────────────────── */
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  loading?: boolean;
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
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p className="text-2xl font-black" style={{ color: '#FFF' }}>{value}</p>
      )}
      <span className="text-[11px] font-semibold" style={{ color }}>
        {sub}
      </span>
    </div>
  );
}

/* ── 상담 대기열 미니 ─────────────────────────────────── */
function ConsultMiniQueue({ onClick }: { onClick: () => void }) {
  const [data, setData] = useState<ConsultationsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchJSON<ConsultationsResponse>('/api/admin/consultations');
        setData(res);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const consultations = data?.consultations ?? [];
  const pendingCount = data?.pending_count ?? 0;

  // pending_count를 상위로 전달하기 위한 이벤트 (간단히 data-attr 사용)
  useEffect(() => {
    if (pendingCount > 0) {
      window.dispatchEvent(new CustomEvent('admin-pending-update', { detail: pendingCount }));
    }
  }, [pendingCount]);

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="rounded-xl p-4 h-full flex flex-col"
      style={{ background: '#1A1A1A', border: '1px solid #2D2D2D' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold" style={{ color: '#FFF' }}>상담 대기열</h3>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-bold"
          style={{ background: pendingCount > 0 ? 'rgba(255,59,59,0.15)' : 'rgba(255,215,0,0.1)', color: pendingCount > 0 ? '#FF3B3B' : '#FFD700', border: `1px solid ${pendingCount > 0 ? 'rgba(255,59,59,0.3)' : 'rgba(255,215,0,0.2)'}` }}
        >
          {pendingCount} ACTIVE
        </span>
      </div>
      <div className="space-y-2 flex-1 overflow-auto">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}
        {!loading && consultations.length === 0 && (
          <p className="text-xs text-center py-8" style={{ color: '#555' }}>상담 내역이 없습니다</p>
        )}
        {!loading && consultations.map(item => (
          <div
            key={item.id}
            onClick={onClick}
            className="flex items-center gap-3 rounded-lg p-3 transition-colors cursor-pointer hover:bg-white/[0.03]"
            style={{ background: '#0F0F0F', border: '1px solid #1A1A1A' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: '#242424', color: '#FFF' }}
            >
              {(item.nickname || '?').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold" style={{ color: '#FFF' }}>{item.nickname || '알 수 없음'}</p>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{
                    background: 'rgba(0,255,65,0.1)',
                    color: '#00FF41',
                  }}
                >
                  {item.status === 'active' ? '진행중' : '대기'}
                </span>
              </div>
              <p className="text-[10px] truncate" style={{ color: '#666' }}>{item.last_message || item.title}</p>
            </div>
            <span className="text-[10px] shrink-0" style={{ color: '#444' }}>{formatTime(item.updated_at)}</span>
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

interface ApiUser {
  id: number;
  email: string;
  nickname: string;
  user_role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface UsersResponse {
  users: ApiUser[];
  total: number;
  page: number;
  totalPages: number;
}

function UserTable() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchUsers = useCallback(async (p: number, s: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (s) params.set('search', s);
      const res = await fetchJSON<UsersResponse>(`/api/admin/users?${params}`);
      setData(res);
    } catch (e: any) {
      setError(e.message || '데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page, search);
  }, [page, fetchUsers, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers(1, value);
    }, 300);
  };

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const perPage = 20;

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
              onChange={e => handleSearch(e.target.value)}
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

      {/* 에러 */}
      {error && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: '#FF3B3B' }}>{error}</p>
        </div>
      )}

      {/* 로딩 스켈레톤 */}
      {loading && !error && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {/* 테이블 */}
      {!loading && !error && (
        <>
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
                {users.map(u => {
                  const roleName = u.user_role || 'BASIC';
                  const status = u.is_active ? '활성' : '비활성';
                  const rs = ROLE_STYLES[roleName] ?? ROLE_STYLES.BASIC;
                  const ss = STATUS_STYLES[status] ?? STATUS_STYLES.비활성;
                  const displayName = u.nickname || u.email.split('@')[0];
                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: '1px solid #1A1A1A' }}
                    >
                      <td className="py-3 pl-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: '#242424', color: '#FFF' }}
                          >
                            {displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold" style={{ color: '#FFF' }}>{displayName}</p>
                            <p className="text-[10px]" style={{ color: '#555' }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded font-bold"
                          style={{ background: rs.bg, color: rs.color }}
                        >
                          {roleName}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded font-bold"
                          style={{ background: ss.bg, color: ss.color }}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-[10px] font-mono" style={{ color: '#666' }}>
                          {u.last_login
                            ? new Date(u.last_login).toLocaleString('ko-KR', {
                                timeZone: 'Asia/Seoul',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </span>
                      </td>
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
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs" style={{ color: '#555' }}>
                      검색 결과가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid #1A1A1A' }}>
              <span className="text-[10px]" style={{ color: '#555' }}>
                전체 {total}명
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
                {/* 최대 5개 페이지 번호만 표시 */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
                      style={{
                        background: page === pageNum ? '#00FF41' : '#242424',
                        color: page === pageNum ? '#000' : '#888',
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
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
          )}
        </>
      )}
    </div>
  );
}

/* ── 메인 페이지 ──────────────────────────────────────── */

interface StatsResponse {
  total_users: number;
  pro_users: number;
  basic_users: number;
  today_signups: number;
  monthly_active: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<string>('admin');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [growthData, setGrowthData] = useState<{ date: string; users: number }[]>([]);
  const [growthLoading, setGrowthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJSON<StatsResponse>('/api/admin/stats');
        setStats(data);
      } catch (e: any) {
        setStatsError(e.message || '통계를 불러올 수 없습니다');
      } finally {
        setStatsLoading(false);
      }
    })();

    (async () => {
      try {
        const res = await fetchJSON<DailySignupsResponse>('/api/admin/daily-signups');
        const formatted = (res.daily ?? []).map(d => {
          const dt = new Date(d.date + 'T00:00:00');
          return {
            date: `${dt.getMonth() + 1}/${dt.getDate()}`,
            users: d.count,
          };
        });
        setGrowthData(formatted);
      } catch {
        // fallback: 빈 배열
      } finally {
        setGrowthLoading(false);
      }
    })();
  }, []);

  const totalUsers = stats?.total_users ?? 0;
  const monthlyActive = stats?.monthly_active ?? 0;
  const activeRatio = totalUsers > 0 ? ((monthlyActive / totalUsers) * 100).toFixed(1) : '0.0';
  const proUsers = stats?.pro_users ?? 0;
  const todaySignups = stats?.today_signups ?? 0;

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
              value={statsLoading ? '' : totalUsers.toLocaleString()}
              sub={`▲ 오늘 ${todaySignups}명 가입`}
              color="#00FF41"
              loading={statsLoading}
            />
            <KpiCard
              icon={UserCheck}
              label="활성 멤버"
              value={statsLoading ? '' : monthlyActive.toLocaleString()}
              sub={`${activeRatio}% 접속률`}
              color="#3B82F6"
              loading={statsLoading}
            />
            <KpiCard
              icon={Crown}
              label="PRO 멤버십"
              value={statsLoading ? '' : proUsers.toLocaleString()}
              sub="Top Tier Access"
              color="#A855F7"
              loading={statsLoading}
            />
            <KpiCard
              icon={ShieldAlert}
              label="대기 중 검증"
              value="0"
              sub="Verification Pending"
              color="#FFD700"
            />
          </div>

          {statsError && (
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.2)' }}>
              <p className="text-xs" style={{ color: '#FF3B3B' }}>{statsError}</p>
            </div>
          )}

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
                style={{ width: `${activeRatio}%`, background: 'linear-gradient(90deg, #00FF41, #3B82F6)' }}
              />
            </div>
            <span className="text-xs font-bold" style={{ color: '#00FF41' }}>{activeRatio}%</span>
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
                  <BarChart data={growthData}>
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
            <ConsultMiniQueue onClick={() => router.push('/dashboard?tab=admin')} />
          </div>

          {/* 사용자 테이블 */}
          <UserTable />
        </main>
      </div>
    </div>
  );
}
