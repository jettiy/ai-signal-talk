import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/components/QueryProvider';

export const metadata: Metadata = {
  title: 'AI 시그널톡 | 실시간 투자 시그널과 트레이더 커뮤니티',
  description: 'AI가 분석하는 실시간 투자 시그널. 진입가, 목표가, 손절가를 지금 확인하세요.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpolyline points='8,38 16,28 24,32 32,18 40,10' stroke='%2300FF41' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='40' cy='10' r='4' fill='%2300FF41'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
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
        </QueryProvider>
      </body>
    </html>
  );
}
