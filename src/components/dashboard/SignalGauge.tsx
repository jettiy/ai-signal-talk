'use client';

interface Props {
  confidence: number;
  size?: number;
  label?: string;
  signalType?: 'LONG' | 'SHORT';
}

export default function SignalGauge({ confidence, size = 120, label, signalType }: Props) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (confidence / 100) * circumference;
  const center = size / 2;

  // 신뢰도에 따른 색상
  const getColor = (c: number) => {
    if (c >= 80) return '#00FF41';
    if (c >= 60) return '#FFD700';
    if (c >= 40) return '#FFA500';
    return '#FF3B3B';
  };

  const color = getColor(confidence);
  const glowColor = signalType === 'SHORT' ? '#FF3B3B' : color;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          style={{ filter: `drop-shadow(0 0 6px ${glowColor}40)` }}
        >
          {/* 배경 원 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1A1A1A"
            strokeWidth={strokeWidth}
          />
          {/* 진행 원 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dasharray 0.8s ease-out, stroke 0.3s ease',
            }}
          />
          {/* 외부 글로우 링 */}
          <circle
            cx={center}
            cy={center}
            r={radius + 4}
            fill="none"
            stroke={color}
            strokeWidth={0.5}
            opacity={0.3}
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold leading-none"
            style={{
              color,
              fontSize: size * 0.22,
              textShadow: `0 0 8px ${glowColor}60`,
            }}
          >
            {confidence}%
          </span>
          {signalType && (
            <span
              className="text-xs font-bold mt-0.5"
              style={{
                color: signalType === 'LONG' ? '#00FF41' : '#FF3B3B',
              }}
            >
              {signalType === 'LONG' ? '▲ LONG' : '▼ SHORT'}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium" style={{ color: '#A0A0A0' }}>
          {label}
        </span>
      )}
    </div>
  );
}
