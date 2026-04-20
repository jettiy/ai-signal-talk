// SERVER ONLY — do not import from client components
// AI Client — 3티어 전략: GLM-5(시그널) + GLM-5-Turbo(채팅) + GLM-4.7-FlashX(요약)
// + MiniMax/DeepSeek/GPT-4o (폴백 체인)

import { AiSignalResult, WebSearchResult, getPredictionType } from './types';

// ===== Z.AI (3티어) =====
const ZAI_API_KEY = process.env.ZAI_API_KEY || '';
const ZAI_BASE = 'https://open.bigmodel.cn/api/paas/v4';

// 티어별 모델명
export const MODEL_SIGNAL = 'glm-5';      // AI 시그널 — 깊은 추론, 품질 우선
export const MODEL_CHAT = 'glm-5-turbo';  // 채팅 에이전트 — Function Calling 최적화, 속도 우선

// 시스템 프롬프트 (Context Caching 대상 — 반복 사용)
const SIGNAL_SYSTEM_PROMPT = `너는 한국 전문 트레이더 AI 분석가야. 주어진 종목의 실시간 시세, 뉴스, 기술적 지표를 종합 분석해서 매매 시그널을 생성해.

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트는 절대 포함하지 마:
{
  "entryPrice": 숫자,
  "targetPrice": 숫자,
  "stopLoss": 숫자,
  "confidence": 숫자(0~100),
  "rationale": "한국어로 2~3문장 분석 요약",
  "timeframe": "단기:1시간~3일 / 중기:1주~1개월",
  "signalType": "LONG" 또는 "SHORT",
  "buyProbability": 숫자(0~100),
  "sellProbability": 숫자(0~100),
  "riskRewardRatio": 숫자,
  "predictionType": "다음 봉 예측" 또는 "현재봉 마감"
}

규칙:
- rationale은 반드시 한국어로 작성
- JSON 외 텍스트 절대 금지
- buyProbability + sellProbability = 100
- confidence 70 이상일 때만 LONG/SHORT 제공
- riskRewardRatio = |targetPrice - entryPrice| / |entryPrice - stopLoss|
- 단기(1분/5분)는 "다음 봉 예측", 중장기(15분 이상)는 "현재봉 마감"`;

function buildUserPrompt(
  symbol: string,
  price: number,
  news: { title: string; text: string; source: string }[],
  changePct: number,
  timeframe: string,
  webSearchResults?: WebSearchResult[]
): string {
  const newsSection = news
    .slice(0, 5)
    .map((n, i) => `[${i + 1}] [${n.source}] ${n.title}\n   ${n.text.slice(0, 200)}`)
    .join('\n');

  const webSection = webSearchResults?.length
    ? `\n\n웹 검색 최신 정보:\n${webSearchResults
        .slice(0, 5)
        .map((r, i) => `[${i + 1}] [${r.siteName}] ${r.title}\n   ${r.snippet}`)
        .join('\n')}`
    : '';

  const predictionType = getPredictionType(timeframe);

  return `종목: ${symbol}
현재가: $${price}
전일 대비: ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%
시간프레임: ${timeframe}
예측유형: ${predictionType}

최근 뉴스:
${newsSection || '최근 주요 뉴스 없음'}${webSection}

위 데이터를 종합 분석해서 매매 시그널을 생성해.`;
}

// Z.AI GLM-5.1 호출 (Thinking Mode + Structured Output)
async function callZaiGLM(
  userPrompt: string,
  withThinking = true
): Promise<AiSignalResult | null> {
  if (!ZAI_API_KEY) return null;

  try {
    const body: Record<string, unknown> = {
      model: MODEL_SIGNAL,
      messages: [
        { role: 'system', content: SIGNAL_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
      temperature: 0.6,
      stream: false,
      response_format: { type: 'json_object' },
    };

    // Thinking Mode 활성화
    if (withThinking) {
      body.thinking = { type: 'enabled' };
    }

    const res = await fetch(`${ZAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZAI_API_KEY}`,
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn(`Z.AI GLM-5.1 error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    if (!message) return null;

    // Thinking Mode 추론 내용 추출
    const reasoning = message.reasoning_content || '';

    // Structured Output에서 JSON 파싱
    const content = message.content || '';
    const parsed = JSON.parse(extractJson(content));

    return {
      entryPrice: Number(parsed.entryPrice) || 0,
      targetPrice: Number(parsed.targetPrice) || 0,
      stopLoss: Number(parsed.stopLoss) || 0,
      confidence: Number(parsed.confidence) || 50,
      rationale: parsed.rationale || '',
      timeframe: parsed.timeframe || '단기:1시간~3일',
      signalType: parsed.signalType === 'LONG' ? 'LONG' : 'SHORT',
      model: 'GLM-5',
      // Z.AI 확장 필드
      buyProbability: Number(parsed.buyProbability) || 50,
      sellProbability: Number(parsed.sellProbability) || 50,
      riskRewardRatio: Number(parsed.riskRewardRatio) || 0,
      predictionType: parsed.predictionType || '',
      reasoning,
      sources: [],
    };
  } catch (err) {
    console.warn('Z.AI GLM-5.1 call failed:', err);
    return null;
  }
}

// Z.AI GLM-5.1 스트리밍 호출 (Thinking Mode 포함)
export async function callZaiGLMStream(
  userPrompt: string,
  onThinking: (chunk: string) => void,
  onContent: (chunk: string) => void,
  withThinking = true
): Promise<string> {
  if (!ZAI_API_KEY) throw new Error('ZAI_API_KEY not set');

  const body: Record<string, unknown> = {
    model: MODEL_SIGNAL,
    messages: [
      { role: 'system', content: SIGNAL_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 4096,
    temperature: 0.6,
    stream: true,
    response_format: { type: 'json_object' },
  };

  if (withThinking) {
    body.thinking = { type: 'enabled' };
  }

  const res = await fetch(`${ZAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZAI_API_KEY}`,
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Z.AI stream error: ${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split('\n').filter((l) => l.startsWith('data: '));

    for (const line of lines) {
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') continue;

      try {
        const chunk = JSON.parse(jsonStr);
        const delta = chunk.choices?.[0]?.delta;

        if (delta?.reasoning_content) {
          onThinking(delta.reasoning_content);
        }
        if (delta?.content) {
          onContent(delta.content);
          fullContent += delta.content;
        }
      } catch {
        // 스트리밍 청크 파싱 실패 시 무시
      }
    }
  }

  return fullContent;
}

// ===== 기존 폴백 모델 (유지) =====

async function callMinimax(prompt: string): Promise<AiSignalResult | null> {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion_pro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'MiniMax-Text-01', messages: [{ role: 'user', content: prompt }], max_tokens: 1024, temperature: 0.3 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(extractJson(data.choices?.[0]?.message?.content || '{}'));
    return { ...mapLegacyResult(parsed), model: 'MiniMax MiMo' };
  } catch { return null; }
}

async function callDeepSeek(prompt: string): Promise<AiSignalResult | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 1024, temperature: 0.3 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(extractJson(data.choices?.[0]?.message?.content || '{}'));
    return { ...mapLegacyResult(parsed), model: 'DeepSeek' };
  } catch { return null; }
}

async function callOpenAI(prompt: string): Promise<AiSignalResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 1024, temperature: 0.3 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(extractJson(data.choices?.[0]?.message?.content || '{}'));
    return { ...mapLegacyResult(parsed), model: 'GPT-4o' };
  } catch { return null; }
}

// 기존 폴백 결과 → 확장 스키마 매핑
function mapLegacyResult(parsed: Record<string, unknown>): Omit<AiSignalResult, 'model'> {
  const signalType = parsed.signalType === 'LONG' ? 'LONG' : 'SHORT';
  const confidence = Number(parsed.confidence) || 50;
  return {
    entryPrice: Number(parsed.entryPrice) || 0,
    targetPrice: Number(parsed.targetPrice) || 0,
    stopLoss: Number(parsed.stopLoss) || 0,
    confidence,
    rationale: String(parsed.rationale || ''),
    timeframe: String(parsed.timeframe || '단기:1시간~3일'),
    signalType,
    buyProbability: signalType === 'LONG' ? confidence : 100 - confidence,
    sellProbability: signalType === 'SHORT' ? confidence : 100 - confidence,
    riskRewardRatio: 0,
    predictionType: '',
    reasoning: '',
    sources: [],
  };
}

function extractJson(text: string): string {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON');
  return m[0];
}

// ===== 메인 시그널 생성 함수 =====
export async function generateAiSignal(ctx: {
  symbol: string;
  price: number;
  changePct: number;
  news: { title: string; text: string; source: string }[];
  timeframe?: string;
  webSearchResults?: WebSearchResult[];
}): Promise<AiSignalResult> {
  const timeframe = ctx.timeframe || '1hour';
  const userPrompt = buildUserPrompt(
    ctx.symbol,
    ctx.price,
    ctx.news,
    ctx.changePct,
    timeframe,
    ctx.webSearchResults
  );

  // 1순위: Z.AI GLM-5.1 (Thinking Mode + Structured Output)
  const zaiResult = await callZaiGLM(userPrompt, true);
  if (zaiResult) {
    // 웹검색 소스 첨부
    if (ctx.webSearchResults?.length) {
      zaiResult.sources = ctx.webSearchResults.slice(0, 5).map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
      }));
    }
    return zaiResult;
  }

  // 2~4순위: 기존 폴백 체인 (MiniMax → DeepSeek → GPT-4o)
  const legacyPrompt = buildUserPrompt(ctx.symbol, ctx.price, ctx.news, ctx.changePct, timeframe);
  const fallbacks = await Promise.allSettled([
    callMinimax(legacyPrompt),
    callDeepSeek(legacyPrompt),
    callOpenAI(legacyPrompt),
  ]);

  for (const r of fallbacks) {
    if (r.status === 'fulfilled' && r.value) {
      // 폴백 결과에도 웹검색 소스 첨부
      if (ctx.webSearchResults?.length) {
        r.value.sources = ctx.webSearchResults.slice(0, 5).map((s) => ({
          title: s.title,
          url: s.url,
          snippet: s.snippet,
        }));
      }
      return r.value;
    }
  }

  // 최종 폴백: 규칙 기반
  const { symbol, price, changePct } = ctx;
  const isUp = changePct >= 0;
  return {
    entryPrice: +(price * (isUp ? 1.002 : 0.998)).toFixed(2),
    targetPrice: +(price * (isUp ? 1.03 : 0.97)).toFixed(2),
    stopLoss: +(price * (isUp ? 0.985 : 1.015)).toFixed(2),
    confidence: Math.floor(50 + Math.random() * 30),
    rationale: isUp
      ? `현재 ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}% 상승 중. 단기 모멘텀이 강하나, 주요 저항선 돌파 여부를 확인해야 한다.`
      : `현재 ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}% 하락 중. 단기 모멘텀이 약하며, 지지선 테스트 가능성이 있다.`,
    timeframe: '단기:1시간~3일',
    signalType: isUp ? 'LONG' : 'SHORT',
    model: 'Fallback (No API Key)',
    buyProbability: isUp ? 65 : 35,
    sellProbability: isUp ? 35 : 65,
    riskRewardRatio: isUp
      ? +((price * 1.03 - price * 1.002) / (price * 1.002 - price * 0.985)).toFixed(2)
      : +((price * 0.998 - price * 0.97) / (price * 1.015 - price * 0.998)).toFixed(2),
    predictionType: getPredictionType(timeframe),
    reasoning: '',
    sources: [],
  };
}
