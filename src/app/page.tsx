'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5" style={{ background: 'rgba(13,13,13,0.95)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M4 20L10 12L16 16L22 6" stroke="#00FF41" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 6L22 6L22 10" stroke="#00FF41" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <span className="text-xl font-bold tracking-tight text-white">AI 시그널톡</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>실시간 투자 시그널과 트레이더 커뮤니티</span>
          <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-white hover:border-[var(--accent-green)] transition-colors">
            로그인
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-6xl w-full grid grid-cols-2 gap-16 items-center">
          {/* Left: Value Prop */}
          <div className="space-y-8">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold border border-[var(--accent-green)] text-[var(--accent-green)] mb-4" style={{ background: 'rgba(0,255,65,0.08)' }}>
                PRO LEVEL ACCESS
              </span>
              <h1 className="text-5xl font-black leading-tight text-white">
                전문 트레이더가 만든<br/>
                <span className="text-[var(--accent-green)] text-glow-green">AI 시그널톡 PRO</span>
              </h1>
            </div>

            <div className="space-y-4">
              {[
                { icon: '🎧', title: '1:1 트레이더 배정', desc: '해외 선물 시장 전문 트레이더가 24시간 상담드립니다.' },
                { icon: '⚡', title: '실시간 고감도 시그널', desc: '기관급 데이터 엔진이 분석한 진입/청산 시그널을 지연 시간 없이 전송합니다.' },
                { icon: '🌐', title: '글로벌 인텔리전스 리포트', desc: '월스트리트 주요 통신사 독점 제휴. 미공개 거시 경제 지표 및 뉴스를 제공합니다.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{item.title}</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: PRO Application Form */}
          <div className="rounded-2xl p-8" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <h2 className="text-2xl font-bold text-white mb-1">PRO 등급 신청</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              전문 상담사가 기재하신 연락처로 직접 연락을 드립니다.
            </p>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs font-medium mb-2 text-white">성함 / FULL NAME</label>
                <input
                  type="text"
                  placeholder="홍길동"
                  className="w-full px-4 py-3 rounded-lg text-sm border outline-none transition-colors"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2 text-white">연락처 / PHONE NUMBER</label>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-3 rounded-lg text-sm border outline-none transition-colors"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2 text-white">이메일 / EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="investor@example.com"
                  className="w-full px-4 py-3 rounded-lg text-sm border outline-none transition-colors"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
                style={{ background: 'var(--accent-green)', color: '#000' }}
              >
                신청 및 상담 시작하기
                <span>→</span>
              </button>

              <p className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                🔒 데이터는 AES-256으로 암호화됩니다. 개인정보 처리방침에 동의합니다.
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-live"></span>
            SYSTEM ACTIVE
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>MARKET LATENCY: 12ms</span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>ENCRYPTION: AES-256</span>
        </div>
        <div className="flex gap-4">
          {['개인정보 보호', '이용약관', '위험 고지'].map(link => (
            <a key={link} href="#" className="text-xs hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
