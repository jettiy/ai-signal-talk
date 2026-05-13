import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/components/QueryProvider';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'SignalChart | AI 시그널톡 · 실시간 투자 시그널과 트레이더 커뮤니티',
  description:
    'SignalChart — AI가 분석하는 실시간 투자 시그널. 진입가, 목표가, 손절가를 지금 확인하세요.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link rel="stylesheet" href="https://static.toss.im/tps/main.css" />
        <link rel="stylesheet" href="https://static.toss.im/tps/others.css" />
      </head>
      <body className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <QueryProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1A1A1A',
                color: '#FFFFFF',
                border: '1px solid #2D2D2D',
                fontSize: '14px',
              },
            }}
          />
          {children}
          <Analytics />
        </QueryProvider>
      </body>
    </html>
  );
}
