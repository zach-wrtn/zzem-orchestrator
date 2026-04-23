# app-001 · FollowButton (타 유저 프로필 팔로우/팔로잉/맞팔로우 토글)

- **Group**: 001
- **Owner**: fe-engineer
- **Depends on**: be-001
- **Task ID**: app-001

## Target

`app/apps/MemeApp/src/` 내:
- `presentation/profile/components/follow-button.tsx` (신규)
- `presentation/profile/other-user-profile.screen.tsx` 또는 기존 profile header 분기 — FollowButton 통합 (본인 프로필 제외)
- `data/follow/` (신규) — `follow.api.ts`, `follow.queries.ts` (React Query hook: `useFollowStateQuery`, `useFollowMutation`, `useUnfollowMutation`)
- `e2e/flows/follow-button-tap.yaml` (신규)
- `e2e/e2e-seed-plan.md` 업데이트 (seed: 본인 A + 타 유저 B + B 의 isBlocked=false)

## Context

PRD US6 AC 6.1 — 타 유저 프로필에서 팔로우 버튼 노출. 본인 프로필에서는 숨김. 3 state 시각 표현: "팔로우" (NONE, FOLLOWED_BY), "팔로잉" (FOLLOWING), "맞팔로우" (MUTUAL).

Block 은 app-003 범위이지만 본 태스크는 `isBlocked=true` 응답을 받으면 FollowButton 을 렌더하지 않아야 한다 (hidden). BlockedStateBanner UI 자체는 app-003 에서 구현하므로 본 태스크에서는 "렌더 금지" 만 책임.

**API Contract SSOT**: `sprint-orchestrator/sprints/ugc-platform-003/contracts/api-contract.yaml`.
- `POST /v2/users/{userId}/follows` → `FollowStateResponse`
- `DELETE /v2/users/{userId}/follows` → `FollowStateResponse`
- `GET /v2/users/{userId}/follow-state` → `FollowStateResponse`

## Objective

타 유저 프로필 화면에 FollowButton 을 통합하고, React Query 로 follow 상태를 동기화한다. optimistic update + rollback 구현. 403 (block) 응답 시 재조회하여 `isBlocked=true` 분기로 unmount.

## Specification

### FollowButton 컴포넌트

- Props: `{ targetUserId: string }`.
- 내부에서 `useFollowStateQuery(targetUserId)` 로 현재 state 구독.
- 3-way state 맵핑:
  - `NONE` 또는 `FOLLOWED_BY` → 라벨 "팔로우" (primary filled style, tap → POST).
  - `FOLLOWING` → 라벨 "팔로잉" (secondary outline style, tap → DELETE).
  - `MUTUAL` → 라벨 "맞팔로우" (secondary outline style, tap → DELETE; tap 후 FOLLOWED_BY 로 전이).
- `isBlocked === true` → **컴포넌트 자체가 null 반환** (렌더 금지). 상위 컨테이너에서 대체 UI (app-003 의 BlockedStateBanner) 는 본 태스크에서 건드리지 않는다.
- 본인 프로필에서는 FollowButton 자체를 마운트하지 않음 (`currentUserId === targetUserId` 가드는 상위 컨테이너에서 수행).
- testID: `follow-button`. accessibilityLabel 에 현재 라벨 반영.

### 데이터 레이어 — React Query

- Query key: `['follow-state', targetUserId]`.
- `useFollowStateQuery(targetUserId)` — `GET /v2/users/{userId}/follow-state`. staleTime: 30s.
- `useFollowMutation()` — `POST`. `onMutate` 에서 optimistic state 전이:
  - NONE → FOLLOWING
  - FOLLOWED_BY → MUTUAL
- `useUnfollowMutation()` — `DELETE`. optimistic:
  - FOLLOWING → NONE
  - MUTUAL → FOLLOWED_BY
- `onError` rollback 으로 이전 state 복구.
- `onSettled` 에서 `invalidateQueries(['follow-state', targetUserId])` — 서버 truth 재동기화.
- 403 (BLOCKED) 응답 → mutation onError 에서 `invalidateQueries(['other-user-profile', targetUserId])` (또는 해당 프로필 쿼리 key) 호출하여 profile 전체 재조회. 재조회 시 `isBlocked=true` 로 내려오면 FollowButton 자동 unmount.

### 통합 지점

- 타 유저 프로필 컨테이너에서 FollowButton 을 mount. 본인이 자기 프로필 진입 시 mount 금지.
- `ProfileHeader` / `ProfileActionButtons` 레이아웃 **외형 변경 금지** — FollowButton 이 기존 action row 에 자연스럽게 들어가도록. ProfileActionButtons 의 기존 slots 재사용.
- 본 태스크로 변경되는 화면 전수: **타 유저 프로필 헤더 한 곳**. 다른 화면 (feed item, search result, notification card) 의 follow 버튼은 본 태스크 범위 **외** — Group 003/004 에서 다룸.

### 카피 (하드코딩 한국어)

- "팔로우"
- "팔로잉"
- "맞팔로우"
- i18n 레이어 없음. 문자열 상수는 컴포넌트 파일 내 또는 `presentation/profile/profile.copy.ts` 에 정리.

### 스토리지

- Follow state 는 서버 SSOT. MMKV 에 캐시 금지 (follow 상태는 휘발성).
- React Query 의 in-memory cache 만 사용. `@wrtn/mmkv-kit` 사용 없음. **AsyncStorage 금지** (통합 정책).

### E2E Flow — `follow-button-tap.yaml`

- appId: `com.wrtn.zzem.meme` (기존 flows 의 값과 일치).
- 시나리오:
  1. 딥링크 `zzem://profile/{OTHER_USER_ID}` 로 진입.
  2. `assertVisible: "팔로우"` (테스트 대상 아직 미팔로우 상태 seed).
  3. `tapOn: follow-button`.
  4. `assertVisible: "팔로잉"`.
- seed: `e2e-seed-plan.md` 에 (a) 테스트 주체 유저 A, (b) 타 유저 B (UserProfile.type=USER, isBlocked=false, A 와의 관계 NONE) 추가. B 의 deep link userId 노출.

## Acceptance Criteria

- [ ] FollowButton 3 state 시각 매핑 동작:
  - NONE → "팔로우"
  - FOLLOWED_BY → "팔로우"
  - FOLLOWING → "팔로잉"
  - MUTUAL → "맞팔로우"
- [ ] 본인 프로필에서 FollowButton 미렌더.
- [ ] `isBlocked=true` 응답 시 FollowButton null 반환 (렌더 금지).
- [ ] Tap → POST/DELETE 호출. optimistic update 즉시 UI 반영. 에러 시 rollback.
- [ ] 403 BLOCKED 응답 → profile 재조회 → isBlocked=true 분기 진입 → FollowButton unmount.
- [ ] Query key `['follow-state', targetUserId]` invalidation 이 mutation onSettled 에서 동작.
- [ ] E2E: `follow-button-tap.yaml` green. `assertVisible: "팔로잉"` 통과.
- [ ] testID: `follow-button` 로 E2E 에서 tap 가능.
- [ ] **grep 게이트 (Mapper fallback 금지, C08)**: `rg 'followState\s*\?\?\s*|isBlocked\s*\?\?\s*false' apps/MemeApp/src/data/follow apps/MemeApp/src/presentation/profile/components/follow-button.tsx` → 0 hit. Zod schema 로 API response 강제.
- [ ] **grep 게이트 (Dead hook, C09)**: 신규 hook `useFollowStateQuery`, `useFollowMutation`, `useUnfollowMutation` 각각 `rg '<name>\(' apps/MemeApp/src` → ≥ 2 hit (정의 + 최소 1 callsite).
- [ ] **grep 게이트 (Storage primitive)**: `rg 'AsyncStorage' apps/MemeApp/src/data/follow apps/MemeApp/src/presentation/profile/components/follow-button.tsx` → 0 hit.
- [ ] **Cross-component 전수 (C10)**: FollowButton 통합 화면 = **타 유저 프로필 헤더 1 곳**. 그 외 feed item / search / notification 영역은 본 태스크 미적용 — 해당 영역의 Group 차수에서 처리. 명시적 나열 기재.
- [ ] **E2E flows 명시**: `apps/MemeApp/e2e/flows/follow-button-tap.yaml` 존재. appId/deeplink/assertVisible/tapOn 구조 유효.
- [ ] Regression: ugc-platform-001 (profile, nav) + ugc-platform-002 (feed interaction, payback, like) 기능 회귀 없음. 변경된 공유 컴포넌트 전수 나열:
  - `ProfileHeader` / `ProfileActionButtons`: 외형 변경 0 (spacing/typography/color diff screenshot 기반 검증).
  - RootNavigator 변경 없음 (본 태스크는 기존 profile deeplink 재사용).
  - e2e: `other-user-profile.yaml`, `my-profile-default-landing.yaml`, `profile-to-swipe-feed.yaml` 회귀 green.

## Implementation Hints

- React Query mutation optimistic 패턴은 ugc-platform-002 의 like mutation (존재하는 `use-like-mutation` 류) 을 참조 (동일 구조 재사용).
- 기존 deeplink `zzem://profile/{userId}` 는 `app/navigation/useNavigationLinking.ts` + `shared/routes/link-screens.ts` 에 이미 등록됨. 추가 작업 없이 재사용.
- `ProfileActionButtons` slot 구조 확인 후 FollowButton 을 기존 배치 내 삽입. spacing/padding 토큰 재사용 (신규 토큰 금지).
- Zod schema: `FollowStateResponseSchema = z.object({ userId: z.string(), followState: z.enum(['NONE','FOLLOWING','FOLLOWED_BY','MUTUAL']), isBlocked: z.boolean() })`. required 필드 fallback 금지.
- 403 핸들링: axios/fetch interceptor 대신 mutation onError 내 상태 코드 분기 (local 스코프로 제한 — 다른 API 영향 최소화).
- 컴포넌트 테스트: RTL `render` + mutation mock → 각 state 의 라벨 + tap 동작 검증.

## Out of Scope

- BlockedStateBanner UI (app-003).
- 팔로워/팔로잉 리스트 화면 (app-002).
- Feed item 내 follow 버튼 (Group 003/004).
- Notification UI (Group 003).
- 신규 디자인 토큰/패턴 도입 (기존 토큰 재사용).

## Regression Guard

- `ProfileHeader`, `ProfileActionButtons` 는 본 태스크에서 **layout 불변**. 외형 diff 를 스크린샷/스냅샷으로 증명.
- `useNavigationLinking.ts`, `link-screens.ts`, `RootNavigator` 변경 없음.
- 기존 React Query key (`['me-profile']`, `['other-user-profile']`, `['like', ...]`) 변경 없음.
- ugc-platform-001/002 의 e2e (my-profile-default-landing, other-user-profile, profile-to-swipe-feed, settings-menu-full) 전원 green 유지.
