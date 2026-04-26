'use client';

import { useState } from 'react';
import { Clock, Loader2, Activity, ExternalLink } from 'lucide-react';
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

// ── 카테고리 헤드라인 ──────────────────────────────────────────
const CATEGORY_HEADLINES: Record<string, string> = {
  all: '주요 뉴스 헤드라인',
  macro: '거시경제 · 금리 · 인플레이션',
  commodity: '원자재 · 골드 · 원유',
  tech: '빅테크 · AI · 반도체',
  crypto: '암호화폐 · 블록체인 · 디파이',
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
  if (highKeywords.some(kw => title.includes(kw))) return 'high';
  return 'medium';
}

// ── 날짜 → 상대 시간 ────────────────────────────────────────
function getRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
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
  image: string;
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
    image: item.image || '',
  };
}

// ── NewsLink 컴포넌트 ────────────────────────────────────────
function NewsLink({ url, children }: { url: string; children: React.ReactNode }) {
  return url && url !== '#' && url.startsWith('http')
    ? <a href={url} target="_blank" rel="noopener noreferrer" className="block no-underline">{children}</a>
    : <div className="block">{children}</div>;
}

// ── 임팩트 배지 컴포넌트 ──────────────────────────────────────
function ImpactBadge({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  if (impact === 'high') {
    return (
      <span className="bg-red-600/20 text-red-500 border border-red-500/30 text-[10px] px-2 py-1 rounded font-bold">
        HIGH
      </span>
    );
  }
  if (impact === 'medium') {
    return (
      <span className="bg-zinc-700/50 text-zinc-300 border border-zinc-500/30 text-[10px] px-2 py-1 rounded font-bold">
        MEDIUM
      </span>
    );
  }
  return (
    <span className="bg-green-900/30 text-green-400 border border-green-500/30 text-[10px] px-2 py-1 rounded font-bold">
      LOW
    </span>
  );
}

// ── 히어로 임팩트 배지 ──────────────────────────────────────
function HeroImpactBadge({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  if (impact === 'high') {
    return (
      <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
        CRITICAL
      </span>
    );
  }
  return (
    <span className="absolute top-4 left-4 bg-zinc-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
      {impact === 'medium' ? 'IMPORTANT' : 'INFO'}
    </span>
  );
}

// ── 공포 & 탐욕 게이지 (사이드바용) ──────────────────────────
function FearGreedCard() {
  const { data, isLoading } = useFearGreed();
  const value = data?.value ?? 45;
  const classification = data?.valueClassification ?? 'Neutral';

  const classLabelMap: Record<string, string> = {
    'Extreme Fear': '극도 공포',
    'Fear': '공포',
    'Neutral': '중립',
    'Greed': '탐욕',
    'Extreme Greed': '극도 탐욕',
  };
  const krLabel = classLabelMap[classification] ?? classification;

  function getGaugeColor(v: number): string {
    if (v <= 20) return '#FF3B3B';
    if (v <= 40) return '#FF6B35';
    if (v <= 60) return '#FFD700';
    if (v <= 80) return '#7CFC00';
    return '#00FF41';
  }

  const gaugeColor = getGaugeColor(value);

  return (
    <div className="bg-[#121212] border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-bold border-l-4 border-zinc-500 pl-2 mb-4">시장 심리 지표</h3>
      {isLoading ? (
        <div className="flex items-center justify-center h-20">
          <Loader2 size={20} className="animate-spin text-zinc-600" />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-zinc-300">공포 & 탐욕 지수</span>
            <span className="text-3xl font-bold font-mono" style={{ color: gaugeColor }}>
              {Math.round(value)}
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${value}%`,
                background: gaugeColor,
                boxShadow: `0 0 8px ${gaugeColor}40`,
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-500">극도의 공포</span>
            <span className="text-[10px] font-semibold" style={{ color: gaugeColor }}>{krLabel}</span>
            <span className="text-[10px] text-zinc-500">탐욕</span>
          </div>
        </>
      )}
    </div>
  );
}

// ── 경제 지표 카드 ──────────────────────────────────────────
function EconomicIndicatorsCard() {
  const indicators = [
    { name: '소비자물가지수 (전년)', sub: '소비자 물가 지수', actual: '3.4%', forecast: '3.2%', type: 'bad' as const },
    { name: '비농업 고용 지표', sub: '고용 변화', actual: '175K', forecast: '243K', type: 'good' as const },
    { name: '실업률', sub: '노동 시장', actual: '3.9%', forecast: '3.8%', type: 'neutral' as const },
  ];

  const actualColor = (type: 'good' | 'bad' | 'neutral') => {
    if (type === 'good') return 'text-[#00FF00]';
    if (type === 'bad') return 'text-red-500';
    return 'text-zinc-200';
  };

  return (
    <div className="bg-[#121212] border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-bold border-l-4 border-[#00FF00] pl-2 mb-4">미국 경제 지표</h3>
      <div className="flex justify-between text-[10px] text-zinc-500 border-b border-zinc-800 pb-2 mb-3">
        <span>지표</span>
        <div className="flex space-x-6">
          <span className="w-8 text-right">실제</span>
          <span className="w-8 text-right">예측</span>
        </div>
      </div>
      <div className="space-y-4 text-sm">
        {indicators.map((ind) => (
          <div key={ind.name} className="flex justify-between items-center">
            <div>
              <div className="font-semibold text-zinc-200">{ind.name}</div>
              <div className="text-[10px] text-zinc-500">{ind.sub}</div>
            </div>
            <div className="flex space-x-6">
              <span className={`w-8 text-right ${actualColor(ind.type)}`}>{ind.actual}</span>
              <span className="w-8 text-right text-zinc-400">{ind.forecast}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function NewsPanel() {
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: apiNews, isLoading, isError } = useNews(
    activeCategory !== 'all'
      ? { category: activeCategory as 'macro' | 'commodity' | 'tech' | 'crypto' }
      : undefined
  );

  // FMP + 웹검색에서 가져온 실데이터만 사용. 하드코딩 폴백 없음.
  const rawItems: NewsUiItem[] =
    apiNews && apiNews.length > 0
      ? apiNews
          .map((item, i) => transformNewsItem(item, i))
          .filter((n) => n.url && n.url !== '#' && n.url.startsWith('http'))
      : [];

  const filteredNews = rawItems.filter((n) =>
    activeCategory === 'all' || n.category === activeCategory
  );

  const heroNews = filteredNews[0];
  const subNews = filteredNews.slice(1);
  const headline = CATEGORY_HEADLINES[activeCategory] || CATEGORY_HEADLINES.all;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8" style={{ background: '#09090b' }}>
      {/* 스크롤바 스타일 */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
      `}</style>

      {/* ── 타이틀 섹션 ────────────────────────────── */}
      <div className="mb-6">
        <div className="inline-block px-3 py-1 rounded-full bg-zinc-800/50 border border-[#00FF00]/30 text-[#00FF00] text-xs font-semibold mb-3">
          ● 실시간 인텔리전스 피드
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-white">글로벌 뉴스 센터</h1>
        <p className="text-zinc-400 text-sm">전 세계 주요 경제 및 지정학적 뉴스를 실시간으로 전해드립니다.</p>
      </div>

      {/* ── 카테고리 탭바 ──────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        {NEWS_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            style={{
              background: activeCategory === cat.id ? `${cat.color}15` : 'transparent',
              color: activeCategory === cat.id ? cat.color : '#71717a',
              border: `1px solid ${activeCategory === cat.id ? `${cat.color}30` : 'transparent'}`,
            }}
          >
            {cat.label}
          </button>
        ))}
        {isLoading && <Loader2 size={14} className="animate-spin ml-auto" style={{ color: '#00FF41' }} />}
      </div>

      {/* ── 메인 레이아웃: 뉴스 + 사이드바 ──────────── */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 좌측: 뉴스 영역 */}
        <div className="flex-1 flex flex-col space-y-6 min-w-0">
          {/* 헤드라인 바 */}
          <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
            <h2 className="text-lg font-bold border-l-4 border-red-500 pl-2 text-white">{headline}</h2>
            <span className="text-xs text-zinc-500">
              {filteredNews.length > 0 && filteredNews[0].time} 업데이트됨
            </span>
          </div>

          {/* 로딩 */}
          {isLoading && filteredNews.length === 0 ? (
            <div className="flex items-center justify-center h-60">
              <div className="flex items-center gap-2 text-zinc-500">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">뉴스 로딩중...</span>
              </div>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="flex items-center justify-center h-60">
              <div className="text-center text-zinc-500">
                <p className="text-sm">해당 카테고리의 뉴스가 없습니다</p>
                <button
                  onClick={() => setActiveCategory('all')}
                  className="text-xs mt-2 px-3 py-1 rounded text-[#00FF00] border border-[#00FF00]/30 hover:bg-[#00FF00]/10 transition cursor-pointer"
                >
                  전체 보기
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ── 히어로 뉴스 카드 ──────────────────── */}
              {heroNews && (
                <NewsLink url={heroNews.url}>
                  <div className="block bg-[#121212] border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-500 transition cursor-pointer group">
                    <div className="flex flex-col md:flex-row">
                      {/* 이미지/플레이스홀더 */}
                      <div className="w-full md:w-2/5 bg-zinc-800 relative h-48 md:h-auto min-h-[200px]">
                        {heroNews.image ? (
                          <img
                            src={heroNews.image}
                            alt={heroNews.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <HeroImpactBadge impact={heroNews.impact} />
                        <div className="absolute bottom-3 right-3">
                          <ExternalLink size={14} className="text-zinc-500" />
                        </div>
                      </div>
                      {/* 콘텐츠 */}
                      <div className="w-full md:w-3/5 p-6 flex flex-col justify-center">
                        <div className="flex items-center space-x-2 text-xs font-bold mb-2">
                          <span className="text-red-500">{heroNews.source.toUpperCase()}</span>
                          <span className="text-zinc-500">{heroNews.time}</span>
                        </div>
                        <h3 className="text-xl lg:text-2xl font-bold mb-3 group-hover:text-[#00FF00] transition text-white leading-tight">
                          {heroNews.title}
                        </h3>
                        <p className="text-zinc-400 text-sm mb-4 line-clamp-3">{heroNews.summary}</p>
                        {heroNews.relatedSymbols.length > 0 && (
                          <div className="flex items-center space-x-2 mt-auto">
                            <span className="text-xs text-zinc-500">자산 영향:</span>
                            {heroNews.relatedSymbols.map((sym) => (
                              <span
                                key={sym}
                                className="bg-green-900/30 text-[#00FF00] border border-[#00FF00]/30 text-xs px-2 py-1 rounded"
                              >
                                {sym}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </NewsLink>
              )}

              {/* ── 서브 뉴스 그리드 ──────────────────── */}
              {subNews.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subNews.map((news) => (
                    <NewsLink key={news.id} url={news.url}>
                      <div className="block bg-[#121212] border border-zinc-800 rounded-xl hover:border-zinc-500 transition group h-full overflow-hidden">
                        {news.image && (
                          <div className="w-full h-32 overflow-hidden">
                            <img
                              src={news.image}
                              alt={news.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-zinc-500 text-xs font-bold">{news.source.toUpperCase()}</span>
                            <ImpactBadge impact={news.impact} />
                          </div>
                          <h4 className="text-base lg:text-lg font-bold mb-2 group-hover:text-[#00FF00] transition text-white leading-snug">
                            {news.title}
                          </h4>
                          <p className="text-zinc-400 text-xs line-clamp-2">{news.summary}</p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                            <div className="flex items-center gap-1 text-zinc-500 text-[10px]">
                              <Clock size={10} />
                              {news.time}
                            </div>
                            {news.relatedSymbols.length > 0 && (
                              <div className="flex gap-1">
                                {news.relatedSymbols.map((sym) => (
                                  <span key={sym} className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                                    {sym}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </NewsLink>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── 우측 사이드바 ────────────────────────── */}
        <div className="w-full lg:w-80 flex flex-col space-y-6 shrink-0">
          <EconomicIndicatorsCard />
          <FearGreedCard />
        </div>
      </div>
    </div>
  );
}
