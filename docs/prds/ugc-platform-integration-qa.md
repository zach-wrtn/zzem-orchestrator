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

### US9: Grid Feed 디자인 정합 (Figma SSOT 재반영)

유저(디자이너/PM)로서, 홈 그리드 피드의 레이아웃/칩/썸네일이 Figma 스펙과 일치하기를 원한다.

#### 배경

**현재 빌드 상태** (2026-04-24 육안 확인):
- 홈 탭 그리드: `FlatList + numColumns=2` (uniform grid, 모든 카드 동일 높이)
- 칩: pill 형태 (`BORDER_RADIUS: 999`, padding 10×6)
- 썸네일: uniform 정사각 크롭 — 인물/배경 비율이 손실됨

**Figma 스펙** (`docs/designs/component-patterns.md` §1, 이미 문서화됨):
- 2열 **매거진/Masonry 레이아웃** (Pinterest 스타일)
- 열 간격: 1px (모자이크)
- 카드 비율: **1:1 과 4:5 교차** (같은 열 내에서 번갈아)
- 카드 border-radius: 4px
- 신규 뱃지: bg `#0080c6`, rounded-8, Pretendard SemiBold 12px white, padding 4×8
- 크리에이터 프로필 (카드 하단): 18px 원형 아바타 + 닉네임 (SemiBold 12px white) + 인증 뱃지 (12px 파란 체크) + 우측 하트 + 좋아요 수

**Figma reference**:
- https://www.figma.com/design/7hozJ6Pvs09q98BxvChj08/Wrtn-X_%EC%A8%88_Sprint-File?node-id=37160-76515

**Gap 원인 추정**: Phase 1 구현 당시 component-patterns.md 가 역추출 전이었거나, 이후 Figma 개정이 빌드에 반영 안 됨. ugc-platform-001/002/003 스프린트는 각각 신규 기능 추가에 집중하고 홈 피드 시각 정합은 scope 외였음.

#### AC 9.1: Grid Feed Masonry Layout 적용 (P0 — 시각 정합)

**대상 파일**:
- `apps/MemeApp/src/presentation/home/componenets/filter-list/grid-filter-list.tsx` (line 99: `numColumns={CONFIG.NUM_COLUMNS}`)
- 동일 레이아웃 사용하는 기타 home/free body 파일 (grep 대상)

**구현 방향**:
- `FlatList + numColumns=2` → **`@shopify/flash-list` 의 `MasonryFlashList`** 교체
  - 이미 Phase 2 에서 `flash-list` 사용 precedent 있을 수 있음 (grep 필요)
  - 또는 `react-native-masonry-list` 대안
- 각 카드의 aspect ratio 를 **데이터 기반** (콘텐츠 실제 비율) 또는 **1:1 / 4:5 교차 패턴** 으로 지정
- 열 간격: 1px (모자이크, 시각적으로 거의 붙은 느낌)
- 카드 border-radius: 4px

**Done Criteria**:
- [ ] 2열 masonry 렌더 (카드 높이 교차 확인)
- [ ] 1:1 과 4:5 aspect ratio 교차 (같은 열 내 번갈아)
- [ ] 열 간격 1px, 행 간격 1px (모자이크)
- [ ] border-radius 4px
- [ ] 기존 scroll/end-reached/pull-refresh 동작 회귀 없음
- [ ] 성능 회귀 없음 (60fps 유지, FlashList recycle 활용)

#### AC 9.2: Chip 디자인 Figma 정합 (P1)

**현재 구현** (`filter-chips-item.tsx`):
- `PADDING_HORIZONTAL: 10`, `PADDING_VERTICAL: 6`
- `BORDER_RADIUS: 999` (pill)
- `BORDER_WIDTH: 1`, `GAP: 4`
- `ICON_SIZE: 16`

**Figma 스펙 확인 필요 (`docs/designs/component-patterns.md` 업데이트 대상)**:
- [ ] chip shape (pill? rounded rect?)
- [ ] padding / height / font size / weight
- [ ] 선택 상태 색상 (active bg, active text, inactive bg, inactive text)
- [ ] border (유/무, 색, 두께)
- [ ] icon 크기 + 위치 (좌/우, gap)
- [ ] 스크롤/sticky 동작 (Figma 에서 sticky 여부)

**Done Criteria**:
- [ ] Figma 스펙과 육안 비교 → 차이 0
- [ ] 선택 transition 애니메이션 정합
- [ ] 다크/라이트 모드 토큰 사용 (하드코딩 색상 금지)

#### AC 9.3: Grid Thumbnail 디자인 Figma 정합 (P0)

**현재 관찰**:
- 신규 뱃지 좌상단 파란 박스 (대략적 렌더)
- 카드 하단에 제목만 표시 (흰 배경 + 검은 텍스트) — Figma 는 이미지 위 그라데이션 오버레이 + 흰 텍스트
- 크리에이터 프로필 + 좋아요 수 **미표시** (Figma 기준 필수)

**Figma 스펙 (component-patterns.md §1 참조)**:
```
┌─────────────────────┐
│ [신규 뱃지]          │  ← 좌상단, 선택적
│                     │
│   (이미지/그라데이션)  │
│                     │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← 하단 그라데이션 오버레이
│ 템플릿 이름           │  ← Pretendard SemiBold 14px white
│ 🟣 쨈 ✅    ♡ 42    │  ← 크리에이터(좌) + 좋아요(우)
└─────────────────────┘
```

**Done Criteria**:
- [ ] 신규 뱃지: bg `#0080c6`, rounded-8, SemiBold 12px white, padding 4×8
- [ ] 하단 그라데이션 오버레이 (투명 → 검정 60%)
- [ ] 제목 텍스트: Pretendard SemiBold 14px white, 1-line truncate
- [ ] 크리에이터 프로필 row (18px 원형 아바타 + 닉네임 + 인증 뱃지)
- [ ] 우측 하트 + 좋아요 수 (SemiBold 12px white, opacity 0.8)
- [ ] border-radius 4px (AC 9.1 과 일치)
- [ ] 탭 → 세로 스와이프 뷰어 진입 유지 (기존 동작 회귀 없음)

#### AC 9.4: `component-patterns.md` SSOT 재확정 + CI 검증

- [ ] 이번 스프린트 변경 후 `docs/designs/component-patterns.md` 에 최종 스펙 반영
- [ ] Figma MCP extract 재실행 (available 시) or 수동 patch
- [ ] CI 에서 시각 regression 검증 (선택 — Maestro 스크린샷 baseline 비교 or 별도 visual regression tool)

#### Scope boundary

- **In scope**: 홈 탭 `ProfileTab` / `HomeTab` (recommend/free variant) 의 grid feed
- **Out of scope**: SwipeFeed (세로 스와이프 뷰어) — 이미 Phase 2 에서 다룸. MemeCollection (내 컬렉션) — 별도 레이아웃. 프로필 탭 내 grid (이건 Phase 1 profile 소관, 별도 검토)

---

### US10: 탐색 탭 섹션별 디자인 정합 (Discovery/Explore Figma SSOT)

유저(디자이너/PM)로서, 탐색 탭의 3개 섹션 (빠른 액션 / 이번주 밈 업데이트 / 밈 필터 랭킹) 이 Figma 스펙과 일치하기를 원한다.

#### 배경

**현재 구조** (2026-04-24 iOS 빌드 스크린샷 분석):
- `ExploreScreen` = `HomeBody` 재사용 (탐색 = 홈 동일 body)
- `HomeBody` 내부 섹션:
  - `MainServiceSection` (빠른 액션 4개: 이미지 생성 / 비디오 생성 / 댄스 챌린지 / 주인공 바꾸기)
  - `NewFilterSection` (이번주 밈 업데이트 — 가로 스크롤)
  - `TrendingFilterSection` (밈 필터 랭킹 — 세로 리스트 + 만들기)
  - `CurationSection` (큐레이션 — 선택)
  - `FilterListItem` × N (grid, US9 대상)

**Figma reference**:
- 이번주 밈 업데이트: https://www.figma.com/design/7hozJ6Pvs09q98BxvChj08/Wrtn-X_%EC%A8%88_Sprint-File?node-id=37160-77639
- 밈 필터 랭킹: https://www.figma.com/design/7hozJ6Pvs09q98BxvChj08/Wrtn-X_%EC%A8%88_Sprint-File?node-id=37160-77643

#### 현재 빌드 관찰 (스크린샷 기반)

**섹션 1 — MainServiceSection (빠른 액션 4개)**:
- 가로 row, 각 항목: 원형 그라디언트 아이콘 + 하단 텍스트 (2줄 가능)
- 4개 아이콘: 이미지 생성 / 비디오 생성 / 댄스 챌린지 / 주인공 바꾸기
- 카드 배경: 흰색 둥근 rect

**섹션 2 — NewFilterSection ("이번주 밈 업데이트" 가로 스크롤)**:
- 가로 스크롤 horizontal list
- 카드 구조: 좌상단 **신규 뱃지 (파랑)** + 정사각 1:1 썸네일 + 하단 제목 (흰 배경 + 검은 텍스트)
- 썸네일 border-radius 적용, 모두 동일 크기

**섹션 3 — TrendingFilterSection ("밈 필터 랭킹" 세로 리스트)**:
- 각 row: `순번 숫자` + `썸네일 (작은 정사각)` + `제목` + `카테고리 (비디오/이미지)` + 우측 `[만들기]` 버튼
- 순번: 숫자만 (1, 2, 3, 4) — 폰트 가벼움
- 카테고리: 제목 아래 회색 작은 텍스트 "비디오" / "이미지"
- 만들기 버튼: 둥근 검정 pill, 흰 텍스트
- 리스트 아래 `더보기 v` (chevron down 아이콘)

#### AC 10.1: MainServiceSection 아이콘/간격 Figma 정합 (P2)

**대상 파일**: `apps/MemeApp/src/presentation/home/componenets/main-service/main-service-section.tsx`, `main-service-card.tsx`

**검증 포인트**:
- [ ] 각 원형 그라디언트 아이콘 색상/크기/내부 icon 선택 Figma 일치
- [ ] 4개 row gap, 수평 padding
- [ ] 텍스트 typography (font family, weight, size, line-height)
- [ ] 탭 피드백 (scale or opacity transition)

> 🚧 Figma 스펙 구체값은 디자이너 확인 후 PRD 재개정 (또는 Contract 작성 시점)

#### AC 10.2: NewFilterSection 카드 디자인 Figma 정합 (P1)

**대상 파일**: `apps/MemeApp/src/presentation/home/componenets/filter-list/new-filter-section.tsx`

**Figma node**: `37160-77639`

**검증 포인트**:
- [ ] 신규 뱃지: bg 색상 (`#0080c6` 추정 — component-patterns.md §1 공통), rounded-8, padding 4×8, font SemiBold 12px white
- [ ] 썸네일: aspect ratio (1:1 고정? 4:5 혼합? Figma 기준), border-radius
- [ ] 제목 위치: 썸네일 내부 (그라데이션 오버레이) vs 썸네일 외부 (현재 빌드)
- [ ] 제목 typography: Pretendard SemiBold/Regular, font size, color
- [ ] 카드 간 gap, 좌우 padding (first/last item peek behavior)
- [ ] 크리에이터/좋아요 수 표시 여부 (일관성: grid card 와 match — US9 AC 9.3 과 연계)

#### AC 10.3: TrendingFilterSection (랭킹 리스트) Figma 정합 (P1)

**대상 파일**: `apps/MemeApp/src/presentation/home/componenets/filter-list/` 하위 랭킹 관련 (`trending-filter-section.tsx` 추정)

**Figma node**: `37160-77643`

**검증 포인트**:
- [ ] 순번 표시 style: 단순 숫자 vs 큰 숫자 badge vs 메달 (1/2/3 special treatment?)
- [ ] 순번 typography (font size, weight, color — 현재 다소 가벼운 인상)
- [ ] 썸네일: 크기 (현재 작음), border-radius
- [ ] 제목 typography: font size, weight, line height (현재 SemiBold 추정)
- [ ] 카테고리 라벨 ("비디오" / "이미지") 색상/위치/font — separator/dot/chip 여부
- [ ] 만들기 버튼: shape (pill/rounded rect), bg, padding, font (현재 검정 pill)
- [ ] Row separator (선 / 공백) + row height
- [ ] 접기/펼치기 동작 (component-patterns.md §7 [4] 실시간 랭킹 1~8위 접기/펼치기 언급)

#### AC 10.4: 더보기 버튼 + 섹션 spacing (P2)

**현재**: "더보기 v" 텍스트 + 아래 chevron 아이콘, 세로 리스트 하단 중앙 정렬

**검증 포인트**:
- [ ] 버튼 인터랙션 (tap 시 더 많은 항목 로드? 또는 전체 페이지 네비?)
- [ ] tap 영역 (현재 chevron 과 텍스트가 별개인지)
- [ ] 섹션 간 vertical gap (MainService ↔ NewFilter ↔ Trending)
- [ ] 헤더 + 섹션 전체 상단 spacing

#### AC 10.5: component-patterns.md 업데이트

**기존 상태**: `docs/designs/component-patterns.md §7 Home Screen (Full Layout)` 에 대략적 구성만 명시 (실시간 랭킹 언급). 섹션별 세부 token 부재.

**업데이트**:
- [ ] §7 섹션에 MainService / NewFilter / Trending 세부 token 추가
- [ ] Figma node-id 레퍼런스 embed
- [ ] Phase 3 이후 재추출 완료 날짜 업데이트

#### Scope boundary

- **In scope**: 탐색 탭 = 홈 탭의 `HomeBody` 섹션들 (MainService / NewFilter / Trending / 더보기)
- **Out of scope**: chip 선택 상태에서 렌더되는 grid feed 는 US9 범위. 홈 헤더 (bell/coin/MY) 는 ugc-platform-003 에서 다룸 (bell 추가 완료). MemeCollection / Profile grid / SwipeFeed 별도.

#### 연계 AC

- AC 9.3 (Thumbnail 디자인) 과 공유 토큰 사용: NewFilter 카드 썸네일도 동일 스펙 (border-radius, 신규 뱃지, 크리에이터 row)
- AC 3.1 (Typo whitelist) 와 연계: font variant 사용 시 allowed enum 내에서

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
