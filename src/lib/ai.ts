// SERVER ONLY — do not import from client components
// AI Client — GLM 5.1 (1순위) → DeepSeek V4 Pro (2순위) → 규칙기반
// GLM 5.1: Z.AI Coding Plan Max 무료, Thinking Mode + 깊은 추론
// DeepSeek V4 Pro: 1M 컨텍스트, 고성능 백업

import { AiSignalResult, WebSearchResult, getPredictionType } from './types';

// ETF 심볼 매핑 (AI 프롬프트에서 ETF 이름 표시용)
const ETF_MAP: Record<string, string> = {
  KOSPI: '',
  NQUSD: 'QQQ',
  GCUSD: 'GLD',
  CLUSD: 'USO',
};

// ===== API Keys =====
const ZAI_API_KEY = process.env.ZAI_API_KEY || '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

// ===== Endpoints =====
const ZAI_BASE = 'https://open.bigmodel.cn/api/paas/v4';
const DEEPSEEK_BASE = 'https://api.deepseek.com';

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
|- riskRewardRatio = |targetPrice - entryPrice| / |entryPrice - stopLoss|
|- 단기(1분/5분)는 "다음 봉 예측", 중장기(15분 이상)는 "현재봉 마감"
|- 국내선물(KOSPI)은 한국 시장 기준, 해외선물(NQ/GC/CL)은 미국 시장 기준으로 분석
|- 국내선물 가격은 USD가 아닌 KRW 기준(KOSPI=2650.30)으로 계산`;

function buildUserPrompt(
  symbol: string,
  price: number,
  news: { title: string; text: string; source: string }[],
  changePct: number,
  timeframe: string,
  webSearchResults?: WebSearchResult[],
  indicators?: Record<string, unknown>
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

  // 기술적 지표 섹션
  let indicatorSection = '';
  if (indicators) {
    const parts: string[] = [];
    if (indicators.rsi) {
      const r = indicators.rsi as any;
      parts.push(`RSI(14): ${r.value} [${r.signal}]`);
    }
    if (indicators.macd) {
      const m = indicators.macd as any;
      parts.push(`MACD: ${m.macd} / Signal: ${m.signal} / Histogram: ${m.histogram} [${m.crossover}]`);
    }
    if (indicators.bb) {
      const b = indicators.bb as any;
      parts.push(`Bollinger: Upper=${b.upper} Mid=${b.middle} Lower=${b.lower} %B=${b.percentB} [${b.position}]`);
    }
    if (indicators.stoch) {
      const s = indicators.stoch as any;
      parts.push(`Stochastic: %K=${s.k} %D=${s.d} [${s.signal}]`);
    }
    if (indicators.ema20) parts.push(`EMA(20): ${indicators.ema20}`);
    if (indicators.sma50) parts.push(`SMA(50): ${indicators.sma50}`);
    if (indicators.sma200) parts.push(`SMA(200): ${indicators.sma200}`);
    if (parts.length > 0) {
      indicatorSection = `\n\n기술적 지표 (실시간):\n${parts.join('\n')}`;
    }
  }

  const predictionType = getPredictionType(timeframe);

  // 규칙 엔진 결과 섹션 (indicators에서 수치적 분석)
  let ruleEngineSection = '';
  if (indicators) {
    const rsi = typeof indicators.rsi === 'object' ? (indicators.rsi as any).value : Number(indicators.rsi) || 50;
    const macdHist = typeof indicators.macd === 'object' ? (indicators.macd as any).histogram : Number(indicators.macd) || 0;
    const close = price;
    const ema20 = Number(indicators.ema20) || close;
    const ema50 = Number(indicators.sma50) || close;
    const ema200 = Number(indicators.sma200) || close;
    const atr = typeof indicators.bb === 'object' ? Math.abs(Number((indicators.bb as any).upper) - Number((indicators.bb as any).lower)) / 2 : close * 0.01;
    // 모멘텀 점수: RSI 기반
    const rsiScore = (rsi - 50) / 50;
    const macdSign = macdHist >= 0 ? 1 : -1;
    const momentum = 0.6 * rsiScore + 0.4 * macdSign;
    // 추세 점수: EMA 비교
    const above20 = close > ema20 ? 1 : -1;
    const above50 = close > ema50 ? 1 : -1;
    const above200 = close > ema200 ? 1 : -1;
    const trend = (above20 + above50 + above200) / 3;
    // 롱 확률
    const pLong = Math.max(0, Math.min(100, 50 + 50 * (0.5 * trend + 0.5 * momentum)));
    const direction = pLong >= 50 ? 'LONG' : 'SHORT';
    const prob = direction === 'LONG' ? pLong : 100 - pLong;
    // ATR 기반 진입/손절/목표
    const stopDist = Math.max(atr * 1.5, close * 0.005);
    const takeDist = Math.max(atr * 2.0, close * 0.01);
    let entry = close, stopLoss = 0, takeProfit = 0;
    if (direction === 'LONG') {
      stopLoss = +(entry - stopDist).toFixed(2);
      takeProfit = +(entry + takeDist).toFixed(2);
    } else {
      stopLoss = +(entry + stopDist).toFixed(2);
      takeProfit = +(entry - takeDist).toFixed(2);
    }
    const rr = stopLoss !== 0 && stopLoss !== entry ? +(Math.abs(takeProfit - entry) / Math.abs(entry - stopLoss)).toFixed(2) : 1.5;
    const evidence: string[] = [];
    evidence.push(`RSI(14)=${rsi.toFixed(1)} (${rsi > 70 ? '과매수' : rsi < 30 ? '과매도' : '중립'})`);
    evidence.push(`MACD Histogram=${macdHist.toFixed(2)} (${macdHist > 0 ? '상승 모멘텀' : '하락 모멘텀'})`);
    if (close > ema20 && close > ema50) evidence.push('가격이 EMA20·EMA50 위 → 상승 추세');
    else if (close < ema20 && close < ema50) evidence.push('가격이 EMA20·EMA50 아래 → 하락 추세');
    else evidence.push('가격이 EMA20·50 엇갈림 → 혼조');
    ruleEngineSection = `\n\n[규칙 엔진 분석 결과]\n방향: ${direction}, 확률: ${prob.toFixed(1)}%\n진입: $${entry.toFixed(2)}, 손절: $${stopLoss}, 목표: $${takeProfit}\n리스크/리워드: ${rr}\n근거: ${evidence.join(', ')}\n\n⚠️ 위 규칙 엔진 수치를 참고하여 시그널을 생성하세요. 수치와 크게 어긋나는 경우 근거를 명확히 설명하세요.`;
  }

  return `종목: ${symbol} (ETF: ${ETF_MAP[symbol] || symbol})
현재가: $${price}
전일 대비: ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%
시간프레임: ${timeframe}
예측유형: ${predictionType}

최근 뉴스:
${newsSection || '최근 주요 뉴스 없음'}${webSection}${indicatorSection}

위 데이터를 종합 분석해서 매매 시그널을 생성해. 가격은 ETF 실제 가격($${price}) 기준으로 entryPrice, stopLoss, targetPrice를 설정해.${ruleEngineSection}`;
}

// ===== 1순위: GLM 5.1 (Z.AI Coding Plan Max — 무료, Thinking Mode) =====
async function callZaiGLM51(
  userPrompt: string,
  withThinking = true
): Promise<AiSignalResult | null> {
  if (!ZAI_API_KEY) return null;

  try {
    const body: Record<string, unknown> = {
      model: 'glm-5.1',
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
      console.warn(`GLM 5.1 error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    if (!message) return null;

    // Thinking Mode 추론 내용 추출
    const reasoning = message.reasoning_content || '';

    // Structured Output에서 JSON 파싱
    const content = message.content || '';
    if (!content) {
      // reasoning 모델에서 content가 비어있는 경우 reasoning에서 폴백
      if (reasoning) {
        try {
          const parsed = JSON.parse(extractJson(reasoning));
          return { ...mapParsedResult(parsed), model: 'GLM 5.1', reasoning };
        } catch {
          return null;
        }
      }
      return null;
    }
    const parsed = JSON.parse(extractJson(content));

    return { ...mapParsedResult(parsed), model: 'GLM 5.1', reasoning };
  } catch (err) {
    console.warn('GLM 5.1 call failed:', err);
    return null;
  }
}

// ===== 2순위: DeepSeek V4 Pro (1M 컨텍스트, 고성능 폴백) =====
async function callDeepSeekV4Pro(
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
        model: 'deepseek-v4-pro',
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
      console.warn(`DeepSeek V4 Pro error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    if (!content) return null;

    const parsed = JSON.parse(extractJson(content));
    return { ...mapParsedResult(parsed), model: 'DeepSeek V4 Pro' };
  } catch (err) {
    console.warn('DeepSeek V4 Pro call failed:', err);
    return null;
  }
}

// GLM 5.1 스트리밍 호출 (Thinking Mode 포함)
export async function callZaiGLM51Stream(
  userPrompt: string,
  onThinking: (chunk: string) => void,
  onContent: (chunk: string) => void,
  withThinking = true
): Promise<string> {
  if (!ZAI_API_KEY) throw new Error('ZAI_API_KEY not set');

  const body: Record<string, unknown> = {
    model: 'glm-5.1',
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

  if (!res.ok) throw new Error(`GLM 5.1 stream error: ${res.status}`);

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

// ===== 메인 AI 시그널 생성 함수 (GLM 5.1 → DeepSeek V4 Pro 폴백) =====
export async function generateSignal(
  symbol: string,
  price: number,
  news: { title: string; text: string; source: string }[],
  changePct: number,
  timeframe: string,
  webSearchResults?: WebSearchResult[],
  indicators?: Record<string, unknown>
): Promise<AiSignalResult | null> {
  const userPrompt = buildUserPrompt(symbol, price, news, changePct, timeframe, webSearchResults, indicators);

  // 1순위: GLM 5.1
  console.log(`[AI Signal] GLM 5.1 호출: ${symbol}/${timeframe}`);
  const glmResult = await callZaiGLM51(userPrompt);
  if (glmResult) {
    console.log(`[AI Signal] GLM 5.1 성공: ${glmResult.signalType} (${glmResult.confidence}%)`);
    return glmResult;
  }

  // 2순위: DeepSeek V4 Pro 폴백
  console.warn(`[AI Signal] GLM 5.1 실패 → DeepSeek V4 Pro 폴백: ${symbol}/${timeframe}`);
  const dsResult = await callDeepSeekV4Pro(userPrompt);
  if (dsResult) {
    console.log(`[AI Signal] DeepSeek V4 Pro 성공: ${dsResult.signalType} (${dsResult.confidence}%)`);
    return dsResult;
  }

  // 최종 폴백: 규칙 엔진 기반 시그널
  console.warn(`[AI Signal] 모든 AI 모델 실패 → 규칙 엔진 폴백`);
  return generateFallbackSignal(symbol, price, changePct, timeframe, indicators);
}

// ===== 규칙 엔진 폴백 =====
function generateFallbackSignal(
  symbol: string,
  price: number,
  changePct: number,
  timeframe: string,
  indicators?: Record<string, unknown>
): AiSignalResult | null {
  if (!indicators) return null;

  const rsi = typeof indicators.rsi === 'object' ? (indicators.rsi as any).value : Number(indicators.rsi) || 50;
  const macdHist = typeof indicators.macd === 'object' ? (indicators.macd as any).histogram : Number(indicators.macd) || 0;
  const close = price;
  const ema20 = Number(indicators.ema20) || close;
  const ema50 = Number(indicators.sma50) || close;
  const ema200 = Number(indicators.sma200) || close;
  const atr = typeof indicators.bb === 'object'
    ? Math.abs(Number((indicators.bb as any).upper) - Number((indicators.bb as any).lower)) / 2
    : close * 0.01;

  const above20 = close > ema20 ? 1 : -1;
  const above50 = close > ema50 ? 1 : -1;
  const above200 = close > ema200 ? 1 : -1;
  const trend = (above20 + above50 + above200) / 3;
  const rsiScore = (rsi - 50) / 50;
  const macdSign = macdHist >= 0 ? 1 : -1;
  const momentum = 0.6 * rsiScore + 0.4 * macdSign;

  const pLong = Math.max(0, Math.min(100, 50 + 50 * (0.5 * trend + 0.5 * momentum)));
  const direction = pLong >= 50 ? 'LONG' : 'SHORT';
  const confidence = Math.max(50, Math.min(95, direction === 'LONG' ? pLong : 100 - pLong));

  const predictionType = getPredictionType(timeframe);
  const stopDist = Math.max(atr * 1.5, close * 0.005);
  const takeDist = Math.max(atr * 2.0, close * 0.01);

  let entry = close, stopLoss = 0, takeProfit = 0;
  if (direction === 'LONG') {
    stopLoss = +(entry - stopDist).toFixed(2);
    takeProfit = +(entry + takeDist).toFixed(2);
  } else {
    stopLoss = +(entry + stopDist).toFixed(2);
    takeProfit = +(entry - takeDist).toFixed(2);
  }

  const rr = stopLoss !== entry ? +(Math.abs(takeProfit - entry) / Math.abs(entry - stopLoss)).toFixed(2) : 1.5;

  return {
    entryPrice: entry,
    targetPrice: takeProfit,
    stopLoss: stopLoss,
    confidence,
    rationale: `규칙 엔진 기반 분석: RSI(${rsi.toFixed(1)}), MACD 히스토그램(${macdHist.toFixed(2)}), EMA 추세(${trend > 0 ? '상승' : '하락'}) 종합 결과 ${direction} 시그널 (신뢰도 ${confidence.toFixed(0)}%)`,
    timeframe: `규칙엔진:${timeframe}`,
    signalType: direction,
    buyProbability: direction === 'LONG' ? confidence : 100 - confidence,
    sellProbability: direction === 'SHORT' ? confidence : 100 - confidence,
    riskRewardRatio: rr,
    predictionType,
    model: '규칙 엔진',
    reasoning: '',
    sources: [],
  };
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

    if (!res.ok) {
      const errText = await res.text();
      console.error(`GLM-5V-Turbo URL error: ${res.status}`, errText);
      throw new Error(`GLM-5V-Turbo URL API error: ${res.status}`);
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
    console.error('GLM-5V-Turbo URL vision analysis failed:', err);
    throw err;
  }
}
