'use client';

interface SignalChartLogoProps {
  iconSize?: number;
  fontSize?: number;
  showText?: boolean;
  className?: string;
  stacked?: boolean;
}

export default function SignalChartLogo({
  iconSize = 40,
  fontSize = 26,
  showText = false,
  className = '',
  stacked = false,
}: SignalChartLogoProps) {
  return (
    <div
      className={`flex ${stacked ? 'flex-col items-center' : 'items-center'} ${className}`}
      style={{ gap: stacked ? 10 : 12 }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="signal-candle" x1="0" y1="48" x2="0" y2="0">
            <stop offset="0" stopColor="#00C030" />
            <stop offset="1" stopColor="#00FF41" />
          </linearGradient>
          <linearGradient id="signal-trend" x1="12" y1="34" x2="38" y2="10">
            <stop offset="0" stopColor="#00C030" />
            <stop offset="1" stopColor="#00FF41" />
          </linearGradient>
          <filter id="signal-glow" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="8" y="14" width="32" height="24" rx="4" fill="rgba(255,255,255,0.04)" />
        <g stroke="url(#signal-candle)" strokeLinecap="round">
          <line x1="14" y1="18" x2="14" y2="32" strokeWidth="1.5" />
          <line x1="23" y1="14" x2="23" y2="31" strokeWidth="1.5" />
          <line x1="32" y1="12" x2="32" y2="29" strokeWidth="1.5" />
        </g>
        <g fill="url(#signal-candle)">
          <rect x="11" y="22" width="6" height="10" rx="1" />
          <rect x="20" y="19" width="6" height="12" rx="1" />
          <rect x="29" y="16" width="6" height="13" rx="1" />
        </g>
        <g filter="url(#signal-glow)" stroke="url(#signal-trend)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 33.5 L20 29 L28 24 L36 16" fill="none" />
          <path d="M36 16 L33 16.8 L38.5 12" fill="none" />
        </g>
      </svg>

      {showText && (
        <span
          className="select-none whitespace-nowrap font-black text-white"
          style={{
            fontSize,
            lineHeight: 1,
            letterSpacing: 0,
            textShadow: '0 2px 16px rgba(0, 255, 65, 0.18)',
          }}
        >
          <span className="text-[#00FF41]">AI</span>
          {' \uC2DC\uADF8\uB110\uD1A1'}
        </span>
      )}
    </div>
  );
}
