'use client';

import React from 'react';

interface SignalChartLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function SignalChartLogo({
  size = 40,
  showText = false,
  className = '',
}: SignalChartLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Chart line — upward trend */}
        <polyline
          points="8,38 16,28 24,32 32,18 40,10"
          stroke="#00FF41"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#glow)"
        />

        {/* Signal dot at peak */}
        <circle cx="40" cy="10" r="4" fill="#00FF41" filter="url(#glow)">
          <animate
            attributeName="r"
            values="3;5;3"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="1;0.5;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Data points on chart */}
        <circle cx="8" cy="38" r="2" fill="#00FF41" opacity="0.5" />
        <circle cx="16" cy="28" r="2" fill="#00FF41" opacity="0.5" />
        <circle cx="24" cy="32" r="2" fill="#00FF41" opacity="0.5" />
        <circle cx="32" cy="18" r="2" fill="#00FF41" opacity="0.7" />
      </svg>

      {/* Text */}
      {showText && (
        <span
          className="whitespace-nowrap"
          style={{
            fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
            color: '#FFFFFF',
            fontSize: size * 0.35,
            fontWeight: 500,
            letterSpacing: '-0.02em',
          }}
        >
          <span style={{ color: '#00FF41', fontWeight: 700 }}>AI</span> 시그널톡
        </span>
      )}
    </div>
  );
}
