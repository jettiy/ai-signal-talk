---
version: alpha
name: AI SignalTalk
description: 전문가용 트레이딩 터미널 — 네온 그린 다크 모드 기반 실시간 투자 시그널 플랫폼. 캔들스틱 차트와 글로우 효과로 트레이딩 전문성을 강조.

colors:
  primary: "#00FF41"
  bg-primary: "#0D0D0D"
  bg-secondary: "#1A1A1A"
  bg-tertiary: "#242424"
  accent-green: "#00FF41"
  accent-red: "#FF3B3B"
  accent-yellow: "#FFD700"
  text-primary: "#FFFFFF"
  text-secondary: "#A0A0A0"
  border: "#2D2D2D"
  green-glow: "#00FF41"
  green-bg: "#00FF41"
  green-border: "#00FF41"
  red-bg: "#FF3B3B"
  red-border: "#FF3B3B"
  yellow-bg: "#FFD700"
  yellow-border: "#FFD700"

typography:
  h1:
    fontFamily: "Toss Product Sans"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Toss Product Sans"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  h3:
    fontFamily: "Toss Product Sans"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  body-md:
    fontFamily: "Toss Product Sans"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.02em"
  body-sm:
    fontFamily: "Toss Product Sans"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Toss Product Sans"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.02em"
  number:
    fontFamily: "JetBrains Mono"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0em"
  number-lg:
    fontFamily: "JetBrains Mono"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0em"
  code:
    fontFamily: "JetBrains Mono"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"

rounded:
  xs: 4px
  sm: 6px
  md: 12px
  lg: 16px
  xl: 20px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 20px
  xl: 24px
  2xl: 32px
  3xl: 48px

components:
  card:
    backgroundColor: "{colors.bg-secondary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  card-sm:
    backgroundColor: "{colors.bg-secondary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.base}"
  btn-green:
    backgroundColor: "{colors.accent-green}"
    textColor: "#000000"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  btn-green-hover:
    backgroundColor: "{colors.accent-green}"
    textColor: "#000000"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  btn-outline:
    backgroundColor: transparent
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  btn-outline-hover:
    backgroundColor: transparent
    textColor: "{colors.accent-green}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  badge-green:
    backgroundColor: "{colors.green-bg}"
    textColor: "{colors.accent-green}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xs}"
  badge-red:
    backgroundColor: "{colors.red-bg}"
    textColor: "{colors.accent-red}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xs}"
  badge-yellow:
    backgroundColor: "{colors.yellow-bg}"
    textColor: "{colors.accent-yellow}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xs}"
  input:
    backgroundColor: "{colors.bg-tertiary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
---

## Overview

AI 시그널톡은 한국인 트레이더를 위한 실시간 투자 시그널 플랫폼입니다. 다크 터미널 환경에서 네온 그린(#00FF41)을 핵심 악센트로 사용하며, 캔들스틱 차트와 글로우 효과로 트레이딩 전문성을 시각적으로 강조합니다. AI 클리셰가 아닌 실제 트레이딩 터미널(TradingView, Bloomberg Terminal)의 밀도감과 정밀함을 추구합니다.

## Colors

- **primary (#00FF41):** 네온 그린. CTA, 상승, 매수, 활성 상태. 터미널의 핵심 색상. 글로우 효과와 함께 사용.
- **bg-primary (#0D0D0D):** 메인 배경. 거의 블랙에 가까운 딥 그레이. 시인성 높은 터미널 느낌.
- **bg-secondary (#1A1A1A):** 카드/패널 배경. bg-primary와의 미묘한 분리.
- **bg-tertiary (#242424):** 입력필드/보조 영역. interactive 요소의 배경.
- **accent-green (#00FF41):** primary와 동일. CTA, 상승, 매수.
- **accent-red (#FF3B3B):** 하락, 매도, 손절, 위험. 그린과 완전한 대비.
- **accent-yellow (#FFD700):** 중립, 관심, 대기 상태. 보조 악센트.
- **text-primary (#FFFFFF):** 주 텍스트. 배경과 최대 대비.
- **text-secondary (#A0A0A0):** 보조 텍스트. 라벨, 설명, 메타 정보.
- **border (#2D2D2D):** 경계선. 시각적 분리는 하되 과도한 대비는 피함.

### 투명도 오버레이 규칙 (실제 구현 시 CSS 적용)
DESIGN.md 스펙은 hex만 지원하므로, rgba 오버레이는 구현 시 적용합니다:

- **green-bg**: `rgba(0,255,65,0.12)` — 뱃지/태그 배경
- **green-border**: `rgba(0,255,65,0.3)` — 뱃지/태그 보더
- **red-bg**: `rgba(255,59,59,0.12)` — 하락 뱃지 배경
- **red-border**: `rgba(255,59,59,0.3)` — 하락 뱃지 보더
- **yellow-bg**: `rgba(255,215,0,0.12)` — 관심 뱃지 배경
- **yellow-border**: `rgba(255,215,0,0.3)` — 관심 뱃지 보더
- **green-glow**: `rgba(0,255,65,0.4)` — 박스 섀도우 전용

### 글로우 효과 규칙
- `box-shadow: 0 0 12px rgba(0,255,65,0.4)` — 카드/버튼 활성
- `text-shadow: 0 0 8px rgba(0,255,65,0.6)` — 텍스트 글로우
- `box-shadow: 0 0 16px rgba(0,255,65,0.3)` — hover 시 강화
- 글로우는 green에만 적용. red/yellow는 글로우 없음.

### 보더 규칙 (컴포넌트 외부 정의)
컴포넌트 토큰에 borderColor가 미지원이므로, 보더는 다음 규칙으로 통일 적용:

- 카드: `border: 1px solid var(--border)` (#2D2D2D)
- 뱃지: `border: 1px solid` + 각 색상 30% 투명도
- 입력필드: `border: 1px solid var(--border)`, focus 시 `border-color: var(--accent-green)`
- btn-outline: `border: 1px solid var(--border)`, hover 시 `border-color: var(--accent-green)`

## Typography

### 폰트 계층
- **Toss Product Sans**: 모든 UI 텍스트. CDN(`static.toss.im/tps/main.css`)으로 로드.
- **Pretendard**: Toss 미지원 환경 폴백. CDN(`fonts.googleapis.com`)으로 로드.
- **JetBrains Mono**: 숫자, 코드, 가격, 심볼. 등폭으로 정렬이 중요한 데이터 영역.

### 자간(letter-spacing)과 행간(line-height)
한글 타이포그래피의 핵심은 자간과 행간에서 나옵니다. 폰트만 바꾸는 것으로는 부족합니다.

- **제목(h1~h3)**: `letter-spacing: -0.02em`. 한글은 자간이 넓어 시각적으로 느슨해 보이므로 살짝 줄여야 정돈된 느낌.
- **본문(body-md)**: `letter-spacing: -0.02em`, `line-height: 1.6`. 한글은 베이스라인이 영어보다 아래쪽에 있어 1.5 미만이면 줄이 붙어 보임. 네이버/다음/리디북스/토스 모두 1.3~1.6 범위 사용.
- **라벨(label)**: `letter-spacing: 0.02em`. 소문자 라벨은 약간 넓은 자간으로 가독성 확보.
- **숫자(number)**: `letter-spacing: 0em`. 등폭 폰트이므로 자간 조정 불필요.
- **행간 하한선**: 한글 본문은 절대 1.5 미만으로 내리지 않음. 답답해 보임.

## Layout

- **8px 그리드**: 모든 간격은 8px 배수. 4px은 예외적으로 타이트한 영역에만 허용.
- **사이드바**: 72px 고정폭. 아이콘만 표시.
- **카드 내부 패딩**: 16px(기본) ~ 24px(여유).
- **컴포넌트 간 간격**: 8px(밀집) ~ 16px(기본) ~ 24px(분리).

## Elevation & Depth

- **카드**: `border: 1px solid var(--border)` + bg-secondary. 그림자 없이 보더로만 분리.
- **드롭다운/모달**: bg-secondary + `box-shadow: 0 8px 32px rgba(0,0,0,0.5)`.
- **글로우 활성**: green 악센트 요소에만 `box-shadow: 0 0 12px rgba(0,255,65,0.4)` 적용.
- **z-index 계층**: sidebar(10) < dropdown(20) < modal(30) < toast(40).

## Shapes

- **xs(4px)**: 인라인 태그, 칩.
- **sm(6px)**: 뱃지, 작은 버튼.
- **md(12px)**: 버튼, 입력필드, 카드-sm.
- **lg(16px)**: 메인 카드, 패널.
- **full(9999px)**: 아바타, 원형 인디케이터.

## Components

### 카드 (card / card-sm)
모든 콘텐츠 영역의 기본 컨테이너. bg-secondary + border 조합으로 시각적 분리. 그림자 없음.

### 버튼 (btn-green / btn-outline)
- **btn-green**: 유일한 primary CTA. 배경 #00FF41에 검정 텍스트. hover 시 글로우 강화.
- **btn-outline**: secondary 액션. 투명 배경 + border. hover 시 border/text가 green으로 전환.
- 버튼 내부 아이콘은 텍스트와 6px 간격.

### 뱃지 (badge-green / badge-red / badge-yellow)
상태/방향 표시. bg 12% 투명도 + border 30% 투명도. 텍스트는 11px/600. 인라인 flex.

### 입력필드 (input)
bg-tertiary + border. focus 시 border-color가 accent-green으로 전환. placeholder는 text-secondary.

## Do's and Don'ts

### Do
- ✅ 네온 그린(#00FF41) 글로우로 트레이딩 터미널 느낌 유지
- ✅ 한글 본문 행간 1.5~1.6 유지
- ✅ 자간 -0.02em로 정돈된 타이포그래피
- ✅ 8px 그리드 기반 간격
- ✅ JetBrains Mono로 숫자/가격 정렬
- ✅ Toss Product Sans를 모든 UI 텍스트에 일관 적용
- ✅ 글로우 효과는 green 악센트에만 제한적 사용

### Don't
- ❌ AI 클리셰 사용 (뉴럴 네트워크, 스파클, 다이아몬드, 회로선)
- ❌ 이모지를 UI 요소로 사용 (종목명은 텍스트만, 방향은 "매수/매도")
- ❌ 라이트 모드 지원 (다크 전용)
- ❌ red/yellow에 글로우 효과 적용
- ❌ 한글 본문 행간 1.5 미만으로 설정
- ❌ 정의되지 않은 색상/폰트사이즈 임의 생성
- ❌ 여러 폰트 패밀리 혼용 (Toss + Pretendard + JetBrains Mono만 허용)
