import { NextRequest, NextResponse } from 'next/server';

const ZAI_API_KEY = process.env.ZAI_API_KEY || '';
const ZAI_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const SYSTEM_PROMPT = `너는 해외선물 트레이더를 위한 전문 AI 어시스턴트야. 
- 반드시 한국어로 답변해
- 트레이딩, 선물, 옵션, 기술적 분석, 시장 뉴스 관련 질문에 전문적으로 답해
- 투자 조언이 아닌 '분석 참고자료'로 제공한다는 점을 명시해
- LONG=매수, SHORT=매도 표기를 사용해
- 200자 이내로 간결하게 답해`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 });
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: '메시지는 1000자 이하로 입력해주세요.' }, { status: 400 });
    }

    if (!ZAI_API_KEY) {
      return NextResponse.json({
        role: 'assistant',
        content: 'AI 서비스가 현재 설정 중입니다. 잠시 후 다시 시도해주세요.',
      });
    }

    // 대화 히스토리 구성 (최근 10개만)
    const chatHistory = (history || []).slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    // glm-4.5-air: 채팅용 (한국어 content 잘 나옴, 빠름)
    const res = await fetch(ZAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4.5-air',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...chatHistory,
          { role: 'user', content: message },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('ZAI Chat API error:', res.status, errText);
      return NextResponse.json({
        role: 'assistant',
        content: 'AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      });
    }

    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    // reasoning 모델은 content가 비어있을 수 있으므로 reasoning_content 폴백
    const content = msg?.content || msg?.reasoning_content || '응답을 생성할 수 없습니다.';

    return NextResponse.json({
      role: 'assistant',
      content,
    });
  } catch (e) {
    console.error('Chat API error:', e);
    return NextResponse.json({ error: '채팅 처리 실패' }, { status: 500 });
  }
}
