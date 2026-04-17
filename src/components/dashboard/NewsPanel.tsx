'use client';

import { Newspaper, ExternalLink, Clock, Flame, TrendingUp, Tag } from 'lucide-react';

const NEWS_CATEGORIES = [
  { id: 'all', label: '전체', color: '#00FF41' },
  { id: 'macro', label: '거시경제', color: '#00B4D8' },
  { id: 'commodities', label: '원자재', color: '#FFD700' },
  { id: 'tech', label: '테크', color: '#A855F7' },
  { id: 'crypto', label: '암호화폐', color: '#FF6B6B' },
];

const MOCK_NEWS = [
  {
    id: 1,
    title: '연준, 금리 동결 결정... "추가 인상 여지 열어두겠다"',
    source: 'Reuters',
    time: '12분 전',
    category: 'macro',
    impact: 'high' as const,
    summary: '미 연방준비제도가 기준금리를 5.25-5.50%로 동결하기로 결정했습니다. 파월 의장은 "인플레이션이 2% 목표치를 향해 지속적으로 완화되는 것을 더 봐야 한다"고 밝혔습니다.',
    relatedSymbols: ['NQUSD', 'GCUSD'],
  },
  {
    id: 2,
    title: '골드, $4,800 돌파... 중앙은행 매수세 + 지정학 리스크 겹침',
    source: 'Bloomberg',
    time: '28분 전',
    category: 'commodities',
    impact: 'high' as const,
    summary: '금값이 사상 최고치를 경신하며 $4,800을 돌파했습니다. 세계 중앙은행들의 꾸준한 골드 매입과 중동 지정학적 긴장이 상승을 견인하고 있습니다.',
    relatedSymbols: ['GCUSD'],
  },
  {
    id: 3,
    title: '엔비디아, AI 칩 수요 견조... 분기 매출 30% 증가 전망',
    source: 'CNBC',
    time: '1시간 전',
    category: 'tech',
    impact: 'medium' as const,
    summary: '엔비디아가 다음 분기 매출 가이던스를 상향 조정했습니다. 데이터센터 AI 칩 수요가 여전히 공급을 초과하며, 블랙웰 아키텍처 출하량이 가속화되고 있습니다.',
    relatedSymbols: ['NVDA', 'NQUSD'],
  },
  {
    id: 4,
    title: 'WTI 원유, OPEC+ 감산 연장 소식에 $65 회복',
    source: 'Energy Voice',
    time: '2시간 전',
    category: 'commodities',
    impact: 'medium' as const,
    summary: 'OPEC+가 자발적 감산을 3개월 연장하기로 합의했습니다. 이로 인해 WTI 원유가 $65 수준을 회복했으며, 단기 공급 우려가 완화되었습니다.',
    relatedSymbols: ['CLUSD'],
  },
  {
    id: 5,
    title: '비트코인, 기관 투자자 유입 본격화... ETF 자금 유입 사상 최대',
    source: 'CoinDesk',
    time: '3시간 전',
    category: 'crypto',
    impact: 'high' as const,
    summary: '미국 스팟 비트코인 ETF에 일일 $2.1B 자금이 유입되며 사상 최대 기록을 세웠습니다. 블록바이브와 피델리티가 가장 큰 유입을 기록했습니다.',
    relatedSymbols: ['BTCUSD'],
  },
  {
    id: 6,
    title: '애플, AI 기능 탑재 아이폰 17 공급망 물량 20% 증량',
    source: 'Nikkei Asia',
    time: '4시간 전',
    category: 'tech',
    impact: 'low' as const,
    summary: '애플이 아이폰 17 시리즈의 부품 주문량을 전작 대비 20% 늘렸다고 닛케이가 보도했습니다. 온디바이스 AI 기능에 대한 소비자 반응이 긍정적이기 때문으로 분석됩니다.',
    relatedSymbols: ['AAPL'],
  },
];

const IMPACT_MAP = {
  high: { label: '높음', color: '#FF3B3B', bg: 'rgba(255,59,59,0.1)' },
  medium: { label: '보통', color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
  low: { label: '낮음', color: '#555', bg: 'rgba(85,85,85,0.1)' },
};

export default function NewsPanel() {
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
                className="text-[9px] font-bold px-2 py-1 rounded-lg cursor-pointer"
                style={{
                  background: cat.id === 'all' ? `${cat.color}15` : '#111118',
                  color: cat.id === 'all' ? cat.color : '#555',
                  border: `1px solid ${cat.id === 'all' ? `${cat.color}30` : '#1A1A1A'}`,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 뉴스 리스트 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {MOCK_NEWS.map((news) => {
            const impactInfo = IMPACT_MAP[news.impact];
            const catInfo = NEWS_CATEGORIES.find((c) => c.id === news.category);

            return (
              <article
                key={news.id}
                className="rounded-xl p-4 transition-all cursor-pointer group"
                style={{ background: '#111118', border: '1px solid #1A1A1A' }}
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
                  {news.title}
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
                    <span className="text-[9px]" style={{ color: '#444' }}>{news.source}</span>
                    <ExternalLink size={9} style={{ color: '#333' }} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* 오른쪽: 트렌딩 + 캘린더 */}
      <div
        className="w-72 shrink-0 flex flex-col p-4 overflow-y-auto"
        style={{ background: '#0A0A0F', borderLeft: '1px solid #1A1A1A' }}
      >
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
