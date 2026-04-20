// SERVER ONLY — do not import from client components
// AI Client — DeepSeek V3.2 (1순위) → GLM-5 (2순위) → 규칙기반
// DeepSeek: 빠르고 정확한 V3.2 모델 (속도 우선)
// GLM-5: 깊은 추론 Thinking Mode (품질 백업)

import { AiSignalResult, WebSearchResult, getPredictionType } from './types';

// ===== API Keys =====
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const ZAI_API_KEY = process.env.ZAI_API_KEY || '';

// ===== Endpoints =====
const DEEPSEEK_BASE = 'https://api.deepseek.com';
const ZAI_BASE = 'https://open.bigmodel.cn/api/paas/v4';

// 채팅용 모델 (zai-agent.ts에서 import)
export const MODEL_CHAT = 'glm-4.5-air';  // 채팅 — 한국어 content 정상 출력

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

// ===== 1순위: DeepSeek V3.2 (속도 우선) =====
async function callDeepSeekSignal(
  userPrompt: string
): Promise<AiSignalResult | null> {
  if (!DEEPSEEK_API_KEY) return null;

  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SIGNAL_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.6,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      console.warn(`DeepSeek V3.2 error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    if (!content) return null;

    const parsed = JSON.parse(extractJson(content));
    return { ...mapParsedResult(parsed), model: 'DeepSeek V3.2' };
  } catch (err) {
    console.warn('DeepSeek V3.2 call failed:', err);
    return null;
  }
}

// ===== 2순위: Z.AI GLM-5 (Thinking Mode + Structured Output) =====
async function callZaiGLM(
  userPrompt: string,
  withThinking = true
): Promise<AiSignalResult | null> {
  if (!ZAI_API_KEY) return null;

  try {
    const body: Record<string, unknown> = {
      model: 'glm-5',
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
      console.warn(`Z.AI GLM-5 error: ${res.status}`);
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

    return { ...mapParsedResult(parsed), model: 'GLM-5', reasoning };
  } catch (err) {
    console.warn('Z.AI GLM-5 call failed:', err);
    return null;
  }
}

// Z.AI GLM-5 스트리밍 호출 (Thinking Mode 포함)
export async function callZaiGLMStream(
  userPrompt: string,
  onThinking: (chunk: string) => void,
  onContent: (chunk: string) => void,
  withThinking = true
): Promise<string> {
  if (!ZAI_API_KEY) throw new Error('ZAI_API_KEY not set');

  const body: Record<string, unknown> = {
    model: 'glm-5',
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

// ===== 공통 유틸 =====

// 파싱 결과 → AiSignalResult 매핑
function mapParsedResult(parsed: Record<string, unknown>): Omit<AiSignalResult, 'model'> {
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
    buyProbability: Number(parsed.buyProbability) || (signalType === 'LONG' ? confidence : 100 - confidence),
    sellProbability: Number(parsed.sellProbability) || (signalType === 'SHORT' ? confidence : 100 - confidence),
    riskRewardRatio: Number(parsed.riskRewardRatio) || 0,
    predictionType: String(parsed.predictionType || ''),
    reasoning: '',
    sources: [],
  };
}

function extractJson(text: string): string {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON');
  return m[0];
}

// ===== GLM-5V-Turbo 비전 분석 (차트 스크린샷 → 매매 시그널) =====
export async function analyzeChartWithVision(
  imageBase64: string,
  symbol: string,
  timeframe: string = '1hour'
): Promise<AiSignalResult> {
  if (!ZAI_API_KEY) {
    throw new Error('ZAI_API_KEY not set — GLM-5V-Turbo requires Z.AI API key');
  }

  const visionPrompt = `너는 한국 전문 트레이더 AI 분석가야. 이 차트 이미지를 분석해서 매매 시그널을 생성해.

종목: ${symbol}
시간프레임: ${timeframe}

차트의 기술적 패턴, 트렌드, 지지/저항선, 볼륨 등을 시각적으로 분석하고 반드시 아래 JSON 형식으로만 응답해:
{
  "entryPrice": 숫자,
  "targetPrice": 숫자,
  "stopLoss": 숫자,
  "confidence": 숫자(0~100),
  "rationale": "차트에서 관찰한 패턴과 시그널을 한국어로 2~3문장 설명",
  "timeframe": "단기:1시간~3일 / 중기:1주~1개월",
  "signalType": "LONG" 또는 "SHORT",
  "buyProbability": 숫자(0~100),
  "sellProbability": 숫자(0~100),
  "riskRewardRatio": 숫자,
  "predictionType": "다음 봉 예측" 또는 "현재봉 마감",
  "chartPatterns": ["관찰된 차트 패턴 목록"],
  "keyLevels": { "support": 숫자, "resistance": 숫자 }
}

규칙:
- rationale은 반드시 한국어
- JSON 외 텍스트 절대 금지
- buyProbability + sellProbability = 100
- confidence는 차트 패턴의 명확성 기준`;


  try {
    const body: Record<string, unknown> = {
      model: 'glm-5v-turbo',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:image/png;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: visionPrompt,
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.4,
      thinking: { type: 'enabled' },
    };

    const res = await fetch(`${ZAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`GLM-5V-Turbo error: ${res.status}`, errText);
      throw new Error(`GLM-5V-Turbo API error: ${res.status}`);
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    if (!message) throw new Error('No response from GLM-5V-Turbo');

    const reasoning = message.reasoning_content || '';
    const content = message.content || '';
    const parsed = JSON.parse(extractJson(content));

    return {
      ...mapParsedResult(parsed),
      model: 'GLM-5V-Turbo (Vision)',
      reasoning,
    };
  } catch (err) {
    console.error('GLM-5V-Turbo vision analysis failed:', err);
    throw err;
  }
}

// 이미지 URL로 비전 분석 (공개 이미지용)
export async function analyzeChartFromUrl(
  imageUrl: string,
  symbol: string,
  timeframe: string = '1hour'
): Promise<AiSignalResult> {
  if (!ZAI_API_KEY) {
    throw new Error('ZAI_API_KEY not set');
  }

  const visionPrompt = `너는 한국 전문 트레이더 AI 분석가야. 이 차트 이미지를 분석해서 매매 시그널을 생성해.

종목: ${symbol}
시간프레임: ${timeframe}

차트의 기술적 패턴, 트렌드, 지지/저항선, 볼륨 등을 시각적으로 분석하고 반드시 아래 JSON 형식으로만 응답해:
{
  "entryPrice": 숫자,
  "targetPrice": 숫자,
  "stopLoss": 숫자,
  "confidence": 숫자(0~100),
  "rationale": "차트에서 관찰한 패턴과 시그널을 한국어로 2~3문장 설명",
  "timeframe": "단기:1시간~3일 / 중기:1주~1개월",
  "signalType": "LONG" 또는 "SHORT",
  "buyProbability": 숫자(0~100),
  "sellProbability": 숫자(0~100),
  "riskRewardRatio": 숫자,
  "predictionType": "다음 봉 예측" 또는 "현재봉 마감"
}

규칙: rationale은 반드시 한국어, JSON 외 텍스트 절대 금지, buyProbability + sellProbability = 100`;

  try {
    const body: Record<string, unknown> = {
      model: 'glm-5v-turbo',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
            {
              type: 'text',
              text: visionPrompt,
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.4,
      thinking: { type: 'enabled' },
    };

    const res = await fetch(`${ZAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`GLM-5V-Turbo API error: ${res.status}`);

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    if (!message) throw new Error('No response');

    const reasoning = message.reasoning_content || '';
    const content = message.content || '';
    const parsed = JSON.parse(extractJson(content));

    return {
      ...mapParsedResult(parsed),
      model: 'GLM-5V-Turbo (Vision)',
      reasoning,
    };
  } catch (err) {
    console.error('GLM-5V-Turbo URL analysis failed:', err);
    throw err;
  }
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

  // 1순위: DeepSeek V3.2 (빠르고 정확)
  const dsResult = await callDeepSeekSignal(userPrompt);
  if (dsResult) {
    if (ctx.webSearchResults?.length) {
      dsResult.sources = ctx.webSearchResults.slice(0, 5).map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
      }));
    }
    return dsResult;
  }

  // 2순위: Z.AI GLM-5 (Thinking Mode + 깊은 추론)
  const zaiResult = await callZaiGLM(userPrompt, true);
  if (zaiResult) {
    if (ctx.webSearchResults?.length) {
      zaiResult.sources = ctx.webSearchResults.slice(0, 5).map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
      }));
    }
    return zaiResult;
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
