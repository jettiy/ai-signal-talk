import type { InputHTMLAttributes, ReactNode } from 'react';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: ReactNode;
  rightSlot?: ReactNode;
}

export default function AuthField({ label, icon, rightSlot, className = '', ...props }: AuthFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold text-white/64">{label}</span>
      <span className="flex h-12 items-center border border-white/[0.06] bg-black/72 focus-within:border-[#00FF41]/75">
        <span className="grid h-full w-12 place-items-center text-white/46">{icon}</span>
        <input
          className={`auth-input min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25 ${className}`}
          {...props}
        />
        {rightSlot}
      </span>
    </label>
  );
}
