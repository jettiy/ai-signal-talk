import { NextRequest, NextResponse } from 'next/server';
import { chatWithAgent } from '@/lib/zai-agent';
import { ChatMessage } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    const conversationHistory: ChatMessage[] = Array.isArray(history)
      ? history.slice(-10)
      : [];

    const response = await chatWithAgent(message, conversationHistory);

    return NextResponse.json({
      role: response.role,
      content: response.content,
      reasoning: response.reasoning_content || undefined,
    });
  } catch (e) {
    return NextResponse.json(
      { error: '채팅 응답 생성 실패' },
      { status: 500 }
    );
  }
}
