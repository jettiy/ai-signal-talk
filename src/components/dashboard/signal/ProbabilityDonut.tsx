'use client';

interface Props {
  direction: 'buy' | 'sell';
  buyProb: number;
  sellProb: number;
  predictionType: string;
}

export default function ProbabilityDonut({ direction, buyProb, sellProb, predictionType }: Props) {
  const isBuy = direction === 'buy';
  const mainProb = isBuy ? buyProb : sellProb;
  const mainColor = isBuy ? '#00FF41' : '#FF3B3B';
  const mainLabel = isBuy ? '매수' : '매도';
  const subColor = isBuy ? '#FF3B3B' : '#00FF41';
  const subLabel = isBuy ? '매도' : '매수';
  const subProb = isBuy ? sellProb : buyProb;

  // SVG 도넛 차트 계산
  const radius = 58;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const mainDash = (mainProb / 100) * circumference;
  const subDash = (subProb / 100) * circumference;
  const mainOffset = 0;
  const subOffset = -mainDash; // 메인 이어서

  return (
    <div
      className="rounded-xl p-4 flex flex-col items-center"
      style={{ background: '#111118', border: '1px solid #1A1A1A' }}
    >
      {/* 예측 타입 뱃지 */}
      <span
        className="text-[9px] font-bold px-2 py-0.5 rounded mb-3"
        style={{
          background: predictionType.includes('다음') ? 'rgba(0,180,216,0.1)' : 'rgba(168,85,247,0.1)',
          color: predictionType.includes('다음') ? '#00B4D8' : '#A855F7',
        }}
      >
        {predictionType}
      </span>

      {/* 도넛 차트 */}
      <div className="relative w-[140px] h-[140px]">
        <svg viewBox="0 0 140 140" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
          {/* 배경 서클 */}
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#1A1A1A" strokeWidth={strokeWidth} />

          {/* 메인 방향 (매수/매도) */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={mainColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${mainDash} ${circumference - mainDash}`}
            strokeDashoffset={mainOffset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${mainColor}60)` }}
          />

          {/* 반대 방향 */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={subColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${subDash} ${circumference - subDash}`}
            strokeDashoffset={subOffset}
            strokeLinecap="round"
            opacity={0.6}
          />
        </svg>

        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-lg font-black"
            style={{ color: mainColor, textShadow: `0 0 12px ${mainColor}80` }}
          >
            {mainLabel}
          </span>
          <span
            className="text-xl font-black font-mono"
            style={{ color: mainColor }}
          >
            {mainProb}%
          </span>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#00FF41' }} />
          <span className="text-[10px] font-bold" style={{ color: '#00FF41' }}>매수 {buyProb}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF3B3B' }} />
          <span className="text-[10px] font-bold" style={{ color: '#FF3B3B' }}>매도 {sellProb}%</span>
        </div>
      </div>
    </div>
  );
}
