// SERVER ONLY — do not import from client components
// Z.AI Web Search API — 실시간 금융 뉴스 + 시장 정보 검색
// 3티어: 웹검색 요약은 GLM-4.5-Air 한국어 배치 번역

import { WebSearchResult, NewsItem } from './types';

const ZAI_API_KEY = process.env.ZAI_API_KEY || '';
const ZAI_BASE = 'https://open.bigmodel.cn/api/paas/v4';

// 한국어 금융 검색을 위한 쿼리 빌더
function buildFinancialQuery(symbol: string, label: string): string {
  const queries: Record<string, string> = {
    'GCUSD': `${label} 금 선물 시장 분석 뉴스`,
    'CLUSD': `${label} 원유 시장 분석 뉴스`,
    'NQUSD': `${label} 나스닥 선물 시장 분석 뉴스`,
    'AAPL': `${label} 애플 주식 실적 분석`,
    'NVDA': `${label} 엔비디아 AI칩 수요 분석`,
    'TSLA': `${label} 테슬라 주식 뉴스`,
  };
  return queries[symbol] || `${symbol} 주식 시장 뉴스 분석`;
}

// Z.AI Web Search API 호출
export async function webSearch(
  query: string,
  count = 10
): Promise<WebSearchResult[]> {
  if (!ZAI_API_KEY) return [];

  try {
    const res = await fetch(`${ZAI_BASE}/web_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZAI_API_KEY}`,
      },
      body: JSON.stringify({
        search_engine: 'search-prime',
        search_query: query,
        count,
      }),
    });

    if (!res.ok) {
      console.warn(`Z.AI Web Search error: ${res.status}`);
      return [];
    }

    const data = await res.json();

    if (!data?.search_result?.length) return [];

    return data.search_result.map((item: Record<string, string>) => ({
      title: item.title || '',
      url: item.url || item.link || '',
      snippet: item.content || item.snippet || item.summary || '',
      siteName: item.site_name || item.source || '',
      publishedDate: item.published_date || item.date || '',
    }));
  } catch (err) {
    console.warn('Z.AI Web Search failed:', err);
    return [];
  }
}

// 종목별 금융 뉴스 검색 (FMP 뉴스 보완용)
export async function searchFinancialNews(
  symbol: string,
  label: string
): Promise<WebSearchResult[]> {
  const query = buildFinancialQuery(symbol, label);
  return webSearch(query, 8);
}

// 글로벌 시장 뉴스 검색 (뉴스룸용)
export async function searchMarketNews(
  category: 'macro' | 'commodity' | 'tech' | 'crypto'
): Promise<WebSearchResult[]> {
  const queries: Record<string, string> = {
    macro: '글로벌 거시경제 Fed 금리 인플레이션 뉴스',
    commodity: '골드 원유 원자재 시장 뉴스 분석',
    tech: '빅테크 AI 반도체 주식 시장 뉴스',
    crypto: '비트코인 암호화폐 시장 뉴스 분석',
  };
  return webSearch(queries[category] || queries.macro, 12);
}

// Web Search in Chat — LLM이 검색 결과를 요약+인용해서 응답
export async function webSearchInChat(
  query: string,
  userMessage: string
): Promise<{ answer: string; sources: WebSearchResult[] }> {
  if (!ZAI_API_KEY) return { answer: '', sources: [] };

  try {
    const res = await fetch(`${ZAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZAI_API_KEY}`,
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      body: JSON.stringify({
        model: 'glm-4.5-air',
        messages: [
          {
            role: 'system',
            content: '너는 한국어 금융 분석가야. 웹 검색 결과를 바탕으로 정확한 정보를 한국어로 요약해. 출처를 반드시 인용해.',
          },
          { role: 'user', content: userMessage },
        ],
        tools: [
          {
            type: 'web_search',
            web_search: {
              enable: true,
              search_query: query,
            },
          },
        ],
        max_tokens: 2048,
        temperature: 0.6,
        stream: false,
      }),
    });

    if (!res.ok) return { answer: '', sources: [] };

    const data = await res.json();
    const message = data.choices?.[0]?.message;

    return {
      answer: message?.content || '',
      sources: message?.web_search_results?.map((r: Record<string, string>) => ({
        title: r.title || '',
        url: r.url || r.link || '',
        snippet: r.content || r.snippet || '',
        siteName: r.site_name || r.source || '',
      })) || [],
    };
  } catch (err) {
    console.warn('Z.AI Web Search in Chat failed:', err);
    return { answer: '', sources: [] };
  }
}

// ══════════════════════════════════════════════════════════════
//  FMP 영어 뉴스 → GLM-4.5-Air 한국어 배치 번역
// ══════════════════════════════════════════════════════════════
export async function translateNewsToKorean(
  newsItems: NewsItem[]
): Promise<NewsItem[]> {
  if (!ZAI_API_KEY || newsItems.length === 0) return newsItems;

  // 이미 한국어인 항목은 스킵
  const needsTranslation = newsItems.filter(isLikelyEnglish);
  const alreadyKorean = newsItems.filter((n) => !isLikelyEnglish(n));

  if (needsTranslation.length === 0) return newsItems;

  try {
    const itemsJson = needsTranslation.map((n, i) => ({
      index: i,
      title: n.title,
      text: n.text.slice(0, 300),
    }));

    const res = await fetch(`${ZAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZAI_API_KEY}`,
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      body: JSON.stringify({
        model: 'glm-4.5-air',
        messages: [
          {
            role: 'system',
            content: `너는 금융 뉴스 전문 번역가야. 영어 뉴스 제목과 요약을 자연스러운 한국어 경제/금융 용어로 번역해.

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트는 절대 포함하지 마:
{"translations":[{"index":0,"title":"번역된 제목","text":"번역된 요약"}]}

규칙:
- 금융 전문 용어는 한국 외신 경제지 스타일로 번역
- 숫자, 심볼, 퍼센트는 그대로 유지
- title은 간결하고 임팩트 있게
- text는 핵심 내용을 1~2문장으로 요약
- JSON 외 텍스트 절대 금지`,
          },
          {
            role: 'user',
            content: JSON.stringify(itemsJson),
          },
        ],
        max_tokens: 2048,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      console.warn('뉴스 번역 API 에러:', res.status);
      return newsItems;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    if (!content) return newsItems;

    const parsed = JSON.parse(content);
    const translations: Array<{ index: number; title: string; text: string }> =
      parsed.translations || parsed.items || (Array.isArray(parsed) ? parsed : []);

    if (!Array.isArray(translations) || translations.length === 0) return newsItems;

    const translated = needsTranslation.map((item, i) => {
      const t = translations.find((tr) => tr.index === i);
      if (t && t.title) {
        return { ...item, title: t.title, text: t.text || item.text };
      }
      return item;
    });

    return [...translated, ...alreadyKorean];
  } catch (err) {
    console.warn('뉴스 번역 실패:', err);
    return newsItems;
  }
}

function isLikelyEnglish(item: NewsItem): boolean {
  const sample = (item.title + ' ' + item.text).slice(0, 100);
  const koreanChars = (sample.match(/[가-힣]/g) || []).length;
  const englishChars = (sample.match(/[a-zA-Z]/g) || []).length;
  return englishChars > koreanChars * 2 && englishChars > 10;
}
