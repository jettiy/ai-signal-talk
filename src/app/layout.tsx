import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'AI 시그널톡 | 실시간 투자 시그널과 트레이더 커뮤니티',
  description: 'AI가 분석하는 실시간 투자 시그널. 진입가, 목표가, 손절가를 지금 확인하세요.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
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
      </body>
    </html>
  );
}
