interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <div
      className={`w-full border border-white/[0.04] bg-[#1B1F1D]/95 p-7 shadow-[0_26px_80px_rgba(0,0,0,0.32)] sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
