import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* ===== Colors (DESIGN.md) ===== */
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'accent-green': 'var(--accent-green)',
        'accent-red': 'var(--accent-red)',
        'accent-yellow': 'var(--accent-yellow)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        border: 'var(--border)',
      },

      /* ===== Typography (DESIGN.md) ===== */
      fontFamily: {
        sans: ['Toss Product Sans', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'label': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'body-sm': ['0.75rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'body-md': ['0.875rem', { lineHeight: '1.6', letterSpacing: '-0.02em' }],
        'body-lg': ['1rem', { lineHeight: '1.6', letterSpacing: '-0.02em' }],
        'h3': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        'h2': ['1.5rem', { lineHeight: '1.35', letterSpacing: '-0.02em' }],
        'h1': ['2rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        'number': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        'number-lg': ['1.25rem', { lineHeight: '1.3', letterSpacing: '0em' }],
        'code': ['0.8125rem', { lineHeight: '1.6', letterSpacing: '0em' }],
      },
      letterSpacing: {
        heading: '-0.02em',
        body: '-0.02em',
        label: '0.02em',
        number: '0em',
      },
      lineHeight: {
        h1: '1.3',
        h2: '1.35',
        h3: '1.4',
        body: '1.6',
        'body-sm': '1.5',
        label: '1.4',
        number: '1.5',
      },

      /* ===== Spacing (8px grid, DESIGN.md) ===== */
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'base': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
      },

      /* ===== Border Radius (DESIGN.md) ===== */
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
      },

      /* ===== Box Shadow (DESIGN.md) ===== */
      boxShadow: {
        'glow-green': '0 0 12px rgba(0,255,65,0.4)',
        'glow-green-strong': '0 0 16px rgba(0,255,65,0.3)',
        'dropdown': '0 8px 32px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
