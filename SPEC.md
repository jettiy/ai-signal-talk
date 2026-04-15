# AI 시그널톡 — 프로젝트 설계서

## 1. Concept & Vision

**"한국인을 위한 실시간 투자 시그널 + 트레이더 커뮤니티"**

네온 그린 다크 모드 기반의 전문가용 트레이딩 터미널. AI가 뉴스·시세·기술적 분석을 종합해서 **진입가/목표가/손절가**를 실시간 생성·보여주고, 트레이더들이 실시간 채팅으로 의견을 나누는 통합 플랫폼.

**핵심 가치:**
- 지연 없는 실시간 시그널 (FMP API + 폴링)
- AI가 분석 근거를 투명하게 제시 (신뢰도 %로 수치화)
- 한국어 최적화 UI

---

## 2. Design Language

### 색상 팔레트
```
--bg-primary:     #0D0D0D   (메인 배경)
--bg-secondary:   #1A1A1A   (카드/패널 배경)
--bg-tertiary:   #242424   (입력필드/보조)
--accent-green:  #00FF41   (네온 그린, CTA/상승)
--accent-red:    #FF3B3B   (하락/손절/위험)
--accent-yellow: #FFD700   (중립/관심)
--text-primary:  #FFFFFF
--text-secondary:#A0A0A0
--border:        #2D2D2D
```

### 타이포그래피
- Headings: `Pretendard` 또는 `Inter` (Google Fonts), 700~900
- Body: `Pretendard`, 400~500
- Code/Ticker: `JetBrains Mono`

### 레이아웃
- 사이드바: 64px 아이콘 Only (접으면 0)
- 헤더: 56px
- 메인 콘텐츠: flex-1, 패딩 24px
- 카드: rounded-xl, border 1px --border

### 모션
- 트랜지션: 200ms ease-out
- 카드 hover: scale(1.01) + border 색상 glow
- 시그널 생성: shimmer loading 애니메이션
- 차트: smooth draw animation

---

## 3. Pages

### / (landing — 공개)
- PRO 서비스 소개 + 상담 신청 폼
- 네온 그린 CTA: "신청 및 상담 시작하기"

### /login (공개)
- 이메일 + 비밀번호
- 로그인 상태 유지 체크박스
- "터미널 접속하기" 버튼

### /signup (공개)
- 아이디 중복확인 / 닉네임 중복확인
- 비밀번호: 영문+숫자 8자 이상
- 약관 동의 체크박스
- "회원가입 완료" → /signup/success

### /dashboard (인증 필요)
- **좌측 사이드바**: 차트 / 채팅 / 뉴스 / 랭킹 아이콘
- **우측 헤더**: 나스닥·골드·WTI 실시간 시세
- **중앙 3단 컬럼**:
  - 컬럼 1: 실시간 뉴스 피드 (LIVE FEED)
  - 컬럼 2: 실시간 채팅 (Community)
  - 컬럼 3: AI 시그널 분석 요약

### /dashboard/news
- 글로벌 뉴스 센터
- CRITICAL / HIGH / MEDIUM 태그
- Reuters, Bloomberg, CNN 출처
- 자산 영향 표시 (WTI LONG / EQUITY SHORT 등)

### /dashboard/chart
- lightweight-charts 캔들스틱
- 시간 프레임: 1M / 5M / 15M / 30M / 1H / 1D
- AI 시그널 오버레이 (진입가/목표가/손절가 표시)
- AI 분석 엔진 실행 버튼

---

## 4. Features & Interactions

### 실시간 시세
- FMP API → 10초 폴링
- NASDAQ, GOLD, WTI, S&P500, KOSPI
- 등락률 색상: 상승=green, 하락=red

### AI 시그널 생성
- 트리거: 버튼 클릭 또는 자동 (5분마다)
- 모델: MiniMax MiMo / DeepSeek / GPT-4o 병렬 호출 → cheapest 응답 선택
- 출력: 진입가, 목표가, 손절가, 신뢰도 %, 근거 요약
- 폴백: cheapest 실패 시 다음 모델

### 뉴스 피드
- FMP News API (주식 뉴스) + Finnhub (글로벌)
- 태그: CRITICAL(red) / HIGH(orange) / MEDIUM(yellow) / LOW(gray)
- 실시간 업데이트: 30초 폴링

### 커뮤니티 채팅
- 실시간: Polling (5초) 또는 WebSocket (향후)
- 등급: WHALE / TOP 1% / PRO_SCALPER 등
- AI 챗봇 응답 (SIGNAL Bot Analysis)

### PRO 상담 신청
- 이름 + 연락처 + 이메일
- 제출 → DB 저장 → 관리자 알림

---

## 5. Component Inventory

### `<Sidebar>`
- 아이콘 5개: Chart, Chat, News, Rank, Settings
- 상태: expanded(64px) / collapsed(0px)
- hover: 아이콘 glow 효과

### `<Header>`
- 좌: 로고
- 중앙: 시세 티커 ( NASDAQ / GOLD / WTI )
- 우: 알림 아이콘 + 프로필

### `<NewsCard>`
- 상태: CRITICAL / HIGH / MEDIUM / LOW
- 출처 뱃지 (Reuters 등)
- 시간
- 요약 텍스트
- 자산 영향 태그

### `<SignalCard>`
- 신뢰도 원형 게이지
- 진입가 / 목표가 / 손절가
- 손익비
- AI 근거 텍스트
- 로딩: shimmer 애니메이션

### `<ChatBubble>`
- 유저 등급 뱃지
- 메시지
- 시간

### `<CandlestickChart>`
- lightweight-charts 라이브러리
- 시간 프레임 선택
- AI 시그널 오버레이

---

## 6. Technical Approach

### 프론트엔드 (Vercel)
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query (폴링)
- Zustand (전역 상태)

### 백엔드 (Render)
- FastAPI (Python)
- PostgreSQL (Render DB)
- Redis (캐시, 폴링 결과)

### API Routes
```
GET  /api/market-data        → FMP 시세
GET  /api/news               → FMP + Finnhub 뉴스
POST /api/ai-signal          → AI 시그널 생성
GET  /api/ai-signal/[symbol] → 특정 종목 시그널
GET  /api/chat               → 채팅 메시지 목록
POST /api/chat               → 메시지 전송
POST /api/pro-application    → PRO 상담 신청
```

### AI 시그널 프롬프트 (핵심)
```
너는 전문 트레이더 AI야.
종목: {symbol}
현재가: {price}
오늘 뉴스: {news}
차트 데이터: {chart_data}

다음 항목을 반드시JSON으로 출력해:
{
  "entry_price": number,
  "target_price": number,
  "stop_loss": number,
  "confidence": number (0~100),
  "rationale": string (근거 2~3문장, 한국어),
  "timeframe": string,
  "signal_type": "LONG" | "SHORT"
}
```

### 데이터 플로우
```
1. 클라이언트가 /api/market-data 호출
2. 백엔드에서 FMP API 요청 (10초 캐시)
3. 응답 반환 + Redis 캐시
4. 클라이언트: TanStack Query로 폴링
```

### DB 스키마
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  nickname  String   @unique
  level     String   @default("LEVEL_01")
  createdAt DateTime @default(now())
}

model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  nickname  String
  grade     String
  content   String
  createdAt DateTime @default(now())
}

model ProApplication {
  id        String   @id @default(cuid())
  name      String
  phone     String
  email     String
  status    String   @default("PENDING")
  createdAt DateTime @default(now())
}

model AiSignal {
  id        String   @id @default(cuid())
  symbol    String
  entryPrice  Float
  targetPrice Float
  stopLoss   Float
  confidence  Int
  rationale   String
  signalType  String
  createdAt  DateTime @default(now())
}
```

---

## 7. 파일 구조

```
ai-signal-talk/
├── SPEC.md
├── prisma/schema.prisma
├── .env.example
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  (landing)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── signup/success/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            (대시보드 레이아웃 + 사이드바)
│   │   │   ├── page.tsx              (메인: 뉴스+채팅+시그널 3단)
│   │   │   ├── news/page.tsx
│   │   │   └── chart/page.tsx
│   │   └── api/
│   │       ├── market-data/route.ts
│   │       ├── news/route.ts
│   │       ├── ai-signal/route.ts
│   │       └── chat/route.ts
│   ├── components/
│   │   ├── ui/                       (재사용 컴포넌트)
│   │   ├── layout/                   (Sidebar, Header)
│   │   ├── dashboard/                (DashboardCards)
│   │   └── charts/                   (CandlestickChart)
│   ├── lib/
│   │   ├── fmp.ts                    (FMP API client)
│   │   ├── finnhub.ts                (Finnhub client)
│   │   ├── ai.ts                     (AI 호출: MiMo/DeepSeek/GPT)
│   │   ├── auth.ts                   (NextAuth)
│   │   └── utils.ts
│   └── hooks/
│       ├── useMarketData.ts
│       ├── useNews.ts
│       └── useAiSignal.ts
```
