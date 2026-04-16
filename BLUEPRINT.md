# AI 시그널톡 (FlameMap) — 설계도(Blueprint)

## 📐 디자인 시스템

### 색상 팔레트
| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg-primary` | `#0D0D0D` | 메인 배경 |
| `--bg-secondary` | `#1A1A1A` | 카드/패널 배경 |
| `--bg-tertiary` | `#242424` | 입력필드/호버 배경 |
| `--accent-green` | `#00FF41` | CTA버튼, 상승, 성공, 시그널 |
| `--accent-red` | `#FF3B3B` | 하락, 경고, 매도 |
| `--accent-yellow` | `#FFD700` | 주의, MEDIUM 등급 |
| `--text-primary` | `#FFFFFF` | 기본 텍스트 |
| `--text-secondary` | `#A0A0A0` | 보조 텍스트 |
| `--border` | `#2D2D2D` | 구분선 |

### 타이포그래피
- **주폰트**: Inter (400~900)
- **모노폰트**: JetBrains Mono (코드/숫자)
- **제목**: 48px/900 → 20px/700
- **본문**: 14px/400
- **라벨**: 12px/600

### 효과
- Glow: `box-shadow: 0 0 12px rgba(0,255,65,0.4)`
- Text Glow: `text-shadow: 0 0 8px rgba(0,255,65,0.6)`
- Pulse: 1.5s 무한반복 (실시간 인디케이터)
- Shimmer: 스켈레톤 로딩

---

## 🗺️ 페이지 구조도

```
/ (랜딩) → /login → /dashboard (메인)
                  → /signup → /signup/success
                  
/dashboard
  ├── /dashboard/news     (뉴스)
  ├── /dashboard/chart    (차트상세)
  ├── /dashboard/rank     (랭킹)
  └── /dashboard/settings (설정)
```

---

## 📄 페이지별 컴포넌트 매핑

### 1. 랜딩페이지 (`/`)
**사진 참조**: PRO 등급 신청 페이지

```
┌─────────────────────────────────────────────────┐
│ [Header] 로고 | 시장 Ticker(NASDAQ +1.24%) | 로그인 │
├──────────────────────┬──────────────────────────┤
│                      │                          │
│  PRO LEVEL ACCESS    │   [PRO 등급 신청 카드]    │
│  전문 트레이더가 만든  │   이름, 전화, 이메일      │
│  AI 시그널톡 PRO      │   [신청하기] (네온그린)    │
│                      │                          │
│  🎧 1:1 트레이더 배정 │                          │
│  ⚡ 실시간 시그널     │                          │
│  🌐 글로벌 리포트     │                          │
│                      │                          │
├──────────────────────┴──────────────────────────┤
│ [Footer] SYSTEM STABLE | ENCRYPTION: AES-256     │
└─────────────────────────────────────────────────┘
```

**구현 상태**: ✅ page.tsx 구현됨 (2-column grid)

---

### 2. 로그인 (`/login`)
**사진 참조**: 다크 로그인 폼

```
┌─────────────────────────────────────────────────┐
│                                                 │
│          [로고] AI 시그널톡                      │
│          실시간 투자 시그널과 트레이더 커뮤니티      │
│                                                 │
│          ┌─────────────────────┐                │
│          │ 아이디              │                │
│          └─────────────────────┘                │
│          ┌─────────────────────┐                │
│          │ 비밀번호        👁️  │                │
│          └─────────────────────┘                │
│          ☑ 로그인 상태 유지                      │
│                                                 │
│          [→ 트레이드 접속하기] (네온그린)         │
│                                                 │
│          신규 회원가입 | 아이디/비밀번호 찾기      │
│                                                 │
│          🔒 ENCRYPTED  🟢 SYSTEM STABLE         │
└─────────────────────────────────────────────────┘
```

**구현 상태**: ✅ login/page.tsx 구현됨

---

### 3. 회원가입 (`/signup` → `/signup/success`)
**사진 참조**: 계정 생성 + 완료 화면

```
[/signup]                      [/signup/success]
아이디, 이메일, 비밀번호         ✅ 회원가입 완료
비밀번호 규칙 안내              OPERATOR_X72
[회원가입 완료]                LEVEL_DI VERIFIED
                               [→ 메인화면으로 이동]
```

**구현 상태**: ✅ 구현됨

---

### 4. 메인 대시보드 (`/dashboard`) ⭐ 핵심
**사진 참조**: 3-column 레이아웃 (뉴스+시그널+차트)

```
┌──┬─────────────────────────────────────────────────┐
│  │ [종목 탭] 나스닥선물 | 골드선물 | WTI선물  KST시간│
│  ├──────────┬──────────────┬────────────────────────┤
│사│          │              │                        │
│이│  뉴스    │  AI 시그널    │   캔들스틱 차트         │
│드│  피드    │  분석 패널    │   + 시간프레임 선택     │
│바│          │              │                        │
│  │ CRITICAL │ 🟢 매수 94% │   [1M][5M][15M][1H][1D]│
│  │ HIGH     │ 진입가/목표가 │                        │
│  │ MEDIUM   │ 손절가       │   ───── 📊 ──────     │
│  │          │ 신뢰도 게이지 │                        │
│  │          │              │   Signal Strength: 94% │
│  │  채팅    │  시그널 목록  │                        │
│  │  패널    │  PRO_SCALPER │                        │
│  │          │  BEAR_HUNTER │                        │
├──┴──────────┴──────────────┴────────────────────────┤
│ [Status Bar] SYSTEM ACTIVE: STABLE | 12ms | AES-256 │
└─────────────────────────────────────────────────────┘
```

**레이아웃 구조**:
- **사이드바** (64px 고정): Dashboard, Chart, News, Rank, Settings
- **종목 탭바**: 나스닥/골드/WTI 전환
- **3-column 메인**: 뉴스(25%) | 시그널(30%) | 차트(45%)
- **하단 스테이터스바**: 시스템 상태 표시

**핵심 컴포넌트**:
| 컴포넌트 | 파일 | 데이터소스 | 상태 |
|---|---|---|---|
| Sidebar | `components/layout/Sidebar.tsx` | 정적 | ✅ |
| AssetTabs | `dashboard/page.tsx` 내장 | 정적 | ✅ |
| NewsPanel | `components/dashboard/NewsCard.tsx` | `/api/news` | ✅ |
| SignalPanel | `components/dashboard/SignalCard.tsx` | `/api/ai-signal` | ✅ |
| CandlestickChart | `components/charts/CandlestickChart.tsx` | `/api/chart` | ⚠️ Recharts→lightweight-charts 교체 필요 |
| ChatPanel | `components/dashboard/ChatPanel.tsx` | WebSocket | ✅ (mock) |
| SignalStrengthGauge | 신규 필요 | `/api/ai-signal` | ❌ 미구현 |
| StatusBar | 신규 필요 | 정적 | ❌ 미구현 |

---

### 5. 관리자 대시보드 (`/dashboard/admin`) — Phase 2
**사진 참조**: KPI 카드 + 사용자 관리

```
┌──┬─────────────────────────────────────────────────┐
│  │ [Header] 실시간 시장 Ticker                       │
│  ├─────────┬─────────┬─────────┬───────────────────┤
│  │총 사용자 │ 총 회원  │ PRO멤버 │ 대기 중            │
│  │ 1,247   │  892    │  156   │   23              │
│  │ +12.4%  │ +8.2%   │ +24.1% │                   │
│  ├─────────┴─────────┴─────────┴───────────────────┤
│  │ [사용자 확보 추이 바차트]     │ [상담 대기열]     │
│  │                              │ 이름 등급 상태 시간 │
│  ├──────────────────────────────┤                   │
│  │ [USER MANAGEMENT 테이블]     │                   │
│  │ 이름 역할 상태 접속시간 권한  │                   │
│  └──────────────────────────────┴───────────────────┘
```

**구현 상태**: ❌ Phase 2 (백엔드 RBAC 필요)

---

## 🏗️ 아키텍처 — API 프록시 구조

```
[클라이언트 브라우저]
    │
    ├── fetch('/api/market-data')  ──→  route.ts ──→  fmp.ts ──→  FMP API
    ├── fetch('/api/news')         ──→  route.ts ──→  fmp.ts ──→  FMP API
    ├── fetch('/api/chart')        ──→  route.ts ──→  fmp.ts ──→  FMP API
    ├── fetch('/api/ai-signal')    ──→  route.ts ──→  ai.ts  ──→  MiniMax/DeepSeek/OpenAI
    │
    │  ✅ 브라우저 DevTools에 외부 API 도메인 노출 없음
    │  ✅ API 키는 서버에서만 사용 (process.env)
    │  ✅ 심볼 화이트리스트 검증
```

### 환경변수 (.env.local)
```
FMP_API_KEY=***
MINIMAX_API_KEY=***
DEEPSEEK_API_KEY=***
OPENAI_API_KEY=***
```

---

## 📦 추천 오픈소스 리소스

### 차트 라이브러리
| 라이브러리 | GitHub | 스타 | 특징 |
|---|---|---|---|
| **lightweight-charts** | [tradingview/lightweight-charts](https://github.com/tradingview/lightweight-charts) | 15.2k | TradingView 공식. 캔들스틱, 볼륨, 인디케이터 완벽. React 래퍼 있음 |
| **lightweight-charts-react-wrapper** | [trash-and-fire/lightweight-charts-react-wrapper](https://github.com/trash-and-fire/lightweight-charts-react-wrapper) | 121 | lightweight-charts React 바인딩 |

### UI 프레임워크
| 라이브러리 | GitHub | 스타 | 특징 |
|---|---|---|---|
| **shadcn/ui** | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | 112k | 카드, 테이블, 다이얼로그 등. 다크테마 기본 지원 |
| **Tremor** | [tremorlabs/tremor](https://github.com/tremorlabs/tremor) | 3.4k | Tailwind 기반 대시보드 전용 컴포넌트. 차트+카드+테이블 |

### 레퍼런스 프로젝트
| 프로젝트 | GitHub | 특징 |
|---|---|---|
| **Neuberg** | [KoNananachan/Neuberg](https://github.com/KoNananachan/Neuberg) | Bloomberg 스타일 트레이딩 뉴스 터미널. AI 분석 + 예측 시장. 우리와 가장 비슷 |
| **AlpacaTradingAgent** | [Rezzecup/AlpacaTradingAgent](https://github.com/Rezzecup/AlpacaTradingAgent) | Next.js 멀티에이전트 트레이딩 데스크 |

### 채택 계획
1. **lightweight-charts** → 기존 Recharts 캔들스틱 교체
2. **shadcn/ui** → 카드, 테이블, 다이얼로그 등 공통 컴포넌트
3. **Neuberg** → 레이아웃/UX 레퍼런스 참고

---

## 🔄 Phase별 구현 계획

### Phase 1: API 보안 + 기본 구조 (현재 ✅ 완료)
- [x] fmp.ts API 키 process.env 전환
- [x] ai.ts 서버 전용 분리
- [x] /api/chart 프록시 라우트 생성
- [x] 클라이언트 훅 → fmp.ts 직접 import 제거
- [x] types.ts 분리 (클라이언트 안전)
- [x] .env.example 생성

### Phase 2: 차트 라이브러리 교체
- [ ] lightweight-charts 설치 및 설정
- [ ] CandlestickChart.tsx Recharts → lightweight-charts 마이그레이션
- [ ] 시간프레임 전환 기능 (1M/5M/15M/30M/1H/1D)
- [ ] Signal Strength 게이지 컴포넌트 구현

### Phase 3: 실시간 데이터 연동
- [ ] FMP API 키 발급 → .env.local 설정
- [ ] useMarketData/useNews/useChartData 실데이터 연동
- [ ] 10초/30초 자동 갱신 테스트
- [ ] 캐싱 전략 (ISR/revalidate)

### Phase 4: 채팅 + 인증
- [ ] WebSocket 채팅 (FastAPI 백엔드)
- [ ] JWT 인증 (로그인/회원가입)
- [ ] RBAC (member/pro/admin)

### Phase 5: 관리자 대시보드
- [ ] KPI 카드 (사용자, 매출, 전환율)
- [ ] 사용자 관리 테이블
- [ ] 상담 대기열
- [ ] 사용자 확보 추이 차트

---

## 🎯 최우선 작업 (지금 해야 할 것)

1. **CandlestickChart 교체**: Recharts는 캔들스틱에 부적합 → lightweight-charts
2. **SignalGauge 컴포넌트**: AI 신호 강도를 원형 게이지로 표시
3. **StatusBar 컴포넌트**: 하단 시스템 상태 표시바
4. **실시간 틱커**: 헤더에 NASDAQ/BTC/GOLD 실시간 가격 흐름
