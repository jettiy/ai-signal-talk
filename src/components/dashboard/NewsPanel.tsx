'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Activity, Clock, ExternalLink, Loader2, Newspaper } from 'lucide-react';
import { useNews } from '@/hooks/useNews';
import { useFearGreed } from '@/hooks/useFearGreed';
import { useEconomicCalendar } from '@/hooks/useEconomicCalendar';
import type { EconomicCalendarItem, NewsItem } from '@/lib/types';

const NEWS_CATEGORIES = [
  { id: 'all', label: '전체', color: '#00FF41' },
  { id: 'macro', label: '거시경제', color: '#00B4D8' },
  { id: 'commodity', label: '원자재', color: '#FFD700' },
  { id: 'tech', label: '테크', color: '#A855F7' },
  { id: 'crypto', label: '암호화폐', color: '#FF6B6B' },
];

const CATEGORY_HEADLINES: Record<string, string> = {
  all: '주요 뉴스 헤드라인',
  macro: '거시경제 · 금리 · 인플레이션',
  commodity: '원자재 · 골드 · 원유',
  tech: '빅테크 · AI · 반도체',
  crypto: '암호화폐 · 블록체인',
};

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

function inferCategory(symbol = '', title = ''): string {
  const text = `${symbol} ${title}`.toLowerCase();
  if (['gcusd', 'clusd', 'gold', 'oil', 'wti', 'crude', 'commodity'].some((key) => text.includes(key))) return 'commodity';
  if (['aapl', 'nvda', 'tsla', 'meta', 'msft', 'amzn', 'googl', 'ai', 'chip', 'semiconductor'].some((key) => text.includes(key))) return 'tech';
  if (['btcusd', 'ethusd', 'bitcoin', 'ethereum', 'crypto'].some((key) => text.includes(key))) return 'crypto';
  return 'macro';
}

function inferImpact(title: string): 'high' | 'medium' | 'low' {
  const normalized = title.toLowerCase();
  const highKeywords = ['fed', 'fomc', 'cpi', 'ppi', 'pce', 'payroll', 'unemployment', 'crash', 'surge', 'plunge', 'record', 'war', 'tariff'];
  if (highKeywords.some((keyword) => normalized.includes(keyword))) return 'high';
  return 'medium';
}

function getRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return '';
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${diffDay}일 전`;
}

function transformNewsItem(item: NewsItem, index: number): NewsUiItem {
  return {
    id: `news-${index}-${item.title.slice(0, 20)}`,
    title: item.title,
    source: item.source || 'Market',
    time: getRelativeTime(item.publishedDate),
    category: inferCategory(item.symbol, item.title),
    impact: inferImpact(item.title),
    summary: item.text || item.title,
    relatedSymbols: item.symbol ? [item.symbol] : [],
    url: item.url,
    image: item.image || '',
  };
}

function NewsLink({ url, children }: { url: string; children: React.ReactNode }) {
  return url && url !== '#' && url.startsWith('http')
    ? <a href={url} target="_blank" rel="noopener noreferrer" className="block no-underline">{children}</a>
    : <div className="block">{children}</div>;
}

function ImpactBadge({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-600/20 text-red-400 border-red-500/30',
    medium: 'bg-zinc-700/50 text-zinc-300 border-zinc-500/30',
    low: 'bg-green-900/30 text-green-400 border-green-500/30',
  };
  const labels = { high: '중요', medium: '보통', low: '낮음' };
  return (
    <span className={`border text-[10px] px-2 py-1 rounded font-bold ${styles[impact]}`}>
      {labels[impact]}
    </span>
  );
}

function TranslationLoadingCard() {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-[#00FF41]/15 bg-[#00FF41]/5">
      <div className="text-center">
        <Loader2 size={26} className="mx-auto mb-3 animate-spin text-[#00FF41]" />
        <p className="text-sm font-black text-[#00FF41]">AI가 뉴스를 번역 중입니다</p>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          글로벌 뉴스 원문을 수집하고 한국어로 정리하는 중입니다.
        </p>
      </div>
    </div>
  );
}

function FearGreedCard() {
  const { data, isLoading } = useFearGreed();
  const value = data?.value ?? 45;
  const classification = data?.valueClassification ?? 'Neutral';
  const source = data?.source || 'CNN Business';
  const sourceUrl = data?.sourceUrl || 'https://www.cnn.com/markets/fear-and-greed';

  const classLabelMap: Record<string, string> = {
    'Extreme Fear': '극도 공포',
    Fear: '공포',
    Neutral: '중립',
    Greed: '탐욕',
    'Extreme Greed': '극도 탐욕',
  };
  const krLabel = classLabelMap[classification] ?? classification;

  const gaugeColor = value <= 20 ? '#FF3B3B' : value <= 40 ? '#FF6B35' : value <= 60 ? '#FFD700' : value <= 80 ? '#7CFC00' : '#00FF41';

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#121212] p-5">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="border-l-4 border-zinc-500 pl-2 text-sm font-bold text-white">시장 심리 지표</h3>
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-[#00FF41]">
          {source}
          <ExternalLink size={10} />
        </a>
      </div>
      {isLoading ? (
        <div className="flex h-20 items-center justify-center">
          <Loader2 size={20} className="animate-spin text-zinc-600" />
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-sm font-semibold text-zinc-300">공포 & 탐욕 지수</span>
            <span className="font-mono text-3xl font-bold" style={{ color: gaugeColor }}>{Math.round(value)}</span>
          </div>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: gaugeColor, boxShadow: `0 0 8px ${gaugeColor}40` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">극도의 공포</span>
            <span className="text-[10px] font-semibold" style={{ color: gaugeColor }}>{krLabel}</span>
            <span className="text-[10px] text-zinc-500">탐욕</span>
          </div>
        </>
      )}
    </div>
  );
}

function formatEventTime(date: string) {
  return new Date(date).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function EconomicIndicatorsCard() {
  const { data = [], isLoading } = useEconomicCalendar();
  const sourceUrl = data[0]?.sourceUrl || 'https://site.financialmodelingprep.com/developer/docs/economic-calendar-api';
  const source = data[0]?.source || 'Financial Modeling Prep';

  const actualColor = (item: EconomicCalendarItem) => {
    if (item.actual === '-') return 'text-zinc-500';
    if (item.impact === 'high') return 'text-[#00FF41]';
    if (item.impact === 'medium') return 'text-zinc-200';
    return 'text-zinc-400';
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#121212] p-5">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="border-l-4 border-[#00FF41] pl-2 text-sm font-bold text-white">미국 경제 지표</h3>
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-[#00FF41]">
          {source}
          <ExternalLink size={10} />
        </a>
      </div>
      <div className="mb-3 flex justify-between border-b border-zinc-800 pb-2 text-[10px] text-zinc-500">
        <span>지표</span>
        <div className="flex space-x-5">
          <span className="w-10 text-right">실제</span>
          <span className="w-10 text-right">예측</span>
        </div>
      </div>
      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 size={18} className="animate-spin text-zinc-600" />
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          {data.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate font-semibold text-zinc-200">{item.event}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-500">
                  <span>{formatEventTime(item.date)} KST</span>
                  <span className={item.impact === 'high' ? 'text-red-400' : item.impact === 'medium' ? 'text-yellow-400' : 'text-zinc-500'}>
                    {{ high: '중요', medium: '보통', low: '낮음' }[item.impact] || item.impact}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 space-x-5 font-mono">
                <span className={`w-10 text-right ${actualColor(item)}`}>{item.actual}</span>
                <span className="w-10 text-right text-zinc-400">{item.estimate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewsPanel() {
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: apiNews, isLoading } = useNews(
    activeCategory !== 'all'
      ? { category: activeCategory as 'macro' | 'commodity' | 'tech' | 'crypto' }
      : undefined
  );

  const rawItems: NewsUiItem[] =
    apiNews && apiNews.length > 0
      ? apiNews
          .map((item, i) => transformNewsItem(item, i))
          .filter((news) => news.url && news.url !== '#' && news.url.startsWith('http'))
      : [];

  const filteredNews = rawItems.filter((news) =>
    activeCategory === 'all' || news.category === activeCategory
  );

  const heroNews = filteredNews[0];
  const subNews = filteredNews.slice(1);
  const headline = CATEGORY_HEADLINES[activeCategory] || CATEGORY_HEADLINES.all;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8" style={{ background: '#09090b' }}>
      <div className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#00FF41]/30 bg-zinc-800/50 px-3 py-1 text-xs font-semibold text-[#00FF41]">
          <Activity size={12} />
          실시간 인텔리전스 피드
        </div>
        <h1 className="mb-2 text-3xl font-bold text-white lg:text-4xl">글로벌 뉴스 센터</h1>
        <p className="text-sm text-zinc-400">주요 경제 뉴스는 AI가 한국어로 번역하고, 지표 데이터는 출처와 함께 표시합니다.</p>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {NEWS_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: activeCategory === cat.id ? `${cat.color}15` : 'transparent',
              color: activeCategory === cat.id ? cat.color : '#71717a',
              border: `1px solid ${activeCategory === cat.id ? `${cat.color}30` : 'transparent'}`,
            }}
          >
            {cat.label}
          </button>
        ))}
        {isLoading && <Loader2 size={14} className="ml-auto animate-spin text-[#00FF41]" />}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col space-y-6">
          <div className="flex items-end justify-between border-b border-zinc-800 pb-2">
            <h2 className="border-l-4 border-red-500 pl-2 text-lg font-bold text-white">{headline}</h2>
            <span className="text-xs text-zinc-500">
              {filteredNews.length > 0 && `${filteredNews[0].time} 업데이트됨`}
            </span>
          </div>

          {isLoading && filteredNews.length === 0 ? (
            <TranslationLoadingCard />
          ) : filteredNews.length === 0 ? (
            <div className="flex h-60 items-center justify-center rounded-xl border border-zinc-800 bg-[#121212]">
              <div className="text-center text-zinc-500">
                <Newspaper size={24} className="mx-auto mb-3" />
                <p className="text-sm">해당 카테고리의 뉴스가 없습니다.</p>
                <button
                  onClick={() => setActiveCategory('all')}
                  className="mt-3 rounded border border-[#00FF41]/30 px-3 py-1 text-xs text-[#00FF41] transition hover:bg-[#00FF41]/10"
                >
                  전체 보기
                </button>
              </div>
            </div>
          ) : (
            <>
              {heroNews && (
                <NewsLink url={heroNews.url}>
                  <div className="group overflow-hidden rounded-xl border border-zinc-800 bg-[#121212] transition hover:border-zinc-500">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative h-48 min-h-[200px] w-full bg-zinc-800 md:h-auto md:w-2/5">
                        {heroNews.image ? (
                          <Image src={heroNews.image} alt={heroNews.title} fill sizes="(max-width: 768px) 100vw, 32vw" className="object-cover" unoptimized />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute left-4 top-4">
                          <ImpactBadge impact={heroNews.impact} />
                        </div>
                        <ExternalLink size={14} className="absolute bottom-3 right-3 text-zinc-500" />
                      </div>
                      <div className="flex w-full flex-col justify-center p-6 md:w-3/5">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold">
                          <span className="text-red-500">{heroNews.source.toUpperCase()}</span>
                          <span className="text-zinc-500">{heroNews.time}</span>
                        </div>
                        <h3 className="mb-3 text-xl font-bold leading-tight text-white transition group-hover:text-[#00FF41] lg:text-2xl">
                          {heroNews.title}
                        </h3>
                        <p className="mb-4 line-clamp-3 text-sm text-zinc-400">{heroNews.summary}</p>
                        {heroNews.relatedSymbols.length > 0 && (
                          <div className="mt-auto flex items-center gap-2">
                            <span className="text-xs text-zinc-500">자산 영향:</span>
                            {heroNews.relatedSymbols.map((sym) => (
                              <span key={sym} className="rounded border border-[#00FF41]/30 bg-green-900/30 px-2 py-1 text-xs text-[#00FF41]">
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

              {subNews.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {subNews.map((news) => (
                    <NewsLink key={news.id} url={news.url}>
                      <div className="group h-full overflow-hidden rounded-xl border border-zinc-800 bg-[#121212] transition hover:border-zinc-500">
                        {news.image && (
                          <div className="relative h-32 w-full overflow-hidden">
                            <Image src={news.image} alt={news.title} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-500">{news.source.toUpperCase()}</span>
                            <ImpactBadge impact={news.impact} />
                          </div>
                          <h4 className="mb-2 text-base font-bold leading-snug text-white transition group-hover:text-[#00FF41] lg:text-lg">
                            {news.title}
                          </h4>
                          <p className="line-clamp-2 text-xs text-zinc-400">{news.summary}</p>
                          <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
                            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                              <Clock size={10} />
                              {news.time}
                            </div>
                            {news.relatedSymbols.length > 0 && (
                              <div className="flex gap-1">
                                {news.relatedSymbols.map((sym) => (
                                  <span key={sym} className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
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

        <div className="flex w-full shrink-0 flex-col space-y-6 lg:w-80">
          <EconomicIndicatorsCard />
          <FearGreedCard />
        </div>
      </div>
    </div>
  );
}
