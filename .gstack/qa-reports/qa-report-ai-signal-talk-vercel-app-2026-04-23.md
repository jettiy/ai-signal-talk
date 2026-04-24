# QA Report — AI 시그널톡 v2

**Date:** 2026-04-23  
**Tester:** Hermes (gstack /qa-only)  
**URL:** https://ai-signal-talk.vercel.app  
**Backend:** https://ai-signal-talk-backend.onrender.com  
**Duration:** ~8 min  
**Framework:** Next.js 16 + React 19  
**Pages tested:** 6 (로그인, 회원가입, 커뮤니티, AI시그널, 뉴스룸, PRO전환)

---

## Health Score: 82 / 100

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Console | 70 | 15% | 10.5 |
| Links | 100 | 10% | 10.0 |
| Visual | 85 | 10% | 8.5 |
| Functional | 85 | 20% | 17.0 |
| UX | 80 | 15% | 12.0 |
| Performance | 90 | 10% | 9.0 |
| Content | 80 | 5% | 4.0 |
| Accessibility | 75 | 15% | 11.3 |
| **Total** | | | **82.3** |

---

## Issues Found: 7

### ISSUE-001 | Medium | Functional
**유저 닉네임이 "나"로 표시됨**  
채팅 메시지에서 방금 가입한 유저의 닉네임이 "QA테스터"가 아닌 "나"로 표시됨. 아바타도 "나" 이니셜.  
- **Repro:** 회원가입(닉네임: QA테스터) → 로그인 → 커뮤니티 탭 → 채팅 입력 → 유저명이 "나"로 표시  
- **Expected:** 닉네임 "QA테스터" 또는 이니셜 "QA" 표시  
- **Actual:** "나" 표시  

### ISSUE-002 | Low | Content
**티커바 데이터 중복 스크롤**  
상단 틱커바가 같은 11개 심볼 데이터가 두 번 반복해서 스크롤됨 (나스닥선물~나스닥ETF → 다시 나스닥선물~나스닥ETF). 무한 스크롤 구현 시 복사본이 visible.  
- **Repro:** 대시보드 진입 → 틱커바 관찰  
- **Expected:** 한 세트만 자연스럽게 무한 스크롤  
- **Actual:** 동일 데이터 2세트가 연속으로 보임  

### ISSUE-003 | Low | Visual
**PRO 전환 탭 — 이모지 사용**  
프로젝트 컨벤션에 "이모지 금지" 규칙이 있으나, 회원가입 성공 페이지에 "🔒 ENCRYPTED" "🟢 SYSTEM STABLE" 이모지가 사용됨.  
- **Repro:** 회원가입 완료 → 성공 화면  
- **Files:** signup/success page  

### ISSUE-004 | Medium | Content
**공포&탐욕 지수 라벨 불일치**  
뉴스룸 시장 심리 지표에서 값이 68(탐욕)인데 왼쪽 라벨이 "극도의 공포"로 표시됨.  
- **Repro:** 뉴스룸 탭 → 시장 심리 지표 섹션  
- **Expected:** "탐욕" (값 68과 일치)  
- **Actual:** "극도의 공포" (값과 불일치)  

### ISSUE-005 | Low | Visual
**AI 시그널 우측 패널 — 혼합 언어 텍스트**  
AI 시그널 패널에서 "ENTRY PRICE", "TARGET", "STOP LOSS"가 영어로 표시되고, "진입가", "손절가", "목표가"가 한국어로도 표시됨. UI 언어가 혼재.  
- **Repro:** AI 시그널 탭 → 우측 분석 패널  
- **Expected:** 한국어 UI 통일 ("진입가", "목표가", "손절가")  

### ISSUE-006 | Medium | Functional
**채팅 유저 표시명이 항상 "나"**  
CommunityPanel에서 현재 로그인한 유저의 메시지가 모두 "나" 아바타와 "나" 닉네임으로 표시. localStorage의 user.nickname 대신 "나"를 하드코딩한 것으로 추정.  
- **Repro:** 채팅 전송 → 자신의 메시지 확인  
- **Impact:** 모든 유저가 "나"로 보이면 채팅 UX 저하  

### ISSUE-007 | Info | Console
**2개 JS Exception 감지**  
대시보드 로딩 시 콘솔에 2개의 exception이 기록됨 (메시지 내용은 빈 문자열). 페이지 동작에는 영향 없으나 정리 권장.  

---

## Top 3 Things to Fix

1. **ISSUE-006**: 채팅 유저 표시명 "나" 버그 — 모든 유저가 같은 이름으로 보이는 건 치명적 UX 결함
2. **ISSUE-004**: 공포&탐욕 지수 라벨 불일치 — 잘못된 정보 표시는 금융 서비스에서 신뢰도 하락
3. **ISSUE-001**: 닉네임 "나" 표시 — ISSUE-006과 동일 원인 가능성, 유저 식별 불가

---

## Pages Visited & Status

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| 로그인 | / | ✅ PASS | 폼, 회원가입 링크 정상 |
| 회원가입 | /signup | ✅ PASS | 유효성 검증, 비밀번호 강도 UI 정상 |
| 회원가입 성공 | /signup/success | ✅ PASS | OPERATOR ID 자동 생성 |
| 커뮤니티 | /dashboard | ✅ PASS | 뉴스피드, 채팅, 미니시그널 정상 |
| AI 시그널 | /dashboard (signal tab) | ✅ PASS | 차트, 확률도넛, 가격타겟, 경제캘린더 정상 |
| 뉴스룸 | /dashboard (news tab) | ✅ PASS | 카테고리 필터, 히어로카드, 심리지표 정상 |
| PRO 전환 | /dashboard (pro tab) | ✅ PASS | 랜딩→신청폼 전환, 닉네임 자동채움 정상 |
| 로그아웃 | - | ✅ PASS | localStorage 정리 후 로그인 페이지 이동 |

---

## API Endpoints Tested

| Endpoint | Status | Response |
|----------|--------|----------|
| Backend /api/health | ✅ 200 | `{status:"ok", version:"2.1.0", db:true, auth:true, websocket:true}` |
| Frontend /api/auth/login | ✅ 200 | JWT 토큰 반환 + /me 유저 정보 조회 |
| Frontend /api/auth/register | ✅ 200 | 회원가입 성공, OPERATOR ID 생성 |
| @AI 채팅 (Z.AI) | ✅ 200 | "골드 시장은 인플레이션 우려와..." 정상 응답 |

---

## Baseline

```json
{
  "date": "2026-04-23",
  "url": "https://ai-signal-talk.vercel.app",
  "healthScore": 82,
  "issues": [
    {"id": "ISSUE-001", "title": "유저 닉네임 '나' 표시", "severity": "medium", "category": "functional"},
    {"id": "ISSUE-002", "title": "티커바 데이터 중복", "severity": "low", "category": "content"},
    {"id": "ISSUE-003", "title": "이모지 사용 (컨벤션 위반)", "severity": "low", "category": "visual"},
    {"id": "ISSUE-004", "title": "공포탐욕지수 라벨 불일치", "severity": "medium", "category": "content"},
    {"id": "ISSUE-005", "title": "UI 언어 혼재 (영어/한국어)", "severity": "low", "category": "visual"},
    {"id": "ISSUE-006", "title": "채팅 유저명 항상 '나'", "severity": "medium", "category": "functional"},
    {"id": "ISSUE-007", "title": "빈 JS Exception 2개", "severity": "info", "category": "console"}
  ],
  "categoryScores": {
    "console": 70,
    "links": 100,
    "visual": 85,
    "functional": 85,
    "ux": 80,
    "performance": 90,
    "content": 80,
    "accessibility": 75
  }
}
```

---

## Summary

**Overall: 시그널톡 v2는 핵심 플로우가 모두 정상 작동합니다.** 회원가입→로그인→4개 탭 전환→AI 채팅→로그아웃까지 전체 플로우가 막힘없이 돌아갑니다. 

가장 시급한 건 **채팅 유저명 "나" 버그** (ISSUE-001/006). 금융 커뮤니티에서 유저를 식별할 수 없으면 채팅 기능의 가치가 크게 떨어집니다. 둘은 같은 원인일 가능성이 높아 한 번에 수정 가능합니다.

공포&탐욕 지수 라벨 불일치(ISSUE-004)도 잘못된 정보를 보여주는 거라 빠른 수정이 필요합니다.
