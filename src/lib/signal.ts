/**
 * 순수 수학 기반 시그널 계산 유틸리티
 * - API 호출 없이 실시간 가격 + 변동률만으로 방향/확률/손익 계산
 * - SignalPanel.tsx의 폴백 시그널로 사용
 */

// ── 타임프레임 계수 ────────────────────────────────────────────
// 각 타임프레임의 상대적 변동성 스케일 (15분 = 1.0 기준)
const TF_VOLATILITY_FACTOR: Record<string, number> = {
  '1min': 0.3,
  '5min': 0.6,
  '15min': 1.0,
  '30min': 1.5,
  '1hour': 2.5,
  '1day': 5.0,
};

// 각 타임프레임별 최소 변동성 (절대 변동성이 0일 때 기본값)
const TF_MIN_VOLATILITY: Record<string, number> = {
  '1min': 0.03,
  '5min': 0.06,
  '15min': 0.10,
  '30min': 0.15,
  '1hour': 0.25,
  '1day': 0.50,
};

// 각 타임프레임별 방향 민감도 (값이 클수록 같은 변동률에 더 강하게 반응)
const TF_MOMENTUM_SENSITIVITY: Record<string, number> = {
  '1min': 3.0,
  '5min': 2.0,
  '15min': 1.5,
  '30min': 1.2,
  '1hour': 1.0,
  '1day': 0.8,
};

// ── 시그널 결과 타입 ───────────────────────────────────────────
export interface CalculatedSignal {
  direction: 'buy' | 'sell';
  buyProb: number;
  sellProb: number;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  riskReward: string;
  confidence: number;
  rationale: string;
  predictionType: string;
}

// ── 입력 파라미터 ──────────────────────────────────────────────
export interface CalculateSignalParams {
  /** 종목 심볼 (NQUSD, GCUSD, CLUSD, KSUSD) */
  asset: string;
  /** 타임프레임 (1min, 5min, 15min, 30min, 1hour, 1day) */
  timeframe: string;
  /** 현재 실시간 가격 */
  price: number;
  /** 가격 변동률 (%, ex: 0.35 = 0.35%) */
  changePct: number;
  /** 소수점 자리수 (기본 2) */
  decimals?: number;
  /** 종목별 손절 스케일 (%) */
  stopPct?: number;
  /** 종목별 목표 스케일 (%) */
  targetPct?: number;
  /** 종목 한글 레이블 (근거 문구용) */
  label?: string;
}

// ── 메인 계산 함수 ─────────────────────────────────────────────
export function calculateSignalFromPrice(params: CalculateSignalParams): CalculatedSignal {
  const {
    asset,
    timeframe,
    price,
    changePct,
    decimals = 2,
    stopPct: configStopPct = 0.5,
    targetPct: configTargetPct = 1.0,
    label,
  } = params;

  const etf = label || asset;
  const absChange = Math.abs(changePct);

  // ── 1. 변동성(ATR 유사) 계산 ──
  // changePct의 절대값을 기반으로 ATR-like 변동성 추정
  const tfFactor = TF_VOLATILITY_FACTOR[timeframe] ?? 1.0;
  const tfMinVol = TF_MIN_VOLATILITY[timeframe] ?? 0.1;
  const tfSensitivity = TF_MOMENTUM_SENSITIVITY[timeframe] ?? 1.5;

  // 변동성: 절대 변동률(%) + 타임프레임 계수 + 최소 변동성
  const atrPct = Math.max(
    absChange / 100 * tfFactor + tfMinVol / 100,
    tfMinVol / 100
  );

  // ── 2. 모멘텀 스코어 (방향 판단) ──
  // 실제 변동률에 타임프레임 감도를 곱해 모멘텀 강도 계산
  const momentumStrength = absChange * tfSensitivity;

  // 방향 판단:
  // - 변동이 매우 작은 경우: 현재 방향 유지 (신호 약함)
  // - 변동이 중간인 경우: 추세 추종 (모멘텀 방향)
  // - 변동이 큰 경우: 평균 회귀 (Contrarian — 과도한 움직임 되돌림 가정)
  const THRESHOLD_SMALL = 0.04;  // 0.04% 미만 = 노이즈
  const THRESHOLD_LARGE = 0.6;  // 0.6% 초과 = 과도한 움직임

  let direction: 'buy' | 'sell';
  let rawConfidence: number;

  if (absChange < THRESHOLD_SMALL) {
    // 변동성이 거의 없는 경우: 현재 방향을 따르되 신뢰도 낮음
    direction = changePct >= 0 ? 'buy' : 'sell';
    rawConfidence = 35 + momentumStrength * 15;
  } else if (absChange > THRESHOLD_LARGE) {
    // 과도한 변동: 평균 회귀 (Contrarian)
    direction = changePct >= 0 ? 'sell' : 'buy';
    rawConfidence = Math.min(70, 50 + momentumStrength * 8);
  } else {
    // 정상 범위 변동: 추세 추종 (Trend-following)
    direction = changePct >= 0 ? 'buy' : 'sell';
    rawConfidence = 40 + momentumStrength * 20;
  }

  // 신뢰도 35%~75% 클램프
  const confidence = Math.round(Math.min(75, Math.max(35, rawConfidence)));

  // 방향에 따른 확률 배분
  const buyProb = direction === 'buy' ? confidence : 100 - confidence;
  const sellProb = direction === 'sell' ? confidence : 100 - confidence;

  // ── 3. 진입가 / 손절가 / 목표가 ──
  // 진입가: 현재 가격 기준 (소수점 이하 절삭)
  const entryPrice = Math.round(price * (10 ** decimals)) / (10 ** decimals);
  const entryFormatted = entryPrice.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // configStopPct와 configTargetPct를 atrPct로 스케일링
  // configStopPct / configTargetPct는 일봉 기준이므로 tfFactor로 나누어 조정
  const baseStopPct = (configStopPct / 100) * (atrPct * 3);
  const baseTargetPct = (configTargetPct / 100) * (atrPct * 5);

  // 최소 손절/목표 보장 (너무 좁지 않게)
  const minStopPct = (tfMinVol / 100) * 1.5;
  const minTargetPct = (tfMinVol / 100) * 3.0;

  const stopPct = Math.max(baseStopPct, minStopPct);
  const targetPct = Math.max(baseTargetPct, minTargetPct);

  let stopPrice: number;
  let targetPrice: number;

  if (direction === 'buy') {
    stopPrice = entryPrice * (1 - stopPct);
    targetPrice = entryPrice * (1 + targetPct);
  } else {
    stopPrice = entryPrice * (1 + stopPct);
    targetPrice = entryPrice * (1 - targetPct);
  }

  const stopFormatted = stopPrice.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const targetFormatted = targetPrice.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // 손익비: 1.5 ~ 3.0 사이, 변동성 적을수록 RR 높음
  const rawRR = targetPct / (stopPct || 0.001);
  const riskReward = Math.min(3.0, Math.max(1.5, rawRR)).toFixed(2);

  // ── 4. 예측 타입 ──
  const predictionType = timeframe === '1min' || timeframe === '5min'
    ? '다음 봉 예측'
    : '현재봉 마감';

  // ── 5. 근거 요약 (동적 생성) ──
  const directionLabel = direction === 'buy' ? 'LONG' : 'SHORT';
  const changeDesc = changePct >= 0 ? `+${changePct.toFixed(2)}% 상승` : `${changePct.toFixed(2)}% 하락`;
  const momentumDesc = absChange < 0.04
    ? '변동성 낮음'
    : absChange > 0.6
      ? '과도한 변동 → 평균 회귀 예상'
      : '모멘텀 방향 유지';

  // 종목별 특성 반영 근거
  const assetLabels: Record<string, string> = {
    NQUSD: '나스닥선물',
    GCUSD: '골드선물',
    CLUSD: 'WTI선물',
    KSUSD: '코스피선물',
  };
  const assetLabel = assetLabels[asset] || asset;

  // 시간대별 변동성 설명
  const tfLabels: Record<string, string> = {
    '1min': '초단기',
    '5min': '단기',
    '15min': '단기',
    '30min': '중기',
    '1hour': '중기',
    '1day': '장기',
  };
  const tfLabel = tfLabels[timeframe] || '';

  const directionDesc = direction === 'buy'
    ? `매수세 우위`
    : `매도세 우위`;

  const rationale = `${assetLabel} ${timeframe}봉 ${directionDesc} (${changeDesc}). `
    + `${momentumDesc}. `
    + `${tfLabel} 변동성 ${(atrPct * 100).toFixed(2)}% 기반 손절/목표 설정.`;

  return {
    direction,
    buyProb: Math.round(buyProb),
    sellProb: Math.round(sellProb),
    entry: entryFormatted,
    stopLoss: stopFormatted,
    takeProfit: targetFormatted,
    riskReward,
    confidence,
    rationale,
    predictionType,
  };
}
