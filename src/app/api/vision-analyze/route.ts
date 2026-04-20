import { NextRequest, NextResponse } from 'next/server';
import { analyzeChartWithVision, analyzeChartFromUrl } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, imageUrl, symbol, timeframe } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'symbol 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    let result;

    if (image) {
      // Base64 이미지 분석
      result = await analyzeChartWithVision(image, symbol, timeframe);
    } else if (imageUrl) {
      // 이미지 URL 분석
      result = await analyzeChartFromUrl(imageUrl, symbol, timeframe);
    } else {
      return NextResponse.json(
        { error: 'image (base64) 또는 imageUrl 중 하나가 필요합니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Vision analysis API error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
