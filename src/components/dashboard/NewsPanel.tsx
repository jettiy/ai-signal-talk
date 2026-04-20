'use client';

import { useState } from 'react';
import { Newspaper, ExternalLink, Clock, Flame, TrendingUp, Tag, Loader2, Activity, Filter } from 'lucide-react';
import { useNews } from '@/hooks/useNews';
import { useFearGreed } from '@/hooks/useFearGreed';
import type { NewsItem } from '@/lib/types';

// ── 카테고리 설정 ─────────────────────────────────────────────
const NEWS_CATEGORIES = [
  { id: 'all', label: '전체', color: '#00FF41' },
  { id: 'macro', label: '거시경제', color: '#00B4D8' },
  { id: 'commodity', label: '원자재', color: '#FFD700' },
  { id: 'tech', label: '테크', color: '#A855F7' },
  { id: 'crypto', label: '암호화폐', color: '#FF6B6B' },
];

// ── 뉴스 출처 필터 ──────────────────────────────────────────────
const NEWS_SOURCES = [
  { id: 'all', label: '전체', icon: '📰' },
  { id: 'reuters', label: 'Reuters', icon: '🔵' },
  { id: 'bloomberg', label: 'Bloomberg', icon: '🟠' },
  { id: 'cnbc', label: 'CNBC', icon: '🟣' },
  { id: 'wsj', label: 'WSJ', icon: '⚫' },
  { id: 'ft', label: 'FT', icon: '🟤' },
  { id: 'nytimes', label: 'NYT', icon: '⬛' },
  { id: 'coindesk', label: 'CoinDesk', icon: '🟡' },
  { id: 'nikkei', label: 'Nikkei', icon: '🔴' },
];

// ── 출처 키워드 매핑 ──────────────────────────────────────────
function matchSource(source: string): string {
  const s = source.toLowerCase();
  if (s.includes('reuters')) return 'reuters';
  if (s.includes('bloomberg')) return 'bloomberg';
  if (s.includes('cnbc')) return 'cnbc';
  if (s.includes('wall street') || s.includes('wsj')) return 'wsj';
  if (s.includes('financial times') || s.includes('ft.com')) return 'ft';
  if (s.includes('new york times') || s.includes('nytimes')) return 'nytimes';
  if (s.includes('coindesk')) return 'coindesk';
  if (s.includes('nikkei')) return 'nikkei';
  return '';
}

// ── 임팩트 매핑 ────────────────────────────────────────────────
const IMPACT_MAP = {
  high: { label: '높음', color: '#FF3B3B', bg: 'rgba(255,59,59,0.1)' },
  medium: { label: '보통', color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
  low: { label: '낮음', color: '#555', bg: 'rgba(85,85,85,0.1)' },
};

// ── 심볼 → 카테고리 자동 추론 ────────────────────────────────
function inferCategory(symbol: string): string {
  if (['GCUSD', 'CLUSD', 'NQUSD', 'GLD', 'SLV', 'USO'].includes(symbol)) return 'commodity';
  if (['AAPL', 'NVDA', 'TSLA', 'META', 'MSFT', 'AMZN', 'GOOGL', 'AMD', 'INTC'].includes(symbol)) return 'tech';
  if (['BTCUSD', 'ETHUSD'].includes(symbol)) return 'crypto';
  return 'macro';
}

// ── 제목 → 임팩트 자동 추론 ──────────────────────────────────
function inferImpact(title: string): 'high' | 'medium' | 'low' {
  const highKeywords = ['사상', '급락', '폭발', '긴급', '최고치', '최저치', '핵전쟁', '패닉', '크래시', '급등', '돌파'];
  const lowerTitle = title.toLowerCase();
  if (highKeywords.some(kw => lowerTitle.includes(kw))) return 'high';
  return 'medium';
}

// ── 날짜 → 상대 시간 ────────────────────────────────────────
function getRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    return `${diffDay}일 전`;
  } catch {
    return '';
  }
}

// ── 뉴스 UI 아이템 타입 ──────────────────────────────────────
interface NewsUiItem {
  id: string;
  title: string;
  source: string;
  time: string;
  category: string;
  impact: 'high' | 'medium' | 'low';
  summary: string;
  relatedSymbols: string[];
  url: string;
}

// ── NewsItem → NewsUiItem 변환 ────────────────────────────────
function transformNewsItem(item: NewsItem, index: number): NewsUiItem {
  return {
    id: `news-${index}-${item.title.slice(0, 20)}`,
    title: item.title,
    source: item.source,
    time: getRelativeTime(item.publishedDate),
    category: inferCategory(item.symbol),
    impact: inferImpact(item.title),
    summary: item.text || item.title,
    relatedSymbols: item.symbol ? [item.symbol] : [],
    url: item.url,
  };
}

// ── Fallback Mock ─────────────────────────────────────────────
const FALLBACK_NEWS: NewsUiItem[] = [
  {
    id: 'fallback-1',
    title: '연준, 금리 동결 결정... "추가 인하 여지 열어두겠다"',
    source: 'Reuters',
    time: '12분 전',
    category: 'macro',
    impact: 'high',
    summary: '미 연방준비제도가 기준금리를 동결하기로 결정했습니다. 파월 의장은 인플레이션이 2% 목표치를 향해 지속적으로 완화되는 것을 더 봐야 한다고 밝혔습니다.',
    relatedSymbols: ['NQUSD', 'GCUSD'],
    url: '#',
  },
  {
    id: 'fallback-2',
    title: '골드, $4,800 돌파... 중앙은행 매수세 + 지정학 리스크 겹침',
    source: 'Bloomberg',
    time: '28분 전',
    category: 'commodity',
    impact: 'high',
    summary: '금값이 사상 최고치를 경신하며 $4,800을 돌파했습니다. 세계 중앙은행들의 꾸준한 골드 매입과 중동 지정학적 긴장이 상승을 견인하고 있습니다.',
    relatedSymbols: ['GCUSD'],
    url: '#',
  },
  {
    id: 'fallback-3',
    title: '엔비디아, AI 칩 수요 견조... 분기 매출 30% 증가 전망',
    source: 'CNBC',
    time: '1시간 전',
    category: 'tech',
    impact: 'medium',
    summary: '엔비디아가 다음 분기 매출 가이던스를 상향 조정했습니다. 데이터센터 AI 칩 수요가 여전히 공급을 초과하며, 블랙웰 아키텍처 출하량이 가속화되고 있습니다.',
    relatedSymbols: ['NVDA', 'NQUSD'],
    url: '#',
  },
  {
    id: 'fallback-4',
    title: 'WTI 원유, OPEC+ 감산 연장 소식에 $65 회복',
    source: 'Reuters',
    time: '2시간 전',
    category: 'commodity',
    impact: 'medium',
    summary: 'OPEC+가 자발적 감산을 3개월 연장하기로 합의했습니다. 이로 인해 WTI 원유가 $65 수준을 회복했으며, 단기 공급 우려가 완화되었습니다.',
    relatedSymbols: ['CLUSD'],
    url: '#',
  },
  {
    id: 'fallback-5',
    title: '비트코인, 기관 투자자 유입 본격화... ETF 자금 유입 사상 최대',
    source: 'CoinDesk',
    time: '3시간 전',
    category: 'crypto',
    impact: 'high',
    summary: '미국 스팟 비트코인 ETF에 일일 $2.1B 자금이 유입되며 사상 최대 기록을 세웠습니다.',
    relatedSymbols: ['BTCUSD'],
    url: '#',
  },
  {
    id: 'fallback-6',
    title: '애플, AI 기능 탑재 아이폰 17 공급망 물량 20% 증량',
    source: 'Nikkei Asia',
    time: '4시간 전',
    category: 'tech',
    impact: 'low',
    summary: '애플이 아이폰 17 시리즈의 부품 주문량을 전작 대비 20% 늘렸다고 닛케이가 보도했습니다.',
    relatedSymbols: ['AAPL'],
    url: '#',
  },
];

// ── Fear & Greed 게이지 컴포넌트 ──────────────────────────────
function FearGreedGauge() {
  const { data, isLoading } = useFearGreed();

  const value = data?.value ?? 45;
  const classification = data?.valueClassification ?? 'Neutral';
  const subs = data?.subIndicators ?? [];

  // 한국어 분류 매핑
  const classLabelMap: Record<string, string> = {
    'Extreme Fear': '극도 공포',
    'Fear': '공포',
    'Neutral': '중립',
    'Greed': '탐욕',
    'Extreme Greed': '극도 탐욕',
  };
  const krLabel = classLabelMap[classification] ?? classification;

  // 색상 계산: 0(빨강) → 50(노랑) → 100(초록)
  function getGaugeColor(v: number): string {
    if (v <= 20) return '#FF3B3B';
    if (v <= 40) return '#FF6B35';
    if (v <= 60) return '#FFD700';
    if (v <= 80) return '#7CFC00';
    return '#00FF41';
  }

  function getRatingColor(rating: string): string {
    const r = rating.toLowerCase();
    if (r.includes('extreme fear')) return '#FF3B3B';
    if (r.includes('fear')) return '#FF6B35';
    if (r.includes('neutral')) return '#FFD700';
    if (r.includes('extreme greed')) return '#00FF41';
    if (r.includes('greed')) return '#7CFC00';
    return '#888';
  }

  // 이전 값 비교
  const prevClose = data?.previousClose ?? 0;
  const prevWeek = data?.previous1Week ?? 0;
  const prevMonth = data?.previous1Month ?? 0;
  const diffFromClose = prevClose ? Math.round((value - prevClose) * 100) / 100 : 0;

  const gaugeColor = getGaugeColor(value);

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ background: '#111118', border: '1px solid #1A1A1A' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Activity size={12} style={{ color: gaugeColor }} />
        <span className="text-[11px] font-bold text-white">공포 & 탐욕 지수</span>
        <span className="text-[8px] ml-auto font-mono" style={{ color: '#444' }}>CNN</span>
        {isLoading && <Loader2 size={10} className="animate-spin" style={{ color: '#555' }} />}
      </div>

      {/* 값 표시 */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span
          className="text-3xl font-black font-mono"
          style={{ color: gaugeColor }}
        >
          {Math.round(value)}
        </span>
        <span
          className="text-[11px] font-bold"
          style={{ color: gaugeColor }}
        >
          {krLabel}
        </span>
      </div>

      {/* 전일 대비 */}
      {prevClose > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px]" style={{ color: diffFromClose >= 0 ? '#7CFC00' : '#FF6B35' }}>
            전일대비 {diffFromClose >= 0 ? '▲' : '▼'} {Math.abs(diffFromClose).toFixed(1)}
          </span>
          <span className="text-[9px]" style={{ color: '#444' }}>
            1주전 {Math.round(prevWeek)} · 1개월전 {Math.round(prevMonth)}
          </span>
        </div>
      )}

      {/* 가로 막대 게이지 */}
      <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background: '#1A1A1A' }}>
        {/* 그라데이션 배경 */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(to right, #FF3B3B, #FF6B35, #FFD700, #7CFC00, #00FF41)',
            opacity: 0.25,
          }}
        />
        {/* 채워진 영역 */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
          style={{
            width: `${value}%`,
            background: gaugeColor,
            boxShadow: `0 0 8px ${gaugeColor}40`,
          }}
        />
        {/* 현재 값 표시기 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-all duration-700"
          style={{
            left: `calc(${value}% - 5px)`,
            background: '#fff',
            borderColor: gaugeColor,
            boxShadow: `0 0 6px ${gaugeColor}80`,
          }}
        />
      </div>

      {/* 라벨 */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[8px] font-mono" style={{ color: '#FF3B3B' }}>극도공포</span>
        <span className="text-[8px] font-mono" style={{ color: '#FFD700' }}>중립</span>
        <span className="text-[8px] font-mono" style={{ color: '#00FF41' }}>극도탐욕</span>
      </div>

      {/* 서브 지표 */}
      {subs.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #1A1A1A' }}>
          <div className="grid grid-cols-2 gap-1.5">
            {subs.map((sub) => {
              const subColor = getRatingColor(sub.rating);
              return (
                <div key={sub.key} className="flex items-center justify-between py-1">
                  <span className="text-[9px]" style={{ color: '#666' }}>{sub.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold font-mono" style={{ color: subColor }}>
                      {Math.round(sub.score)}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: subColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function NewsPanel() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSource, setActiveSource] = useState('all');

  // 실데이터 조회 (카테고리 필터 적용)
  const { data: apiNews, isLoading } = useNews(
    activeCategory !== 'all'
      ? { category: activeCategory as 'macro' | 'commodity' | 'tech' | 'crypto' }
      : undefined
  );

  // 뉴스 아이템 결정 (실데이터 우선, 없으면 fallback)
  const newsItems: NewsUiItem[] =
    apiNews && apiNews.length > 0
      ? apiNews.map((item, i) => transformNewsItem(item, i))
      : FALLBACK_NEWS;

  // 카테고리 + 출처 필터링
  const filteredNews = newsItems.filter((n) => {
    const catMatch = activeCategory === 'all' || n.category === activeCategory;
    const srcMatch = activeSource === 'all' || matchSource(n.source) === activeSource;
    return catMatch && srcMatch;
  });

  return (
    <div className="flex h-full" style={{ background: '#0A0A0F' }}>
      {/* 메인 뉴스 피드 */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* 헤더 */}
        <div
          className="flex items-center gap-3 px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid #1A1A1A' }}
        >
          <Newspaper size={14} style={{ color: '#00FF41' }} />
          <span className="text-xs font-bold text-white">뉴스룸</span>

          {/* 카테고리 필터 */}
          <div className="flex gap-1.5 ml-3">
            {NEWS_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="text-[9px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-all"
                style={{
                  background: activeCategory === cat.id ? `${cat.color}15` : '#111118',
                  color: activeCategory === cat.id ? cat.color : '#555',
                  border: `1px solid ${activeCategory === cat.id ? `${cat.color}30` : '#1A1A1A'}`,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 로딩 인디케이터 */}
          {isLoading && (
            <Loader2 size={12} className="animate-spin ml-auto" style={{ color: '#00FF41' }} />
          )}
        </div>

        {/* 출처 필터바 */}
        <div
          className="flex items-center gap-2 px-5 py-2 shrink-0 overflow-x-auto"
          style={{ borderBottom: '1px solid #1A1A1A', background: '#0D0D14' }}
        >
          <Filter size={10} style={{ color: '#555' }} />
          {NEWS_SOURCES.map((src) => (
            <button
              key={src.id}
              onClick={() => setActiveSource(src.id)}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-md cursor-pointer transition-all whitespace-nowrap flex items-center gap-1"
              style={{
                background: activeSource === src.id ? '#1A1A2A' : 'transparent',
                color: activeSource === src.id ? '#fff' : '#555',
                border: `1px solid ${activeSource === src.id ? '#333' : 'transparent'}`,
              }}
            >
              <span>{src.icon}</span>
              {src.label}
            </button>
          ))}
        </div>

        {/* 뉴스 리스트 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && filteredNews.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex items-center gap-2" style={{ color: '#555' }}>
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">뉴스 로딩중...</span>
              </div>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center" style={{ color: '#555' }}>
                <Filter size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">해당 출처의 뉴스가 없습니다</p>
                <button
                  onClick={() => setActiveSource('all')}
                  className="text-[10px] mt-2 px-2 py-1 rounded"
                  style={{ color: '#00FF41', border: '1px solid #00FF4130' }}
                >
                  전체 보기
                </button>
              </div>
            </div>
          ) : (
            filteredNews.map((news) => {
              const impactInfo = IMPACT_MAP[news.impact];
              const catInfo = NEWS_CATEGORIES.find((c) => c.id === news.category);

              return (
                <article
                  key={news.id}
                  className="rounded-xl p-4 transition-all cursor-pointer group"
                  style={{ background: '#111118', border: '1px solid #1A1A1A' }}
                  onClick={() => {
                    if (news.url && news.url !== '#') {
                      window.open(news.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  {/* 상단: 임팩트 + 카테고리 + 시간 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
                      style={{ background: impactInfo.bg, color: impactInfo.color }}
                    >
                      <Flame size={8} />
                      임팩트 {impactInfo.label}
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: `${catInfo?.color}10`, color: catInfo?.color }}
                    >
                      {catInfo?.label}
                    </span>
                    <span className="text-[9px] ml-auto flex items-center gap-1" style={{ color: '#444' }}>
                      <Clock size={8} />
                      {news.time}
                    </span>
                  </div>

                  {/* 제목 */}
                  <h3 className="text-sm font-bold text-white mb-2 group-hover:text-green-400 transition-colors leading-snug">
                    {news.url && news.url !== '#' ? (
                      <a href={news.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {news.title}
                      </a>
                    ) : (
                      news.title
                    )}
                  </h3>

                  {/* 요약 */}
                  <p className="text-[11px] leading-relaxed mb-3" style={{ color: '#888' }}>
                    {news.summary}
                  </p>

                  {/* 하단: 관련 심볼 + 소스 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Tag size={9} style={{ color: '#444' }} />
                      {news.relatedSymbols.map((sym) => (
                        <span
                          key={sym}
                          className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded"
                          style={{ background: '#0A0A0F', color: '#00FF41' }}
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-semibold" style={{ color: '#666' }}>{news.source}</span>
                      {news.url && news.url !== '#' && (
                        <ExternalLink size={9} style={{ color: '#333' }} />
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* 오른쪽: Fear & Greed + 트렌딩 + 캘린더 */}
      <div
        className="w-72 shrink-0 flex flex-col p-4 overflow-y-auto"
        style={{ background: '#0A0A0F', borderLeft: '1px solid #1A1A1A' }}
      >
        {/* 공포 & 탐욕 지수 게이지 */}
        <FearGreedGauge />

        {/* 트렌딩 토픽 */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={12} style={{ color: '#00FF41' }} />
            <span className="text-[11px] font-bold text-white">트렌딩 토픽</span>
          </div>
          {[
            { tag: '#FOMC', count: 342, color: '#FF3B3B' },
            { tag: '#골드사상최고', count: 218, color: '#FFD700' },
            { tag: '#NVDA실적', count: 187, color: '#A855F7' },
            { tag: '#OPEC감산', count: 156, color: '#00B4D8' },
            { tag: '#BTC기관유입', count: 134, color: '#FF6B6B' },
          ].map((topic) => (
            <div
              key={topic.tag}
              className="flex items-center gap-2 py-2 px-2.5 rounded-lg mb-1 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <span className="text-[11px] font-bold" style={{ color: topic.color }}>{topic.tag}</span>
              <span className="text-[9px] ml-auto font-mono" style={{ color: '#444' }}>{topic.count} 언급</span>
            </div>
          ))}
        </div>

        {/* 경제 캘린더 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={12} style={{ color: '#FFD700' }} />
            <span className="text-[11px] font-bold text-white">오늘의 일정</span>
          </div>
          {[
            { time: '10:00', event: '한국 수출입', impact: 'medium' as const },
            { time: '17:30', event: '유럽 CPI', impact: 'high' as const },
            { time: '18:00', event: 'FOMC 의사록', impact: 'high' as const },
            { time: '22:30', event: '미국 실업수당청구', impact: 'medium' as const },
            { time: '23:00', event: '미국 PMI', impact: 'high' as const },
          ].map((item) => {
            const imp = IMPACT_MAP[item.impact];
            return (
              <div
                key={item.time + item.event}
                className="rounded-lg p-2.5 mb-2"
                style={{ background: '#111118', border: '1px solid #1A1A1A' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold font-mono" style={{ color: '#555' }}>{item.time} KST</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: imp.color }}
                  />
                </div>
                <div className="text-[11px] font-semibold text-white mt-0.5">{item.event}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
