import { NextRequest, NextResponse } from 'next/server';

const ZAI_API_KEY = process.env.ZAI_API_KEY || '';
const ZAI_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const SYSTEM_PROMPT = `너는 AI 시그널톡의 개인 트레이딩 어시스턴트다.
- 반드시 한국어로 답한다.
- 공개 채팅방에 보낼 말이 아니라, 요청한 사용자 한 명에게만 보이는 개인 답변이라고 가정한다.
- 투자 조언을 단정하지 말고 분석 참고자료로 표현한다.
- 답변은 500자 이내로 간결하게 작성한다.`;

interface ChatHistoryItem {
  role: string;
  content: string;
}

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
        content: 'AI 서비스가 아직 설정되지 않았습니다. 관리자에게 ZAI_API_KEY 설정을 요청해주세요.',
      });
    }

    const chatHistory = Array.isArray(history)
      ? history.slice(-10).map((item: ChatHistoryItem) => ({
          role: item.role === 'user' ? 'user' : 'assistant',
          content: String(item.content || '').slice(0, 1000),
        }))
      : [];

    const res = await fetch(ZAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ZAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4.5-air',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...chatHistory,
          { role: 'user', content: message.trim() },
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
    const content = msg?.content || msg?.reasoning_content || '응답을 생성하지 못했습니다.';

    return NextResponse.json({
      role: 'assistant',
      content,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: '채팅 처리에 실패했습니다.' }, { status: 500 });
  }
}
