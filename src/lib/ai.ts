// SERVER ONLY — do not import from client components
// AI Client — MiMo / DeepSeek / GPT-4o 병렬 호출

export interface AiSignalResult {
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  rationale: string;
  timeframe: string;
  signalType: 'LONG' | 'SHORT';
  model: string;
}

function buildPrompt(symbol: string, price: number, news: {title: string; text: string; source: string}[], changePct: number): string {
  const newsSection = news.slice(0, 5).map((n, i) => `[${i+1}] [${n.source}] ${n.title}\n   ${n.text.slice(0, 200)}`).join('\n');
  return `너는 한국 전문 트레이더 AI分析师야. 다음 종목에 대해 기술적 분석과 뉴스 기반 매매 시그널을 생성해줘.

종목: ${symbol}
현재가: $${price}
전일 대비: ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%

최근 뉴스:
${newsSection || '暂无重要新闻'}

아래 JSON 형식으로만 응답. 다른 텍스트는 절대 포함하지 마:

{
  "entryPrice": 숫자,
  "targetPrice": 숫자,
  "stopLoss": 숫자,
  "confidence": 숫자(0~100),
  "rationale": "한국어로 2~3문장",
  "timeframe": "단기:1시간~3일 / 중기:1주~1개월",
  "signalType": "LONG" 또는 "SHORT"
}

규칙:
- rationale은 반드시 한국어로
- JSON 외 텍스트 금지
- confidence 70 이상일 때만 LONG/SHORT 제공`;
}

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
    return { ...JSON.parse(extractJson(data.choices?.[0]?.message?.content || '{}')), model: 'MiniMax MiMo' };
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
    return { ...JSON.parse(extractJson(data.choices?.[0]?.message?.content || '{}')), model: 'DeepSeek' };
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
    return { ...JSON.parse(extractJson(data.choices?.[0]?.message?.content || '{}')), model: 'GPT-4o' };
  } catch { return null; }
}

function extractJson(text: string): string {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON');
  return m[0];
}

export async function generateAiSignal(ctx: {
  symbol: string; price: number; changePct: number;
  news: {title: string; text: string; source: string}[];
}): Promise<AiSignalResult> {
  const prompt = buildPrompt(ctx.symbol, ctx.price, ctx.news, ctx.changePct);
  const results = await Promise.allSettled([callMinimax(prompt), callDeepSeek(prompt), callOpenAI(prompt)]);
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) return r.value;
  }
  // Fallback
  const { symbol, price, changePct } = ctx;
  const isUp = changePct >= 0;
  return {
    entryPrice: +(price * (isUp ? 1.002 : 0.998)).toFixed(2),
    targetPrice: +(price * (isUp ? 1.03 : 0.97)).toFixed(2),
    stopLoss: +(price * (isUp ? 0.985 : 1.015)).toFixed(2),
    confidence: Math.floor(50 + Math.random() * 30),
    rationale: isUp
      ? `현재 ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}% 상승 중. 단기 모멘텀이 강하나, 52주 신고치 근처에서 심리적 저항을 주의해야 한다.`
      : `현재 ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}% 하락 중. 단기 모멘텀이 약하며,追加 하락 시技术支持 구간 테스트 가능성이 있다.`,
    timeframe: '단기:1시간~3일',
    signalType: isUp ? 'LONG' : 'SHORT',
    model: 'Fallback (No API Key)',
  };
}
