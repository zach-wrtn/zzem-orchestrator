# app-002 · 팔로워/팔로잉 리스트 화면 (본인 프로필 count 탭 연결)

- **Group**: 001
- **Owner**: fe-engineer
- **Depends on**: be-001
- **Task ID**: app-002

## Target

`app/apps/MemeApp/src/` 내:
- `presentation/profile/follower-list.screen.tsx` (신규)
- `presentation/profile/following-list.screen.tsx` (신규)
- `presentation/profile/components/follow-user-row.tsx` (신규) — avatar + nickname + FollowButton (app-001 과 공유)
- `presentation/profile/components/profile-count-row.tsx` — 본인 프로필에서만 tap 연결 (기존 컴포넌트 확장)
- `app/navigation/root-navigator.tsx` — 2개 스크린 등록 (`FollowerList`, `FollowingList`)
- `app/navigation/useNavigationLinking.ts` + `shared/routes/link-screens.ts` — `zzem://follower-list`, `zzem://following-list` 딥링크 추가
- `data/follow/follow.queries.ts` — `useMyFollowersInfinite`, `useMyFollowingInfinite` hook (app-001 파일에 추가)
- `e2e/flows/my-profile-follower-list.yaml` (신규)
- `e2e/flows/my-profile-following-list.yaml` (신규)
- `e2e/e2e-seed-plan.md` 업데이트

## Context

PRD US6 AC 6.2 — 본인 프로필의 팔로워/팔로잉 count 탭 시 각각의 리스트 화면으로 진입. 타 유저 프로필에서는 숫자만 표시 (탭 무효).

각 항목은 avatar + nickname + FollowButton (on-the-fly state). 가나다순 (BE 가 nickname ASC 반환 — be-001 참조). 빈 상태 카피 고정.

**API Contract SSOT**: `sprint-orchestrator/sprints/ugc-platform-003/contracts/api-contract.yaml`.
- `GET /v2/me/followers?cursor&limit` → `FollowUserListResponse`
- `GET /v2/me/following?cursor&limit` → `FollowUserListResponse`

## Objective

본인 팔로워/팔로잉 리스트 화면 2개를 신규로 만들고, 본인 프로필의 count 탭으로 진입시킨다. cursor pagination 무한 스크롤 + 빈 상태 + FollowButton 통합.

## Specification

### 스크린 구조

- **FollowerListScreen**: 헤더 "팔로워", 리스트. 본인 only.
- **FollowingListScreen**: 헤더 "팔로잉", 리스트. 본인 only.
- 리스트 항목 (`FollowUserRow`):
  - Avatar (profileImageUrl, nullable — fallback placeholder).
  - Nickname.
  - 우측: `FollowButton targetUserId={item.userId}` (app-001 의 컴포넌트 재사용).
  - Row tap → `zzem://profile/{userId}` 로 네비게이션 (기존 프로필 deeplink 재사용).
- 빈 상태:
  - Follower: "아직 팔로워가 없어요"
  - Following: "아직 팔로잉이 없어요"
- 로딩 상태: skeleton row × 6 (기존 skeleton 토큰 재사용).

### 네비게이션 / 딥링크

- `RootNavigator` 에 `FollowerList`, `FollowingList` 스크린 등록.
- `link-screens.ts` 에 매핑 추가:
  - `follower-list` → `FollowerList`
  - `following-list` → `FollowingList`
- `useNavigationLinking.ts` prefixes 는 기존 `zzem://`, `https://` 그대로. 경로만 추가 등록.
- 딥링크: `zzem://follower-list`, `zzem://following-list` — **본인 리스트** 진입 (userId path 없음, caller 기준).

### ProfileCountRow 확장

- 기존 `profile-count-row.tsx` 는 "팔로워 {N}" "팔로잉 {M}" 숫자만 표시, tap 미연결.
- 본 태스크에서 **본인 프로필** context 에서만 tap 핸들러 활성화:
  - 팔로워 영역 tap → `navigation.navigate('FollowerList')`.
  - 팔로잉 영역 tap → `navigation.navigate('FollowingList')`.
- 타 유저 프로필 context 에서는 tap 무효 (pressable 속성 disable, accessibility role 도 button 제거).
- Prop 확장: `{ counts, onPressFollowers?: () => void, onPressFollowing?: () => void }`. 상위가 본인/타인에 따라 handler 주입.

### 데이터 — React Query Infinite

- `useMyFollowersInfinite(limit = 20)` — `GET /v2/me/followers`. `getNextPageParam`: `cursor.hasNext ? cursor.nextCursor : undefined`.
- `useMyFollowingInfinite(limit = 20)` — 대칭.
- Query key: `['my-followers']`, `['my-following']`.
- FlatList `onEndReached` → `fetchNextPage()`. threshold 0.5.
- 리스트 렌더 시 nickname 가나다순은 BE SSOT — FE 는 response 순서 그대로 렌더. 추가 정렬 금지 (double-sort 금지).

### Pull to Refresh

- 각 스크린 상단 pull-to-refresh → `refetch()`.

### 스토리지

- 리스트 데이터는 React Query cache only. MMKV 캐시 금지. `@wrtn/mmkv-kit` / AsyncStorage 사용 없음.

### E2E Flows

- **`my-profile-follower-list.yaml`**
  - appId: `com.wrtn.zzem.meme`.
  - 시나리오:
    1. 딥링크 `zzem://follower-list` 진입.
    2. `assertVisible: "팔로워"` (헤더).
    3. `assertVisible: "{seeded-follower-nickname}"` (최소 1명).
- **`my-profile-following-list.yaml`**
  - 시나리오:
    1. 딥링크 `zzem://following-list` 진입.
    2. `assertVisible: "팔로잉"` (헤더).
    3. `assertVisible: "{seeded-following-nickname}"` (최소 1명).
- `e2e-seed-plan.md` 에 다음 seed 추가:
  - 본인 A.
  - A 의 팔로워 1명 이상 (가나다순 최상위 결정적 nickname, 예: "가나").
  - A 의 팔로잉 1명 이상 (동일 기준).

## Acceptance Criteria

- [ ] 본인 프로필에서 팔로워 count tap → FollowerListScreen 네비게이션 성공.
- [ ] 본인 프로필에서 팔로잉 count tap → FollowingListScreen 네비게이션 성공.
- [ ] 타 유저 프로필에서 count 영역 tap 무효 (pressable 비활성 + 네비게이션 미발생).
- [ ] FollowerListScreen — 가나다순 첫 페이지 로드, `onEndReached` 시 다음 페이지 요청. `hasNext=false` 일 때 추가 요청 금지.
- [ ] FollowingListScreen — 동일.
- [ ] 빈 상태: Follower 0 → "아직 팔로워가 없어요". Following 0 → "아직 팔로잉이 없어요".
- [ ] 각 row 의 FollowButton (app-001) 정상 토글 동작. 낙관적 업데이트 + `['follow-state', userId]` invalidation.
- [ ] Row tap → `zzem://profile/{userId}` 진입.
- [ ] Pull-to-refresh 시 `['my-followers']` / `['my-following']` invalidate.
- [ ] 딥링크 `zzem://follower-list`, `zzem://following-list` 직접 진입 가능.
- [ ] `RootNavigator` 에 `FollowerList`, `FollowingList` 스크린 등록 확인.
- [ ] **grep 게이트 (Mapper fallback 금지, C08)**: `rg 'nickname\s*\?\?\s*["\x27]|profileImageUrl\s*\|\|\s*["\x27]' apps/MemeApp/src/presentation/profile/follower-list.screen.tsx apps/MemeApp/src/presentation/profile/following-list.screen.tsx apps/MemeApp/src/presentation/profile/components/follow-user-row.tsx` → 0 hit. Zod parse 로 response 강제.
- [ ] **grep 게이트 (Dead hook, C09)**: `useMyFollowersInfinite`, `useMyFollowingInfinite` 각각 `rg '<name>\(' apps/MemeApp/src` → ≥ 2 hit.
- [ ] **grep 게이트 (Storage primitive)**: `rg 'AsyncStorage' apps/MemeApp/src/presentation/profile/follower-list.screen.tsx apps/MemeApp/src/presentation/profile/following-list.screen.tsx` → 0 hit.
- [ ] **Cross-component 전수 (C10)**: `ProfileCountRow` prop 확장 영향 범위:
  - 본인 프로필 화면 (`profile.screen.tsx`) — handler 주입.
  - 타 유저 프로필 화면 (other-user-profile.screen.tsx 류) — handler 미주입 (tap 무효).
  - 그 외 ProfileCountRow 사용처 없음 (현 시점). 신규 사용처 추가 시 handler 주입 정책 재검토 명시.
- [ ] **E2E flows 명시**:
  - `apps/MemeApp/e2e/flows/my-profile-follower-list.yaml` 존재. appId/deeplink(`zzem://follower-list`)/assertVisible(헤더 "팔로워" + seed nickname 1명) 유효.
  - `apps/MemeApp/e2e/flows/my-profile-following-list.yaml` 존재. appId/deeplink(`zzem://following-list`)/assertVisible(헤더 "팔로잉" + seed nickname 1명) 유효.
  - `e2e-seed-plan.md` 에 seed 요구사항 반영.
- [ ] Regression: ugc-platform-001 (profile, nav) + ugc-platform-002 (feed interaction, payback, like) 기능 회귀 없음. 변경된 공유 컴포넌트 전수 나열:
  - `ProfileCountRow` — prop 확장 (optional handler 2개). 기존 호출부 (본인/타인 프로필) 는 명시적으로 마이그레이션 (본인: handler 주입 / 타인: 주입 없음).
  - `RootNavigator` — screen 등록 추가. 기존 route 순서/이름/파라미터 불변.
  - `link-screens.ts` — 2개 path 추가. 기존 매핑 불변.
  - `useNavigationLinking.ts` — prefixes 불변 (기존 `zzem://`, `https://` 그대로).
  - e2e 회귀: `my-profile-default-landing.yaml`, `other-user-profile.yaml`, `home-to-settings.yaml` 전원 green.

## Implementation Hints

- FlatList + cursor pagination 패턴은 `presentation/meme/meme-collection.screen.tsx` 의 `onEndReached` + `useInfiniteQuery` 조합을 참조 (구조 그대로 복제).
- `FollowUserRow` 는 기존 list row style (avatar+text+trailing action) 을 재사용. 신규 토큰 도입 금지.
- 빈 상태 컴포넌트는 기존 empty-state 유틸이 있으면 재사용. 없으면 최소 구현 (아이콘 없이 텍스트 only — 본 태스크 범위에서는 간결성 우선).
- 딥링크 등록 시 `useNavigationLinking.ts` 의 기존 config 패턴 (prefixes + config.screens) 준수. nested nav 없는 leaf 라우트로 배치.
- FollowButton 재사용 시 `currentUserId === item.userId` 인 경우 FollowButton mount 금지 (본인이 자기 자신 리스트에 등장하는 경우는 없지만 defensive).
- Zod: `FollowUserItemSchema`, `FollowUserListResponseSchema` 를 shared schema 로 배치. required 필드 `userId`, `nickname`, `followState`, `isBlocked` — fallback 금지.
- 타 유저 프로필에서 count tap 을 확실히 차단하려면 `Pressable` 대신 `View` 로 렌더 분기 (accessibility role 'button' 누출 방지).

## Out of Scope

- 타 유저의 팔로워/팔로잉 리스트 열람 (본 Phase 지원 안 함 — PRD 에 명시 없음).
- 검색/필터 UI (리스트 상단 search bar 없음).
- Swipe to unfollow 제스처 (FollowButton tap 으로만 토글).
- 알림 연동 (Group 003).

## Regression Guard

- `ProfileCountRow` prop 확장은 optional — 기본값 주입 없으면 기존 behavior (숫자 표시, tap 무효) 유지. 본인 프로필만 handler 주입.
- `RootNavigator` 에 screen 추가 시 기존 screen 순서 보존.
- `link-screens.ts` / `useNavigationLinking.ts` 는 path 추가만. 기존 매핑/prefix/옵션 불변.
- ugc-platform-001/002 e2e 전원 green 유지. 특히 `my-profile-default-landing.yaml`, `other-user-profile.yaml` 회귀 필수 검증 (ProfileCountRow prop 변경 영향 범위).
