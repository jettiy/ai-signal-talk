'use client';
import React from 'react';
type SignalChartLogoProps = { iconSize?: number; fontSize?: number; showText?: boolean; className?: string };

export default function SignalChartLogo({
  iconSize = 40,
  fontSize = 26,
  showText = false,
  className = '',
}: SignalChartLogoProps) {
  const scale = iconSize / 48;

  return (
    <div className={`flex items-center ${className}`} style={{ gap: Math.max(6, 8 * scale) }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="signalTalk" x1="8" y1="44" x2="40" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00FF41" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#00FF41" />
          </linearGradient>
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#glow)">
          <path
            fill="url(#signalTalk)"
            d="M12 12H28l3-5.5L38.5 14H39c4 0 7 3 7 7v7c0 6-4.7 10-11 10h-8.5L17 44v-6H12c-6 0-10-4.5-10-10v-6c0-6 4.5-10 10-10Z"
          />
        </g>
      </svg>

      {showText && (
        <span
          className="whitespace-nowrap select-none"
          style={{ fontFamily: "'Space Grotesk', 'Pretendard', sans-serif", color: '#fff', fontSize, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          <span style={{ color: '#00FF41', fontWeight: 700 }}>AI</span> 시그널톡
        </span>
      )}
    </div>
  );
}
