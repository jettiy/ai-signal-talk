'use client';

import React from 'react';

interface SignalChartLogoProps {
  iconSize?: number;
  fontSize?: number;
  showText?: boolean;
  className?: string;
}

export default function SignalChartLogo({
  iconSize = 40,
  fontSize = 26,
  showText = false,
  className = '',
}: SignalChartLogoProps) {
  const scale = iconSize / 48;

  return (
    <div
      className={`flex items-center ${className}`}
      style={{ gap: Math.max(6, 8 * scale) }}
    >
      {/* Icon — 3-bar chart with upward arrow, matching login page design */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#00C030" />
            <stop offset="100%" stopColor="#00FF41" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 3 bars — left to right, increasing height */}
        <rect x="6" y="26" width="7" height="14" rx="1.5" fill="url(#barGradient)" filter="url(#glow)" />
        <rect x="17" y="18" width="7" height="22" rx="1.5" fill="url(#barGradient)" filter="url(#glow)" />
        <rect x="28" y="8" width="7" height="32" rx="1.5" fill="url(#barGradient)" filter="url(#glow)" />

        {/* Trend line + arrow */}
        <polyline
          points="9,26 20,18 31,8"
          stroke="#00FF41"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#glow)"
        />
        <polygon points="31,8 37,14 33,11" fill="#00FF41" filter="url(#glow)" />
      </svg>

      {/* Text */}
      {showText && (
        <span
          className="whitespace-nowrap select-none"
          style={{
            fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
            color: '#FFFFFF',
            fontSize,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          <span style={{ color: '#00FF41', fontWeight: 700 }}>AI</span> 시그널톡
        </span>
      )}
    </div>
  );
}
