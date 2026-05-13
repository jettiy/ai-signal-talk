# 보안 점검 요약 및 체크리스트

이 문서는 `ai-signal-talk`(Next.js)과 `ai-signal-talk-backend`(FastAPI) 코드를 기준으로 한 **현재 상태 요약**과 **우선순위별 할 일**입니다. 배포(Vercel·Render)·도메인 설정이 바뀔 때마다 함께 검토하세요.

---

## 1. 이미 잘 되어 있는 부분

| 영역 | 내용 |
|------|------|
| 비밀번호 저장 | 백엔드 `auth.py`에서 **bcrypt** 해시 사용 (`get_password_hash` / `verify_password`). |
| DB 접근 | ORM·바인딩 기반 쿼리가 대부분이며, `text()`로 실행하는 SQL은 **고정 문자열**(마이그레이션·헬스체크) 위주. |
| 관리 API | `/api/v2/admin/*` 등은 `require_admin` 등으로 **역할 검증** 후 접근. |
| 시크릿 호출 | `ZAI_API_KEY`, `FMP_API_KEY` 등은 **서버 전용** `process.env`에서만 사용(클라이언트 번들에 `NEXT_PUBLIC_`로 노출되지 않도록 유지). |
| CORS | 허용 Origin이 **화이트리스트**(기본값 + `ALLOWED_ORIGINS` / `FRONTEND_URL`)로 제한되는 구조. |
| WebSocket | 토큰이 없거나 JWT 디코드·유저 조회 실패 시 **연결 종료**(코드 4001). |
| HTTPS | 운영은 Vercel·Render 기본 HTTPS 사용 전제. |

---

## 2. 코드 검토에서 확인된 리스크·주의점

1. **JWT 서명 키**  
   `SECRET_KEY`가 환경 변수에 없으면 개발용 기본값(`dev-secret-key-not-for-production` 등)으로 동작합니다. **프로덕션에서는 반드시 강한 랜덤 키**를 Render에 설정하세요.

2. **액세스 토큰 수명**  
   현재 약 **7일**(`ACCESS_TOKEN_EXPIRE_MINUTES`). 탈취 시 노출 기간이 깁니다. 리프레시 토큰 분리·짧은 액세스 토큰·로그아웃 시 블록리스트 등을 검토할 가치가 있습니다.

3. **로그인·회원가입 레이트 리밋 없음**  
   무차별 대입·이메일 열거에 취약할 수 있습니다. **IP/계정 단위 제한**(미들웨어·Cloudflare·Render 앞단 WAF 등)을 권장합니다.

4. **공개 중복 확인 API** (`check-email` / `check-nickname`)  
   정상 기능이지만, **이메일·닉네임 존재 여부 추론**에 사용될 수 있습니다. 레이트 리밋·CAPTCHA·모니터링을 고려하세요.

5. **WebSocket에서 토큰이 Query String**  
   `?token=` 형태는 **프록시·액세스 로그**에 남기 쉽습니다. 가능하면 **첫 메시지로 토큰 전송** 또는 **쿠키 기반**(SameSite, 도메인 정합) 등으로 개선 여지가 있습니다.

6. **프론트 `localStorage`에 JWT 저장**  
   **XSS가 한 번이라도 발생하면 토큰 유출**로 이어집니다. CSP 강화·입력·렌더링 이스케이프·의존성 취약점 점검이 중요합니다.

7. **Next.js 보안 헤더**  
   `next.config`에 **CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`** 등이 아직 없습니다. Vercel 헤더 설정과 병행해 추가하는 것을 권장합니다.

8. **관리자 초기 비밀번호**  
   `ADMIN_PASSWORD` 미설정 시 코드 기본값에 의존할 수 있습니다. **첫 배포 직후 강제 변경**·비밀번호를 시크릿만으로 주입하세요.

---

## 3. 실행 체크리스트 (복사해 진행 상황 관리)

### 인프라·시크릿

- [ ] Render에 **`SECRET_KEY`** 설정(32바이트 이상 랜덤, 재사용 금지).
- [ ] **`DATABASE_URL`**·`ADMIN_PASSWORD`·`ZAI_API_KEY` 등은 Render/Vercel **Secret**으로만 관리하고 레포·로그에 남기지 않기.
- [ ] 퇴사·키 유출 시 **키 로테이션** 절차 정의(JWT는 모든 사용자 재로그인 유발 가능 안내).
- [ ] GitHub **Dependabot** 또는 `npm audit` / `pip-audit` 주기 실행.

### 백엔드 (FastAPI)

- [ ] 프로덕션에서 **`SECRET_KEY` 미설정 시 기동 실패**하도록 가드(선택: `if os.getenv("ENV")=="production" and not SECRET_KEY: raise`).
- [ ] **`/api/v2/auth/login`·`register`·`check-email`·`check-nickname`**에 레이트 리밋(예: `slowapi` 또는 리버스 프록시 규칙).
- [ ] **로그인 실패** 시 동일한 메시지 유지(계정 존재 여부 노출 최소화) — 현재는 이메일/비밀번호 통합 메시지 형태 유지 권장.
- [ ] **헬스체크** `/api/health`가 내부 정보를 과도하게 노출하지 않는지 확인(현재는 `version`, `db` 정도).
- [ ] WebSocket **메시지 길이·빈도** 상한(이미 길이 제한 있음)과 **에러 로그**에 토큰·PII가 찍히지 않도록 검토.

### 프론트엔드 (Next.js)

- [ ] Vercel·`next.config`에 **보안 헤더**(CSP는 단계적 도입: 리포트 전용 모드부터 검토).
- [ ] **`NEXT_PUBLIC_*`**에 API 키·백엔드 시크릿이 없는지 재확인.
- [ ] 관리자 페이지가 **`access_token`**으로 API 호출하는지 확인(로그인 플로우와 키 이름 통일).
- [ ] XSS 방지: `dangerouslySetInnerHTML` 사용부·외부 HTML 렌더링·사용자 입력이 DOM에 들어가는 모든 경로 점검.

### Web·도메인

- [ ] **CORS** `ALLOWED_ORIGINS`에 운영 도메인만 포함(개발용 localhost는 프로덕션 빌드에서 제외 검토).
- [ ] **쿠키**를 도입할 경우 `Secure`, `HttpOnly`, `SameSite` 정책 명시.
- [ ] **signalchart.kr** 등 커스텀 도메인에 **HTTPS 강제**(Vercel 기본 + 필요 시 HSTS).

### 운영·절차

- [ ] **백업·복구** 테스트(Postgres 스냅샷 주기).
- [ ] **침해 사고 대응**: 토큰 폐기, `SECRET_KEY` 교체, 사용자 비밀번호 재설정 안내 문구 준비.
- [ ] **개인정보**: 수집 항목·보관 기간이 개인정보 처리방침과 일치하는지 법무 검토.

---

## 4. 이번에 반영한 코드 수정

- **관리자 페이지** `getToken()`이 `localStorage`의 **`token`**을 읽고 있어 로그인 후 저장 키인 **`access_token`**과 불일치했습니다. **`access_token`으로 통일**하여 관리 API 호출이 정상·안전하게 동작하도록 수정했습니다.

---

## 5. 다음 권장 작업 (우선순위 높음)

1. 프로덕션 **`SECRET_KEY` 강제** 및 기본값 제거 또는 기동 시 경고/실패.  
2. **로그인·회원가입·중복확인** 레이트 리밋.  
3. **`next.config` / Vercel** 보안 헤더.  
4. 장기적으로 **토큰 저장소**(httpOnly 쿠키 + CSRF 대응) 또는 **BFF 세션** 검토.

문서 개정일: 배포·코드 변경 시마다 상단에 날짜를 적어 두면 추적에 유리합니다.
