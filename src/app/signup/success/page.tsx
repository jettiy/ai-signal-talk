import Link from 'next/link';

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md text-center">
        {/* Check Icon */}
        <div className="flex items-center justify-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0, 255, 65, 0.1)', border: '2px solid var(--accent-green)' }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path
                d="M10 20L17 27L30 13"
                stroke="#00FF41"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-3xl font-black text-white mb-2"
          style={{ color: 'var(--accent-green)' }}
        >
          회원가입 완료
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>
          AI 시그널톡에 오신 것을 환영합니다.<br />지금 바로 터미널에 접속하세요.
        </p>

        {/* Operator Identity Card */}
        <div
          className="rounded-2xl p-6 mb-8 text-left"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-bold mb-4" style={{ color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
            OPERATOR IDENTITY
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>OPERATOR ID</span>
              <span className="text-sm font-mono font-bold" style={{ color: 'var(--accent-green)' }}>OPERATOR_X72</span>
            </div>
            <div className="w-full h-px" style={{ background: 'var(--border)' }} />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>LEVEL</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-green)', border: '1px solid var(--accent-green)' }}>
                LEVEL_01
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>STATUS</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-green)', border: '1px solid var(--accent-green)' }}>
                VERIFIED
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>REGISTERED</span>
              <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>2026.04.15</span>
            </div>
          </div>
        </div>

        {/* Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-sm transition-all"
          style={{ background: 'var(--accent-green)', color: '#000' }}
        >
          메인화면으로 이동
          <span>→</span>
        </Link>

        <p className="mt-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
          계정 정보는 마이페이지에서 확인하실 수 있습니다.
        </p>
      </div>
    </div>
  );
}
