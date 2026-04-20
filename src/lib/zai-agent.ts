// SERVER ONLY — do not import from client components
// Z.AI Function Calling Agent — 채팅봇이 FMP 실시간 데이터 + 웹검색을 자동 호출
// "골드 지금 어뭐?" → get_quote("GCUSD") → 실시간 가격 기반 응답

import { ChatMessage, ToolCall } from './types';
import { getQuotes } from './fmp';
import { webSearch } from './zai-web-search';
import { MODEL_CHAT } from './ai';

const ZAI_API_KEY = process.env.ZAI_API_KEY || '';
const ZAI_BASE = 'https://open.bigmodel.cn/api/paas/v4';

// Function Calling 도구 정의
const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_quote',
      description: '종목의 실시간 시세를 조회합니다. 현재가, 전일대비, 거래량 등을 반환합니다.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: '조회할 종목 심볼 (예: GCUSD=골드, AAPL=애플, NVDA=엔비디아)',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_multi_quotes',
      description: '여러 종목의 실시간 시세를 한 번에 조회합니다.',
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'array',
            items: { type: 'string' },
            description: '조회할 종목 심볼 배열 (예: ["GCUSD", "AAPL", "NVDA"])',
          },
        },
        required: ['symbols'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: '웹에서 최신 금융 뉴스와 시장 정보를 검색합니다. 실시간 데이터가 필요할 때 사용하세요.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '검색할 키워드 (예: "골드 선물 시장 전망", "Fed 금리 결정")',
          },
        },
        required: ['query'],
      },
    },
  },
];

// 도구 실행 함수
async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case 'get_quote': {
        const symbol = String(args.symbol || '');
        const quotes = await getQuotes([symbol]);
        if (quotes.length === 0) return JSON.stringify({ error: '시세를 찾을 수 없습니다.' });
        const q = quotes[0];
        return JSON.stringify({
          symbol: q.symbol,
          price: q.price,
          change: q.change,
          changePct: q.changesPercentage,
          dayHigh: q.dayHigh,
          dayLow: q.dayLow,
          volume: q.volume,
        });
      }
      case 'get_multi_quotes': {
        const symbols = (args.symbols as string[]) || [];
        const quotes = await getQuotes(symbols);
        return JSON.stringify(
          quotes.map((q) => ({
            symbol: q.symbol,
            price: q.price,
            change: q.change,
            changePct: q.changesPercentage,
          }))
        );
      }
      case 'web_search': {
        const query = String(args.query || '');
        const results = await webSearch(query, 5);
        return JSON.stringify(
          results.map((r) => ({
            title: r.title,
            snippet: r.snippet,
            url: r.url,
            source: r.siteName,
          }))
        );
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: `Tool execution failed: ${err}` });
  }
}

// 채팅 에이전트 메인 함수
export async function chatWithAgent(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatMessage> {
  if (!ZAI_API_KEY) {
    return {
      role: 'assistant',
      content: '죄송합니다, 현재 AI 서비스를 사용할 수 없습니다.',
    };
  }

  const systemMessage: ChatMessage = {
    role: 'system',
    content: `너는 AI 시그널톡의 트레이딩 어시스턴트야. 한국어로 친절하게 답변해.

사용 가능한 도구:
- get_quote: 특정 종목의 실시간 시세 조회
- get_multi_quotes: 여러 종목 시세 동시 조회
- web_search: 최신 금융 뉴스 검색

규칙:
- 시세나 뉴스 질문이 오면 반드시 도구를 호출해서 실시간 데이터를 확인해
- 추측으로 답변하지 말고, 항상 실제 데이터를 기반으로 답해
- 한국어로 자연스럽게 대화해
- 전문적이면서도 이해하기 쉽게 설명해`,
  };

  const messages: ChatMessage[] = [
    systemMessage,
    ...conversationHistory.slice(-10), // 최근 10턴 유지
    { role: 'user', content: userMessage },
  ];

  try {
    // 1차 호출: 도구 사용 여부 판단
    const res = await fetch(`${ZAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZAI_API_KEY}`,
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      body: JSON.stringify({
        model: MODEL_CHAT,
        messages,
        tools: AGENT_TOOLS,
        tool_choice: 'auto',
        max_tokens: 2048,
        temperature: 0.6,
        stream: false,
      }),
    });

    if (!res.ok) {
      return { role: 'assistant', content: 'AI 서비스 응답 오류가 발생했습니다.' };
    }

    const data = await res.json();
    const assistantMessage = data.choices?.[0]?.message;

    if (!assistantMessage) {
      return { role: 'assistant', content: '응답을 생성할 수 없습니다.' };
    }

    // 도구 호출이 없으면 바로 반환
    if (!assistantMessage.tool_calls?.length) {
      return {
        role: 'assistant',
        content: assistantMessage.content || '',
        reasoning_content: assistantMessage.reasoning_content || undefined,
      };
    }

    // 도구 호출 실행
    messages.push({
      role: 'assistant',
      content: assistantMessage.content || '',
      tool_calls: assistantMessage.tool_calls,
    });

    for (const toolCall of assistantMessage.tool_calls) {
      const fn = toolCall.function;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(fn.arguments);
      } catch {
        args = {};
      }

      const result = await executeTool(fn.name, args);

      messages.push({
        role: 'tool',
        content: result,
        tool_call_id: toolCall.id,
      });
    }

    // 2차 호출: 도구 결과 기반 최종 응답
    const finalRes = await fetch(`${ZAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZAI_API_KEY}`,
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      body: JSON.stringify({
        model: MODEL_CHAT,
        messages,
        tools: AGENT_TOOLS,
        max_tokens: 2048,
        temperature: 0.6,
        stream: false,
      }),
    });

    if (!finalRes.ok) {
      return { role: 'assistant', content: '최종 응답 생성 중 오류가 발생했습니다.' };
    }

    const finalData = await finalRes.json();
    const finalMessage = finalData.choices?.[0]?.message;

    return {
      role: 'assistant',
      content: finalMessage?.content || '',
      reasoning_content: finalMessage?.reasoning_content || undefined,
    };
  } catch (err) {
    console.error('Chat agent error:', err);
    return {
      role: 'assistant',
      content: '죄송합니다, 응답 생성 중 오류가 발생했습니다.',
    };
  }
}
