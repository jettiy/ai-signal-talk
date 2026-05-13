'use client';

import { Cloud, ShieldCheck } from 'lucide-react';
import SignalChartLogo from '@/components/icons/SignalChartLogo';

interface AuthFrameProps {
  children: React.ReactNode;
  maxWidth?: string;
}

export default function AuthFrame({ children, maxWidth = 'max-w-[430px]' }: AuthFrameProps) {
  return (
    <main className="auth-terminal-bg min-h-screen px-5 py-8 text-white">
      <section className={`mx-auto flex min-h-[calc(100vh-4rem)] w-full ${maxWidth} flex-col items-center justify-center`}>
        <header className="mb-9 flex flex-col items-center text-center">
          <SignalChartLogo iconSize={44} showText fontSize={28} stacked className="justify-center" />
          <p className="mt-5 max-w-[340px] text-sm font-semibold leading-relaxed text-white/48">
            {'AI \uC2DC\uADF8\uB110\uD1A1 · \uC2E4\uC2DC\uAC04 \uD22C\uC790 \uC2DC\uADF8\uB110\uACFC \uD2B8\uB808\uC774\uB354 \uCEE4\uBBA4\uB2C8\uD2F0'}
          </p>
        </header>

        {children}

        <footer className="mt-10 flex items-center justify-center gap-5 text-[11px] font-bold uppercase tracking-normal text-white/28">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={13} />
            Encrypted
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Cloud size={13} />
            System Stable
          </span>
        </footer>
      </section>
    </main>
  );
}
