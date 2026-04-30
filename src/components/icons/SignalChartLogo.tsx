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
          <linearGradient id="candle" x1="0" y1="48" x2="0" y2="0">
            <stop offset="0" stopColor="#00C030" />
            <stop offset="1" stopColor="#00FF41" />
          </linearGradient>
          <linearGradient id="trend" x1="12" y1="34" x2="38" y2="10">
            <stop offset="0" stopColor="#00C030" />
            <stop offset="1" stopColor="#00FF41" />
          </linearGradient>
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="8" y="14" width="32" height="24" rx="4" fill="rgba(255,255,255,0.04)" />
        <g stroke="url(#candle)" strokeLinecap="round">
          <line x1="14" y1="18" x2="14" y2="32" strokeWidth="1.5" />
          <line x1="23" y1="14" x2="23" y2="31" strokeWidth="1.5" />
          <line x1="32" y1="12" x2="32" y2="29" strokeWidth="1.5" />
        </g>
        <g fill="url(#candle)">
          <rect x="11" y="22" width="6" height="10" rx="1" />
          <rect x="20" y="19" width="6" height="12" rx="1" />
          <rect x="29" y="16" width="6" height="13" rx="1" />
        </g>
        <g filter="url(#glow)" stroke="url(#trend)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 33.5 L20 29 L28 24 L36 16" fill="none" />
          <path d="M36 16 L33 16.8 L38.5 12" fill="none" />
        </g>
      </svg>

      {showText && (
        <span
          className="whitespace-nowrap select-none"
          style={{ fontFamily: "'Toss Product Sans', 'Pretendard', sans-serif", color: '#fff', fontSize, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          <span style={{ color: '#00FF41', fontWeight: 700 }}>AI</span> 시그널톡
        </span>
      )}
    </div>
  );
}
