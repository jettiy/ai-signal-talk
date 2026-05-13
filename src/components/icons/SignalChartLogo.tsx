'use client';

import { useId } from 'react';

interface SignalChartLogoProps {
  iconSize?: number;
  fontSize?: number;
  showText?: boolean;
  className?: string;
  stacked?: boolean;
}

/** 공식 `ai-signal-talk-logo.svg` geometry (viewBox 160×70). 그라데이션·필터 id는 인스턴스마다 유일하게 분리. */
export default function SignalChartLogo({
  iconSize = 40,
  fontSize = 26,
  showText = false,
  className = '',
  stacked = false,
}: SignalChartLogoProps) {
  const rid = useId().replace(/:/g, '');
  const barGradient = `barGradient-${rid}`;
  const arrowGradient = `arrowGradient-${rid}`;
  const neonGlow = `neonGlow-${rid}`;

  const h = (iconSize * 70) / 160;

  return (
    <div
      className={`flex ${stacked ? 'flex-col items-center' : 'items-center'} ${className}`}
      style={{ gap: stacked ? 10 : 12 }}
    >
      <svg
        width={iconSize}
        height={h}
        viewBox="0 0 160 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={showText ? true : undefined}
        role={showText ? undefined : 'img'}
        aria-label={showText ? undefined : 'AI 시그널톡 로고'}
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient
            id={barGradient}
            x1="45"
            y1="50"
            x2="45"
            y2="20"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#00C853" />
            <stop offset="1" stopColor="#00FF57" />
          </linearGradient>
          <linearGradient
            id={arrowGradient}
            x1="43"
            y1="47"
            x2="112"
            y2="18"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#00E64D" />
            <stop offset="0.52" stopColor="#00FF57" />
            <stop offset="1" stopColor="#8CFF7A" />
          </linearGradient>
          <filter id={neonGlow} x="20" y="0" width="125" height="70" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 1  0 0 0 0 0.35  0 0 0 0.75 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter={`url(#${neonGlow})`}>
          <rect x="39" y="41" width="13" height="15" rx="2" fill={`url(#${barGradient})`} />
          <rect
            x="60"
            y="32"
            width="13"
            height="24"
            rx="2"
            fill={`url(#${barGradient})`}
            opacity="0.92"
          />
          <rect
            x="81"
            y="23"
            width="13"
            height="33"
            rx="2"
            fill={`url(#${barGradient})`}
            opacity="0.86"
          />
          <path
            d="M35 50C51 43 66 34 82 24C91 18 98 13 111 8"
            stroke={`url(#${arrowGradient})`}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path d="M104 7L121 2L116 20L111 12L104 7Z" fill={`url(#${arrowGradient})`} />
          <path
            d="M38 48C54 41 68 32 82 23C91 17 99 12 112 7"
            stroke="#B6FF9A"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>
      </svg>

      {showText && (
        <span
          className="select-none whitespace-nowrap font-black tracking-tight text-white"
          style={{
            fontSize,
            lineHeight: 1,
            textShadow: '0 2px 20px rgba(0, 255, 87, 0.22)',
          }}
        >
          <span className="text-white">Signal</span>
          <span className="text-[#00FF57]">Chart</span>
        </span>
      )}
    </div>
  );
}
