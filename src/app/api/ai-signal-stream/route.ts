import { NextRequest } from 'next/server';
import { callZaiGLMStream } from '@/lib/ai';
import { searchFinancialNews } from '@/lib/zai-web-search';
import { FUTURES_SYMBOLS } from '@/lib/types';

// 메모리 기반 일일 카운터 (ai-signal과 공유하지 않아도 됨 — 스트리밍 전용)
const dailyCounts = new Map<string, { date: string; count: number }>();
const DAILY_LIMIT = 10;

function checkDailyLimit(ip: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const entry = dailyCounts.get(ip);
  if (!entry || entry.date !== today) {
    dailyCounts.set(ip, { date: today, count: 0 });
  }
  const current = dailyCounts.get(ip)!;
  current.count++;
  return { allowed: current.count <= DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - current.count) };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { allowed, remaining } = checkDailyLimit(ip);

  if (!allowed) {
    return new Response(
      JSON.stringify({ error: '일일 요청 횟수 제한 초과', remaining }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const { symbol, price, changePct, news, timeframe } = await req.json();
    const tf = timeframe || '1hour';

    // Z.AI 웹검색으로 뉴스 보강
    let webSearchResults: import('@/lib/types').WebSearchResult[] = [];
    try {
      const label = Object.values(FUTURES_SYMBOLS).find(
        (f) => f.symbol === symbol,
      )?.label || symbol;
      webSearchResults = await searchFinancialNews(symbol, label);
    } catch {
      // 웹검색 실패해도 시그널 생성은 진행
    }

    // 사용자 프롬프트 구성 (ai.ts의 buildUserPrompt를 직접 호출할 수 없으므로 여기서 재구성하거나,
    // ai.ts에서 export된 함수를 사용)
    // callZaiGLMStream은 userPrompt를 받으므로, 프롬프트를 빌드하는 함수를 ai.ts에서 export 해야 함.
    // 하지만 기존 ai.ts에서 buildUserPrompt가 export되지 않으므로, 여기서 직접 빌드합니다.
    const userPrompt = buildUserPromptLocal(symbol, price, changePct, news || [], tf, webSearchResults);

    // SSE 스트리밍 응답
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = '';

        try {
          fullContent = await callZaiGLMStream(
            userPrompt,
            // onThinking — thinking 청크를 SSE로 전송
            (chunk: string) => {
              controller.enqueue(
                encoder.encode(`event: thinking\ndata: ${JSON.stringify({ chunk })}\n\n`),
              );
            },
            // onContent — content(JSON) 청크를 SSE로 전송
            (chunk: string) => {
              controller.enqueue(
                encoder.encode(`event: content\ndata: ${JSON.stringify({ chunk })}\n\n`),
              );
            },
            true, // withThinking
          );

          // 전체 JSON 콘텐츠 수신 완료 → 결과 파싱
          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(extractJsonLocal(fullContent));
          } catch {
            // JSON 파싱 실패 시 폴백
            parsed = {
              entryPrice: price,
              targetPrice: price * (changePct >= 0 ? 1.03 : 0.97),
              stopLoss: price * (changePct >= 0 ? 0.985 : 1.015),
              confidence: 50,
              rationale: 'AI 분석 완료 (JSON 파싱 오류로 폴백)',
              timeframe: '단기:1시간~3일',
              signalType: changePct >= 0 ? 'LONG' : 'SHORT',
              buyProbability: changePct >= 0 ? 65 : 35,
              sellProbability: changePct >= 0 ? 35 : 65,
              riskRewardRatio: 2.0,
              predictionType: '현재봉 마감',
            };
          }

          const result = {
            ...mapParsedResultLocal(parsed),
            model: 'GLM-5',
            reasoning: '',
            sources: webSearchResults.slice(0, 5).map((r) => ({
              title: r.title,
              url: r.url,
              snippet: r.snippet,
            })),
          };

          // 완료 이벤트 전송
          controller.enqueue(
            encoder.encode(`event: done\ndata: ${JSON.stringify({ result, remaining })}\n\n`),
          );
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: '스트리밍 중 오류 발생' })}\n\n`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'AI 분석 실패' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

// ── 로컬 프롬프트 빌더 (ai.ts의 buildUserPrompt와 동일 로직) ──────────
function buildUserPromptLocal(
  symbol: string,
  price: number,
  news: { title: string; text: string; source: string }[],
  changePct: number,
  timeframe: string,
  webSearchResults?: import('@/lib/types').WebSearchResult[],
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

  return `종목: ${symbol}
현재가: $${price}
전일 대비: ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%
시간프레임: ${timeframe}

최근 뉴스:
${newsSection || '최근 주요 뉴스 없음'}${webSection}

위 데이터를 종합 분석해서 매매 시그널을 생성해.`;
}

// ── 로컬 유틸 (ai.ts의 extractJson, mapParsedResult와 동일 로직) ──────
function extractJsonLocal(text: string): string {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON');
  return m[0];
}

function mapParsedResultLocal(parsed: Record<string, unknown>): Omit<import('@/lib/types').AiSignalResult, 'model'> {
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
