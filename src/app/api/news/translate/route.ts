import { NextRequest, NextResponse } from 'next/server';
import { translateNewsToKorean } from '@/lib/zai-web-search';
import type { NewsItem } from '@/lib/types';

/** 단일 뉴스 항목을 한국어로 번역 (사용자가 '번역' 클릭 시) */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { item?: NewsItem };
    const item = body.item;
    if (!item?.title?.trim()) {
      return NextResponse.json({ error: 'item.title 이 필요합니다.' }, { status: 400 });
    }

    const safe: NewsItem = {
      ...item,
      text: item.text || '',
      title: item.title.trim(),
    };

    const [out] = await translateNewsToKorean([safe]);
    if (!out) {
      return NextResponse.json({ error: '번역에 실패했습니다.' }, { status: 502 });
    }

    return NextResponse.json(
      {
        title: out.title,
        text: out.text ?? safe.text,
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch {
    return NextResponse.json({ error: '번역 요청 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
