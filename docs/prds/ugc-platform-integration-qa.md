---
prd_id: ugc-platform-integration-qa
title: "UGC Platform — 통합 QA (Phase 1/2/3)"
domain: ZZEM
status: "초안"
depends_on:
  - products/ugc-platform/phase-1-profile (ugc-platform-001)
  - products/ugc-platform/phase-2-feed-payback (ugc-platform-002)
  - products/ugc-platform/phase-3-social-notification (ugc-platform-003)
description: "Phase 1/2/3 의 누적 기능을 end-to-end 로 자동화 검증하고, 누적 carryover 및 세션 중 발견된 잠재 이슈를 정리한다."
created_at: "2026-04-23"
created_by: zach@wrtn.io
schema_version: 1
---

# UGC Platform — 통합 QA (Phase 1/2/3)

> 📌 본 PRD 는 **기능 추가 스프린트가 아닌 QA/안정화 스프린트** 다. 3 Phase 의 ugc-platform-001/002/003 을 통합 검증 + 누적 carryover 해소 + 세션 중 발견된 환경/런타임 이슈를 구조화한다.

## Motivation

### 1. 3 스프린트 누적 carryover 존재

- **AC-2.3 (Phase 1)**: 프로필 공유 native sheet — 3 스프린트 연속 manual QA pending
- **AC-7.4 Phase 1**: 존재하지 않는 userId 딥링크 → ErrorNotFound — **ugc-platform-003 세션 중 Maestro 로 해소**, 단 regression 보호 필요
- **ugc-platform-003 Minor 14건** (retrospective/deferred-items.yaml): 대부분 integration test / testID / copy / helper 통합 등 품질 개선 항목

### 2. ugc-platform-003 QA 세션 중 발견된 실제 결함 + 환경 이슈

- **Runtime crash (수정 완료, 재발 방지 필요)**: `Typo.Caption1` 사용 → `@wrtn/app-design-guide` 의 Typo enum 에 Caption1 미존재 → `ScreenErrorBoundaryUnknownException`. Phase 1 시절부터 profile-edit.screen.tsx 에도 동일 패턴 존재 (조건부 렌더로 미발현).
- **`.env` 배포 path 불일치 (잠재 이슈)**: `AUTH_API_URL='https://api.dev.wrtn.club'` 이나 실제 배포는 `/apple/` prefix. Phase 1 부터 gitignored `.env` 에 동일 값. dev/prod 분기 정책 재확인 필요.
- **Airbridge vs RN Linking 이중 routing (일부 환경 drop)**: `zzem://e2e-auth` 만 RN Linking 직접 처리, 나머지 `zzem://*` 는 Airbridge 경유. Google Play 계정 미로그인 Android 에뮬레이터 등 특정 환경에서 deeplink silent drop.
- **IAP init crash (에뮬레이터 한계)**: `react-native-iap` 가 Play Billing 초기화 실패 → unhandled promise rejection → 때때로 splash stuck. Play 계정 로그인 된 환경에서는 정상.
- **Token refresh 자동화 차단**: `dev-auth-api.wrtn.io` 가 VPN 필요. 로컬 QA 시 수동 토큰 주입 반복.

### 3. Cross-phase integration scenario 미검증

단위 Phase 별 검증은 스프린트마다 수행됐으나, **3 Phase 가 유기적으로 연결되는 시나리오** 가 end-to-end 로 검증 안 된 상태. 예:
- 콘텐츠 생성(0) → 공개(2) → 타 유저 좋아요(2) → 페이백(2) → **페이백 알림 배치(3)**
- 유저 생성(1) → 팔로우(3) → **팔로우 알림(3)** → 언팔로우
- 콘텐츠 신고(3) → 피드 제외(3) → **신고자 차단(3)** → 프로필 접근 차단(3) → 차단 해제 시 팔로우 미복원

### 4. Regression guard 보강

Phase 2 release 시 Phase 1 회귀 여부, Phase 3 release 시 Phase 1/2 회귀 여부 — 각 스프린트의 retrospective 에 언급되나 누적 통합 검증 부재.

---

## Overview

### 구현 범위

1. **Seed data 인프라 완성** — 7개 `fetch-seed-*.mjs` 구현 + BE test-seed endpoint 연동
2. **E2E flow 안정화** — ugc-platform-003 의 7개 미통과 flow 수정 + 신규 integration flow
3. **런타임 crash 방지 게이트** — `@wrtn/app-design-guide` Typo enum 범위 준수 grep 자동화
4. **환경 정합 정리** — `.env` 예시 / dev 배포 path / Airbridge config 문서화
5. **Token refresh 자동화** — VPN 의존성 해소 또는 CI 내에서만 사용하도록 분리
6. **Manual QA carryover 종결** — AC-2.3 최종 QA
7. **Cross-phase integration flow** — 3 Phase 연결 시나리오 E2E
8. **Regression dashboard** — 매 스프린트 후 자동 full-suite 실행 가능한 상태

---

## User Stories & Acceptance Criteria

### US1: QA 엔지니어의 자동 검증 경로 확보

유저(QA)로서, 3 Phase 의 모든 AC 가 회귀 없이 작동하는지 한 번의 명령으로 검증하고 싶다.

#### AC 1.1: E2E full suite 명령 1개로 22+ flow 실행
- Given 사전에 seed data 가 준비된 상태에서
- When `yarn workspace MemeApp e2e:auth` 를 실행하면
- Then 22+ flow 가 순차 실행되며 각 flow 의 PASS/FAIL 이 stdout 에 집계됨
- Then 실패 flow 는 스크린샷 + logcat snippet 이 `artifacts/` 디렉토리에 저장됨

#### AC 1.2: 7개 미통과 flow 전부 PASS
ugc-platform-003 세션에서 다음 flow 가 seed/testID/copy 이슈로 FAIL:
- `follow-button-tap.yaml` (seed target user 필요)
- `my-profile-follower-list.yaml` (seed follower)
- `my-profile-following-list.yaml` (seed following)
- `other-user-profile-block.yaml` ("차단하시겠어요" copy 또는 sheet 렌더)
- `settings-block-management.yaml` (seed blocked user)
- `swipe-feed-content-report.yaml` (`swipe-feed.more-button` testID)
- `settings-notification-settings.yaml` (이미 크래시 fix 됨 — regression)

각 flow 가 **seed 주입 후 PASS** 여야 함.

#### AC 1.3: Regression flow 정의
- Given Phase 2 merged + Phase 3 merged 이후
- When Phase 1 의 21개 flow 전체 실행 시
- Then 전부 PASS
- Phase 2 flow 도 Phase 3 이후 회귀 없음

---

### US2: Seed data 인프라

유저(QA)로서, E2E 실행 전에 필요한 seed data 를 자동으로 준비하고 싶다.

#### AC 2.1: 7개 seed fetcher 구현
- `apps/MemeApp/e2e/scripts/` 하위에 다음 파일 존재:
  - `fetch-seed-follow-target.mjs`
  - `fetch-seed-follower-list.mjs`
  - `fetch-seed-following-list.mjs`
  - `fetch-seed-block-target.mjs`
  - `fetch-seed-blocked-list.mjs`
  - `fetch-seed-reportable-content.mjs`
  - `fetch-seed-notifications.mjs`
- 각 fetcher 는 BE 호출 → ID/nickname 조회 → env 변수로 주입
- fetcher 실행 실패 시 stdout 에 원인 명시 (해당 flow 만 skip, 전체 중단 안 함)

#### AC 2.2: BE test-seed endpoint (선택)
- 특정 BE state (e.g. 블록 관계, 차단한 유저 1명) 가 필요한 경우, BE 가 `POST /v2/test/seed/:scenario` 류 endpoint 제공
- 운영 환경 배포 차단 (e.g. `if (ENV !== 'test' && ENV !== 'dev') throw`)
- 또는 별도 admin 스크립트 (Mongo 직접 조작) 경로

> 🚧 AC 2.2 는 scope 재협의 — BE 팀과 test 데이터 관리 전략 확정 후 결정.

---

### US3: 런타임 crash 방지 게이트

개발자로서, 존재하지 않는 `@wrtn/app-design-guide` variant 를 사용해 런타임 crash 를 만드는 PR 을 머지 전에 차단하고 싶다.

#### AC 3.1: Typo/VStack/HStack 등 variant 화이트리스트 grep 게이트
- CI 또는 pre-commit hook 에서:
  - `@wrtn/app-design-guide` 의 현재 export 를 스캔하여 Typo enum 등 whitelist 추출
  - 앱 코드 내 `Typo.<variant>` 사용 grep → whitelist 에 없는 variant 발견 시 에러
- 이번 세션에서 발견된 `Typo.Caption1` 같은 사례 재발 방지
- 기존 `profile-edit.screen.tsx:206, 208, 227` 의 Typo.Caption1 사용도 확인 대상 (조건부 렌더라 여태 안 잡혔을 수 있음)

#### AC 3.2: `Element type is invalid` 런타임 검증
- E2E smoke suite 에 **모든 screen 진입** 가이드 flow 포함 (screen 1회 mount 확인)
- screen 진입 시 `ScreenErrorBoundaryUnknownException` 발생 → Evaluator fail

---

### US4: 환경 정합 정리

개발자로서, 로컬 / dev / prod 환경의 URL/딥링크/인증 파이프라인 차이를 명확히 이해하고 싶다.

#### AC 4.1: `ApiInstance.Auth` base URL misalignment 해소 (P0 — 사용자 체감 버그)

**배경**:
앱 내 2개 독립 `ApiInstance` 가 서로 다른 base URL 사용:

| Instance | base URL (.env) | `/apple` | 사용처 | hits |
|----------|----------------|----------|--------|------|
| `ApiInstance.Wrtn` | `WRTN_API_URL='https://api.dev.wrtn.club/apple'` | ✅ | credit, meme(home/filters), utils, dialog, survey, custom-prompt (Phase 0) | 37 |
| `ApiInstance.Auth` | `AUTH_API_URL='https://api.dev.wrtn.club'` | ❌ | me-contents, notification, profile, user-profile, follow, user-block, content-report (**Phase 1/2/3 `/v2/*` 전부**) | 32 |

실제 배포는 `/apple/meme/v2/*` 경로에 있으므로 `ApiInstance.Auth` 를 사용하는 모든 `/v2/*` endpoint 가 **404 반환**. `ApiInstance.Auth` 는 이름만 Auth 이지 실제 auth (토큰 refresh `dev-auth-api.wrtn.io`) 와 무관, 잘못된 네이밍 + 잘못된 base URL 조합.

**여태 드러나지 않은 이유**:
- `useGetMyProfileUseCase` 실패 → `myProfile === undefined` → ProfileScreen empty state 로 graceful fallback
- `useGetMyContentsUseCase` 실패 → 빈 배열 → "아직 공개한 콘텐츠가 없어요" empty state
- 사용자는 app crash 없이 "아직 아무것도 없는 상태" 로 인지 → **ugc-platform-003 QA 에서 Maestro 가 AC-7.4 라우팅 실패로 catch**

**사용자 체감 영향 (Phase 1 배포 이후 계속)**:
- 본인 프로필에 콘텐츠 없음 (`/v2/me/contents` 404)
- 콘텐츠 카운트 0 (`/v2/me/contents/counts` 404)
- 좋아요 탭 빈 상태 (`visibility=liked` 404)
- 알림 unread-count 항상 0 (`/v2/me/notifications/unread-count` 404)
- 본인 프로필 공유/편집 flow 의 내 프로필 조회 실패 (`/v2/me/profile` 404)
- 팔로우 상태 표시 불가능 (follow-state 404)

**해결 방안 (3가지 option 중 택1)**:

**Option A — `.env.example` + prod 환경 `AUTH_API_URL` 에 `/apple` 추가 (1 line fix)**
- Pros: 최소 변경, 즉시 모든 `/v2/*` 200
- Cons: `ApiInstance.Auth` 네이밍 혼란 지속 (이름은 Auth 이지만 실제는 meme 서비스 base). `.env.example` / `.env.prod` / CI secret 동시 업데이트 필요
- 권장: **이번 스프린트 AC 4.1-A** — 단기 해소

**Option B — 32개 repo-impl 의 `ApiInstance.Auth` → `ApiInstance.Wrtn` 일괄 교체**
- Pros: 아키텍처 정합 (WRTN_API_URL 이 meme 서비스 base 역할). `ApiInstance.Auth` 는 원래 목적 (인증) 로 복귀
- Cons: 32 파일 + 관련 mock/test 일괄 변경. 회귀 위험
- 대상 (AC 4.1-B 범위):
  - `data/profile/profile.repository-impl.ts` (2 hits — getMyProfile, updateMyProfile)
  - `data/user-profile/user-profile.repository-impl.ts` (1)
  - `data/me-contents/me-contents.repository-impl.ts` (5)
  - `data/follow/follow.repository-impl.ts` (5)
  - `data/user-block/user-block.repository-impl.ts` (ugc-platform-003 신규)
  - `data/content-report/content-report.repository-impl.ts` (ugc-platform-003 신규)
  - `data/notification/notification.repository-impl.ts` (3)
  - `data/notification-setting/notification-setting.repository-impl.ts` (ugc-platform-003 신규)

**Option C — `ApiInstance.Meme` 신규 + `/v2/*` 이관 (재설계)**
- Pros: Naming 명확 (`Wrtn`/platform, `Auth`/인증, `Meme`/meme-api v2). 향후 Phase 4+ 추가 시 혼란 없음
- Cons: 가장 큰 변경 범위 — 별도 리팩터 스프린트 필요
- 권장 시점: Phase 4+ 새 feature 추가 전 선행 리팩터

**이번 스프린트 결정**:
- **AC 4.1-a (필수)**: `.env.example` 에 `AUTH_API_URL` 이 **meme-api base** 로서 `/apple` 필요함을 주석으로 명시 + 실제 값 업데이트 + CI secret + 문서화 (Option A)
- **AC 4.1-b (권장)**: 근본 해소 — Option B 적용. 32 파일 sed 스크립트 + 회귀 E2E full suite 검증
- **AC 4.1-c (후속)**: Option C 는 별도 refactor 스프린트로 분리 (Phase 4+ 전)

**검증 방법**:
- `yarn test` 통과
- E2E full suite PASS (AC 1.2 와 연계)
- 수동 확인: 본인 프로필 진입 → 콘텐츠 카운트/공개 탭/좋아요 탭 전부 실제 데이터 표시 (기존 "empty" 상태가 아님)

#### AC 4.2: Airbridge vs RN Linking routing 정책
- `useNavigationLinking.ts` 의 이중 routing 전략 문서화
- Google Play 계정 미로그인 Android 에뮬레이터 같은 환경에서 deeplink drop 주의사항
- E2E CI 는 Play 계정 로그인된 에뮬레이터 또는 실기기 사용 (가이드 문서화)

#### AC 4.3: IAP init crash 대응
- `react-native-iap` init 실패 시 unhandled promise rejection → splash stuck 방지
- try/catch 로 감싸서 boot blocking 제거
- 또는 IAP 실패 시 red banner 만 표시하고 나머지 기능 정상 동작 보장

---

### US5: Token refresh 자동화 (CI/로컬 분리)

개발자로서, QA 세션마다 수동으로 새 토큰을 발급받고 싶지 않다.

#### AC 5.1: VPN 의존성 제거 또는 분리
- `refresh-tokens.mjs` 가 `dev-auth-api.wrtn.io` 호출 → 현재 환경에서 VPN 필요
- 대안:
  - a) **Public refresh endpoint** 가용성 확인 (사내 정책)
  - b) CI 환경 (VPN 있음) 에서만 refresh 실행
  - c) **장기 refresh token** 사용 (유효기간 확대 + secret manager 통합)

#### AC 5.2: `.env.e2e` 자동 갱신 주기
- CI 에서 cron 으로 refresh + rotate
- 로컬 QA 는 CI 에서 발급된 값 pull

---

### US6: Manual QA carryover 종결

유저(QA)로서, Phase 1 부터 3 스프린트 연속 pending 인 manual QA 를 이번에 완전 해소하고 싶다.

#### AC 6.1: AC-2.3 프로필 공유 native sheet
- 본인 프로필 → 공유 탭 → iOS + Android native sheet 렌더
- Share sheet 에 `zzem://profile/{myUserId}` URL 포함 확인 (육안 + 스크린샷)
- PR comment 에 iOS/Android 스크린샷 첨부

#### AC 6.2: AC-7.4 regression 방어
- ugc-platform-003 에서 자동화된 `other-user-profile-not-found.yaml` 이 regression suite 에 포함
- 향후 스프린트마다 자동 실행

---

### US7: Cross-phase integration scenario

유저(QA)로서, 3 Phase 가 유기적으로 연결되는 실제 사용자 여정이 end-to-end 로 작동하는지 검증하고 싶다.

#### AC 7.1: Flow A — 콘텐츠 생성 → 공개 → 페이백 → 알림
- Given 유저 A (본인) 가 콘텐츠 생성 (Phase 0 기본)
- When A 가 콘텐츠 공개 전환 (Phase 2 AC 1.1)
- And 유저 B 가 A 의 콘텐츠로 재생성 (Phase 2 AC 1.6)
- Then A 에게 페이백 크레딧 적립 (Phase 2 AC 4.1)
- Then 다음날 10시 KST 배치 시 페이백 알림 1건 (Phase 3 AC 5.1)
- E2E: time-warp 불가 → 각 단계 **개별 flow 연결 + 최종 배치 수동 trigger**

#### AC 7.2: Flow B — 팔로우 → 알림 → 언팔로우
- Given 유저 A 와 유저 B (둘 다 persona 아님)
- When A 가 B 를 팔로우 (Phase 3 US6)
- Then B 에게 팔로우 알림 (Phase 3 AC 5.2) + 알림센터 노출 (AC 5.3)
- When A 가 언팔로우
- Then 기존 알림은 남지만 신규 알림 없음

#### AC 7.3: Flow C — 신고 → 피드 제외 → 차단 → 접근 차단 → 해제
- Given 유저 A 가 유저 B 의 콘텐츠를 피드에서 발견
- When A 가 신고 (Phase 3 AC 7.3)
- Then A 의 피드에서 해당 콘텐츠 즉시 제외
- When A 가 B 를 차단 (Phase 3 AC 7.2)
- Then A ↔ B 콘텐츠 상호 차단 + 팔로우 양방향 해제
- When A 가 차단 해제 (Phase 3 AC 7.6)
- Then 콘텐츠 다시 노출 but 팔로우 자동 복원 없음

#### AC 7.4: Flow D — 페르소나 계정 처리 (cross-phase)
- Given 유저 A 가 페르소나 계정을 팔로우 (Phase 3 AC 7.5)
- Then 페르소나 쪽에 알림 미발송
- When 페르소나 콘텐츠 좋아요 (가능, AC 7.5)
- Then 페르소나에게 좋아요 알림 미발송

---

### US8: Regression dashboard

개발자로서, 스프린트 완료 후 자동으로 full-suite 실행 + 결과 집계를 확인하고 싶다.

#### AC 8.1: CI 연동 full-suite 자동 실행
- 모든 PR 에서 E2E full suite 실행 (10-20분 내)
- 결과를 PR comment 로 자동 포스팅
- PASS rate + failed flow 목록 명시

#### AC 8.2: 주간 regression run
- 매주 1회 (금요일 밤) dev 환경 전체 flow 실행
- Slack 알림 → 주말 전 승계 가능

---

## 비즈니스 룰

### E2E 실행 룰
1. **Seed data 필수**: Maestro flow 실행 전 fetch-seed 스크립트 자동 실행 (실패 시 해당 flow skip)
2. **Login helper 표준**: 모든 AUTH_REQUIRED deeplink flow 는 `runFlow: ../helpers/login.yaml` 선행
3. **canonical appId**: `com.wrtn.zzem.dev` 단일 값
4. **Clean state per flow**: `clearState: true` + dismiss-system-dialogs 조합 표준
5. **Artifacts 자동 수집**: PASS/FAIL 무관 스크린샷 + logcat snippet 저장

### QA 승인 룰
1. **Critical flow (AC 1.2)**: 100% PASS 요구
2. **Cross-phase flow (US7)**: 최소 80% PASS + 실패 원인 문서화
3. **Regression flow (AC 1.3)**: 0건 회귀 필요 — 회귀 발견 시 이전 스프린트로 continue/hotfix

### Manual QA 룰
1. **3 스프린트 누적 금지**: Manual QA 항목은 다음 스프린트 start 전 필수 종결
2. **결과 PR comment 기록**: 스크린샷 + 검증자 + 날짜

---

## 경계 (3-Tier Boundary)

### ALWAYS DO
1. E2E full suite CI 연동
2. `.env.example` 최신 dev/prod 값 반영
3. Manual QA carryover 종결 후 다음 스프린트 시작
4. `@wrtn/app-design-guide` variant 화이트리스트 검증

### NEVER DO
1. **기능 추가 금지** — 본 스프린트는 순수 QA/안정화
2. **BE API 변경** (필요 시 별도 BE 스프린트로 분리)
3. **UI copy 변경** — Phase 3 AC 문구 직역 준수
4. **Airbridge/Datadog SDK 제거** — 기존 인프라 유지

### OUT OF SCOPE
1. Phase 4 이후 신규 feature
2. 프로덕션 배포 파이프라인 변경
3. react-native / @wrtn/common-app 버전 upgrade
4. @wrtn/app-design-guide 신규 variant 추가 (외부 repo)

---

## Deliverables

### Code
- `apps/MemeApp/e2e/scripts/fetch-seed-*.mjs` — 7개
- `apps/MemeApp/e2e/flows/*.yaml` — 7개 수정 + cross-phase 4개 신규
- `apps/MemeApp/e2e/helpers/login.yaml` — enhancements (token auto-refresh safety)
- CI workflow 파일 (GitHub Actions or 기존 자동화 시스템)
- Grep 게이트 script (Typo variant 화이트리스트)

### Docs
- `docs/qa/e2e-setup.md` — 로컬 QA 셋업 가이드 (.env.e2e, 시뮬레이터, 토큰)
- `docs/qa/integration-flows.md` — cross-phase 시나리오 설계
- `docs/qa/regression-checklist.md` — 스프린트마다 체크 항목

### Reports
- 각 Phase regression 결과 (ugc-platform-001/002/003)
- Cross-phase flow 결과
- Manual QA 종결 보고서 (AC-2.3)

---

## 세션 중 수집한 추가 브레인덤프 (정리 대상)

> ugc-platform-003 QA 세션 (2026-04-23) 에서 실시간 발견/관찰한 항목. Phase QA 스프린트 구성 시 참조.

### 런타임 / 아키텍처
- **ScreenErrorBoundary 커버리지**: `ScreenErrorBoundaryUnknownException` 이 crash 를 catch 했음 — 다른 스크린도 동일 래핑 확인 필요
- **UserFollowDomainService.findListWithCursor**: AC 6.2 "가나다순" 미구현 (createdAt DESC 임시) → Phase 3 deferred-items MINOR-G1-1
- **`useUnreadCount ?? 0` render gate**: 주석 없이 `?? 0` 사용 → KB completeness-008 경계. 주석 의무화 통합 검토
- **BlockRelationPort dual-provider**: circular DI 회피 useFactory pattern — 장기 단일화 필요 (MINOR-G2-2)

### 에뮬레이터 / CI 환경
- Android 에뮬레이터 data partition 기본 6G → RN dev build 설치 시 부족한 경우 발생 → AVD config 가이드
- Google Play 계정 로그인 필수 (IAP 정상 동작)
- Metro port 8081 점유 우선 순위 — 여러 worktree 병행 시 충돌
- `dev-auth-api.wrtn.io` VPN 필요 → CI 에서만 token refresh, 로컬은 static .env.e2e

### Evaluator 관점 통합
- 이번 세션 자동화 QA 가 catch 한 것: **Typo.Caption1 런타임 crash** (unit test 로는 발견 불가, Evaluator active evaluation 으로도 UI 렌더 안 해서 miss)
- 향후 Evaluator active evaluation 에 "screen mount smoke" 항목 추가 고려 (매 신규 screen 에 대해)

### 3 스프린트 누적 교훈 (KB 로도 등재)
- `correctness-004` (cursor $lte) / `correctness-005` (cursor extra item) / `completeness-008` (mapper fallback) / `completeness-011` (E2E appId) / `completeness-012` (test literal drift) — 총 5 패턴 KB 승격
- 통합 QA 스프린트 Contract 에도 선제 반영

---

## 참고 링크

- 선행 PRD:
  - `~/.zzem/kb/products/ugc-platform/phase-1-profile/prd.md`
  - `~/.zzem/kb/products/ugc-platform/phase-2-feed-payback/prd.md`
  - `~/.zzem/kb/products/ugc-platform/phase-3-social-notification/prd.md`
- 선행 스프린트 retrospective:
  - `sprint-orchestrator/sprints/ugc-platform-001/retrospective/`
  - `sprint-orchestrator/sprints/ugc-platform-002/retrospective/`
  - `sprint-orchestrator/sprints/ugc-platform-003/retrospective/`
- 발견된 crash fix commit: `c5656dcf1` (wrtn-tech/app-core-packages)
- KB 패턴: `~/.zzem/kb/learning/patterns/` (correctness-004/005, completeness-008/011/012)
