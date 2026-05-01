import { ArrowRight } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function AuthButton({ children, className = '', disabled, ...props }: AuthButtonProps) {
  return (
    <button
      className={`flex h-14 w-full items-center justify-center gap-3 border border-[#00FF41]/80 bg-[#00FF41] text-sm font-black text-[#102015] shadow-[0_0_28px_rgba(0,255,65,0.18)] outline outline-1 outline-offset-4 outline-[#00FF41]/25 transition hover:bg-[#35ff6a] disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
      disabled={disabled}
      {...props}
    >
      <ArrowRight size={18} />
      {children}
    </button>
  );
}
