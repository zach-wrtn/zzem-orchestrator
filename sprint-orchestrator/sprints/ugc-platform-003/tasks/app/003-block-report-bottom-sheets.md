# app-003 · 타 유저 차단 진입점 + Confirm BottomSheet + BlockedProfileState

- **Group**: 002
- **Owner**: fe-engineer
- **Depends on**: be-002 (POST/DELETE /v2/users/{userId}/blocks + UserPublicProfile.isBlocked)

## Target

`app/apps/MemeApp/src/` 내:
- 신규 `presentation/user-block/components/block-confirm-sheet.tsx` (BlockConfirmSheet)
- 신규 `presentation/user-block/components/blocked-profile-state.tsx` (BlockedProfileState)
- 신규 `presentation/user-block/hooks/use-block-user.ts` (React Query mutation)
- 신규 `presentation/user-block/hooks/use-unblock-user.ts`
- 기존 `presentation/profile/components/profile-more-sheet.tsx` (타 유저 프로필 more-sheet) — "차단" 액션 추가
- 기존 `presentation/swipe-feed/components/swipe-feed-more-sheet.tsx` — non-owner 측 "차단" 액션 추가
- 기존 `presentation/profile/screens/profile.screen.tsx` — `userPublicProfile.isBlocked === true` 시 `BlockedProfileState` 로 대체 렌더
- 관련 Maestro E2E

## Context

AC 7.2 (유저 차단): 타 유저 프로필 / 세로 스와이프 more-sheet 에서 "차단" 액션 노출 → confirm BottomSheet → 확인 시 차단 mutation + cache invalidation + blocked state 전환. AC 7.6 (차단 해제 진입점은 BlockedProfileState [차단 해제] 버튼 경로 — 본 태스크) + settings/차단 관리 경로 (app-004 담당).

BlockedProfileState 는 차단 당사자 (caller → target) 프로필 재진입 시 콘텐츠 대신 노출되는 상태 화면. blockingMe (나를 차단한 상대) 케이스는 본 태스크 scope 아님 — BE 가 isBlocked=false 로 응답 + content list 빈 값이므로 일반 프로필 UI 에 "콘텐츠 없음" empty state 만 노출.

## Objective

차단/차단해제 mutation 과 UI 상태 전환을 완결. more-sheet 기존 액션 (다운/의견/신고/삭제) 은 미변경.

## Specification

### BlockConfirmSheet — 차단 진입 confirm

- 구현 기반: `shared/ui/gorhom-sheet/bottom-confirm-sheet.tsx` (useBottomConfirmSheet hook) 또는 Phase 2 `UnpublishConfirmSheet` horizontal 2-button 패턴 준용.
- Props: `{ targetUserId, targetNickname, onConfirmed?: () => void }`.
- Copy (AC 7.2 문구 직역, 하드코딩 한국어):
  - 타이틀: `"{nickname}님을 차단하시겠어요?"` (template literal — nickname interpolation).
  - 바디: `"상대방의 콘텐츠가 피드에서 사라지고, 회원님의 프로필과 콘텐츠도 상대방에게 보이지 않아요. 차단을 해제할 수 있어요."`.
  - Primary button: `"차단"` (destructive — 빨강 계열).
  - Secondary button: `"취소"`.
- horizontal 2-button layout.

### Block mutation — useBlockUser

- `useMutation({ mutationFn: (userId) => client.post('/v2/users/{userId}/blocks'), ... })`.
- onSuccess:
  - Cache invalidation 전수 (integration-002 cross-path cleanup):
    - `queryClient.invalidateQueries(['userPublicProfile', targetUserId])`
    - `queryClient.invalidateQueries(['followState', targetUserId])`
    - `queryClient.invalidateQueries(['feed'])` (swipe-feed)
    - `queryClient.invalidateQueries(['myLikes'])`
    - `queryClient.invalidateQueries(['userContents', targetUserId])`
    - `queryClient.invalidateQueries(['myBlocks'])` (app-004 연동)
  - Toast: `"{nickname}님을 차단했어요"`.
- onError: Toast `"차단에 실패했어요. 다시 시도해 주세요."`.

### 타 유저 프로필 MoreSheet 진입점

기존 `profile-more-sheet.tsx` actions array:
- 기존: 다운로드 / 의견 / 신고 (존재 가정 — Phase 2 에서 확정).
- 신규 추가: `{ label: "차단", onPress: () => openBlockConfirmSheet, destructive: true }`.
- 순서: 다운로드 → 의견 → 신고 → **차단** (가장 하단).
- 본인 프로필 MoreSheet (삭제/비공개 전환 계열) 에는 추가 금지.

### Swipe-feed MoreSheet 진입점

기존 `swipe-feed-more-sheet.tsx` — non-owner 측 (caller !== content.ownerUserId) 액션:
- 기존: 다운로드 / 의견 / 신고.
- 신규 추가: `{ label: "차단", onPress: () => openBlockConfirmSheet({ targetUserId: content.ownerUserId, targetNickname: content.owner.nickname }), destructive: true }`.
- owner 측 액션 (삭제/공개해제 등) 미변경.

### BlockedProfileState — 차단 후 프로필 화면 대체

- 렌더 조건: `ProfileScreen` 내부 `userPublicProfile.isBlocked === true`.
- UI:
  - Top 영역: 기존 헤더 (뒤로가기) 유지.
  - Body: 가운데 정렬 empty-like 상태.
    - 아이콘 (차단/금지 glyph — 기존 디자인 시스템 token 사용).
    - 텍스트: `"이 계정을 차단했어요"`.
    - 버튼: `"차단 해제"` (primary).
- [차단 해제] 탭 → Unblock confirm BottomSheet:
  - 타이틀: `"{nickname}님을 차단 해제하시겠어요?"`.
  - 바디: `"이 계정의 콘텐츠가 다시 피드에 노출되며, 상대방도 회원님의 프로필과 콘텐츠를 볼 수 있어요. 차단을 해제한 사실은 상대방에게 알려지지 않아요."` (AC 7.6 직역).
  - Primary: `"차단 해제"`. Secondary: `"취소"`.
- useUnblockUser mutation: DELETE `/v2/users/{userId}/blocks`:
  - onSuccess: cache invalidation (위 useBlockUser 와 동일 집합) + ProfileScreen re-render → isBlocked=false → 일반 프로필 UI 복귀.
  - Toast: `"{nickname}님을 차단 해제했어요"`.
  - **FollowButton 상태**: BE 에서 UserFollow 은 자동 복원 안 하므로 (AC 7.6) FollowState NONE → "팔로우" 버튼 표시. 검증 필수.

### Navigation

신규 screen 없음 (profile.screen 내부 조건 분기). link-screens / RootNavigator 변경 없음.

### E2E — Maestro

신규 flow: `other-user-profile-block.yaml`
- Steps (pattern freq 1 — appId / deeplink / assertVisible):
  1. launchApp `zzem` + login seed.
  2. Deeplink `zzem://user/{otherUserId}`.
  3. assertVisible "팔로우" (현재 NONE 상태 seed).
  4. Tap more-sheet (...) 아이콘.
  5. assertVisible "차단" menu item.
  6. Tap "차단".
  7. assertVisible BlockConfirmSheet 타이틀.
  8. Tap "차단" primary button.
  9. assertVisible "이 계정을 차단했어요" (BlockedProfileState).
  10. assertVisible "차단 해제" button.

## Acceptance Criteria

- [ ] BlockConfirmSheet 렌더 + 하드코딩 Korean copy 3종 (타이틀/바디/버튼) AC 7.2 직역 매칭.
- [ ] 타 유저 프로필 MoreSheet: "차단" 액션 + 기존 액션 (다운/의견/신고) 순서 불변 + destructive 스타일.
- [ ] Swipe-feed MoreSheet non-owner: "차단" 액션 추가 + owner 측 미영향.
- [ ] useBlockUser onSuccess: 6개 query key invalidate 전수 (완성도 grep: rg 'invalidateQueries' src/presentation/user-block → ≥ 6 hit).
- [ ] 차단 확정 후 ProfileScreen 에 BlockedProfileState 렌더 (isBlocked=true branch).
- [ ] BlockedProfileState → [차단 해제] → unblock confirm sheet → 확정 → 일반 프로필 UI 복귀 + FollowButton "팔로우" (NONE 상태 — BE 자동복원 없음 AC 7.6).
- [ ] Unblock confirm 바디 copy AC 7.6 직역 매칭.
- [ ] Toast "차단했어요" / "차단 해제했어요" 각각 성공 시 노출.
- [ ] Mapper fallback 금지 (completeness-008): UserPublicProfile mapper 내 `isBlocked ?? false` 금지 — Zod 필수 `z.boolean()` 강제. grep `rg 'isBlocked\s*\?\?\s*false' src → 0 hit`.
- [ ] Dead hook 금지 (completeness-009): `useBlockUser`, `useUnblockUser`, `BlockConfirmSheet`, `BlockedProfileState` 각각 import/호출 ≥ 2 hit (grep: `rg 'useBlockUser\(' src → ≥ 2 hit` etc.).
- [ ] Cross-component 전수 (completeness-010): 진입점 명시 — 타 유저 프로필 MoreSheet + swipe-feed MoreSheet (non-owner) 만. 본인 프로필 MoreSheet / swipe-feed owner MoreSheet 미적용. "모든 MoreSheet" 표현 금지.
- [ ] E2E `other-user-profile-block.yaml` green (appId / deeplink / assertVisible 3 요소 포함).
- [ ] Storage primitive 사용처 있다면 `@wrtn/mmkv-kit` (AsyncStorage 금지). 본 태스크는 client state 위주라 해당 없음 — negative check.
- [ ] Regression: 기존 MoreSheet 액션 (다운/의견/신고/삭제/비공개전환) tap 시 기존 동작 불변.

## Implementation Hints

- `useBottomConfirmSheet` 훅의 signature 는 `UnpublishConfirmSheet` (Phase 2) 참고. `grep -r UnpublishConfirmSheet apps/MemeApp/src/presentation` 로 위치 확인 후 동일 패턴.
- Toast 컴포넌트 위치 확인: `grep -r Toast apps/MemeApp/src/shared/ui/` — 기존 toast API 재사용 (import path 확정).
- nickname interpolation: BlockConfirmSheet props 로 전달받되, 현재 화면이 이미 nickname 을 가지고 있을 가능성 높음 (profile screen / swipe-feed content owner meta). fallback text "이 유저" 는 **금지** (completeness-008 Mapper fallback 금지 정신 — nickname 미제공 시 sheet 호출 자체 안 함).
- 진입점 grep 게이트: `rg 'openBlockConfirmSheet\(' apps/MemeApp/src/presentation → ≥ 2 hit` (profile-more-sheet + swipe-feed-more-sheet).
- 디자인 토큰: destructive color 는 `app-design-guide` / `wds-tokens` 기존 token 활용. 하드코딩 hex 금지.
- React Query keys: 프로젝트 convention 따르기 — `['userPublicProfile', targetUserId]` 는 기존 profile hook 에서 사용 중이라고 가정, 그대로 재사용.

## Out of Scope

- 차단 목록 화면 (app-004 담당).
- 본인이 본인 프로필을 차단 (BE 에서 SELF_BLOCK_FORBIDDEN 반환 — FE 는 버튼 비노출).
- blockingMe (나를 차단한 상대) 화면 처리 — BE isBlocked=false + 빈 content list 로 일반 프로필 empty 처리 (별도 UX 없음).
- 신고 (app-005 담당) / 필터 신고 (기존 ReportFilterScreen 미변경).
- Deeplink 신규 정의.

## Regression Guard

- MoreSheet 기존 액션 배열 순서 / 라벨 / 아이콘 불변. "차단" 은 append-only (마지막 위치).
- 본인 프로필 MoreSheet (삭제/비공개/편집) 미변경 — 파일 수정 시 본인 owner branch 는 diff 0.
- ProfileScreen: isBlocked 분기 추가 이전 로직 (팔로우 버튼, 콘텐츠 탭, 통계) 불변 — isBlocked=false 시 기존 UI 100% 보존.
- FollowButton 컴포넌트 자체 수정 금지 (isBlocked=true 시 BlockedProfileState 가 FollowButton 을 렌더하지 않음으로써 처리).
- swipe-feed MoreSheet owner branch 미변경.
- Phase 2 AC (팔로우/좋아요/공개전환) 회귀 없음.
