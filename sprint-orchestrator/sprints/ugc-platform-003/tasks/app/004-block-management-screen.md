# app-004 · 차단 관리 화면 + 차단 해제 BottomSheet + Toast

- **Group**: 002
- **Owner**: fe-engineer
- **Depends on**: be-002 (GET /v2/me/blocks + DELETE /v2/users/{userId}/blocks)

## Target

`app/apps/MemeApp/src/` 내:
- 신규 `presentation/user-block/block-management.screen.tsx` (BlockManagementScreen)
- 신규 `presentation/user-block/components/unblock-confirm-sheet.tsx` (UnblockConfirmSheet)
- 신규 `presentation/user-block/hooks/use-my-blocks.ts` (React Query infiniteQuery)
- 기존 `app/navigation/root-navigator.tsx` (Stack.Screen 등록)
- 기존 `shared/routes/link-screens.ts` (`BlockManagement` 매핑)
- 기존 `app/navigation/useNavigationLinking.ts` (zzem://block-management path)
- 기존 `presentation/settings/components/settings-body.tsx` — "차단 관리" 메뉴 항목 활성화 (ComingSoon 에서 실제 screen 연결로 교체)
- 기존 `presentation/settings/components/coming-soon-settings-section.tsx` — "차단 관리" 제거
- 관련 Maestro E2E

## Context

AC 7.6: 설정 → 차단 관리 진입 → 내가 차단한 유저 목록 → 항목별 [차단 해제] → confirm BottomSheet → 차단 해제 성공 시 리스트 제거 + 상단 Toast.

Phase 1 에서 설정 화면 골격 + ComingSoon stub 존재. 본 태스크는 stub 을 실제 screen 으로 교체한다. 설정 body canonical order ("알림 설정" → "차단 관리" → "고객센터") 는 불변.

## Objective

차단 관리 화면 + 차단 해제 flow 완결. 설정 body canonical order 와 기타 stub 항목 회귀 없음.

## Specification

### BlockManagementScreen

- 상단 헤더 "차단 관리" (back button 좌측).
- List 렌더:
  - 각 row: `avatar (profileImageUrl, 48×48 circle)` + `nickname` (Typo) + `[차단 해제]` 버튼 (우측).
  - 정렬: BE 응답 blockedAt DESC 그대로 렌더 (FE 재정렬 금지 — `?? 0` 류 fallback 금지).
  - Cursor pagination: onEndReached → next page. React Query `useInfiniteQuery`. nextCursor/hasNext 응답 값 신뢰 — mapper fallback 금지.
- Empty state: "아직 차단한 유저가 없어요" (중앙 정렬).
- Loading/Error state: 표준 SuspenseList 패턴 (기존 meme-collection.screen.tsx 참조).

### UnblockConfirmSheet

- 구현 기반: `shared/ui/gorhom-sheet/bottom-confirm-sheet.tsx`. horizontal 2-button.
- Copy (AC 7.6 직역, 하드코딩 한국어):
  - 타이틀: `"{nickname}님을 차단 해제하시겠어요?"`.
  - 바디: `"이 계정의 콘텐츠가 다시 피드에 노출되며, 상대방도 회원님의 프로필과 콘텐츠를 볼 수 있어요. 차단을 해제한 사실은 상대방에게 알려지지 않아요."`.
  - Primary button: `"차단 해제"` (non-destructive — 기본 톤).
  - Secondary button: `"취소"`.
- 확인 탭 → DELETE /v2/users/{userId}/blocks mutation.
  - Success: optimistic list 에서 해당 row 제거 + Toast (하단 — 기존 Toast 컴포넌트 재사용) "{nickname}님을 차단 해제했어요" (AC 7.6 직역).
  - Error: Sheet 유지 + error Toast.
- 팔로우 자동 복원 없음 (AC 7.6): BE 가 이미 차단 시점 UserFollow 양방향 삭제. 차단 해제 후 해당 유저 프로필 재진입 시 follow-state=NONE.

### Navigation wiring

- RootNavigator: `<Stack.Screen name="BlockManagement" component={BlockManagementScreen} />`.
- link-screens: `BlockManagement: "block-management"` 매핑.
- Deep link: `zzem://block-management`.
- SettingsBody 의 "차단 관리" 메뉴 onPress → `navigation.navigate("BlockManagement")`.

### Cache invalidation

- Unblock 성공 시 invalidate: `['my-blocks']` (본 screen), `['user-profile', userId]` (다시 isBlocked=false), `['follow-state', userId]` (NONE). Cross-component 전수: 프로필 재진입 시 올바른 상태.

### Out of Scope

- 차단 진입 (app-003 담당).
- 블록 사용자 신고 (본 태스크 미포함).
- 팔로우 자동 복원 (AC 7.6 명시적 금지).

## Acceptance Criteria

- [ ] BlockManagementScreen 이 `zzem://block-management` 딥링크 + Settings → 차단 관리 진입점 양쪽에서 정상 렌더.
- [ ] List 항목: avatar + nickname + [차단 해제] 버튼 구조 + blockedAt DESC 정렬 (BE 응답 그대로).
- [ ] Empty state 문구 "아직 차단한 유저가 없어요".
- [ ] UnblockConfirmSheet 문구 AC 7.6 직역 검증 (타이틀/바디/버튼 텍스트 exact match).
- [ ] 차단 해제 성공 시 리스트에서 제거 + Toast "{nickname}님을 차단 해제했어요".
- [ ] 팔로우 자동 복원 없음 (차단 해제 후 follow-state=NONE) — React Query invalidate 검증.
- [ ] Mapper fallback 금지 grep: `rg '\?\?\s*0|\?\?\s*false|userProfile\.id\s*\|\|\s*""|nickname\s*\|\|\s*""' app/apps/MemeApp/src/presentation/user-block → 0 hit`.
- [ ] Dead hook 금지 grep: `rg 'useMyBlocks\(|useUnblockUser\(' app/apps/MemeApp/src → ≥ 2 hit` (각 hook 정의 1 + callsite ≥ 1).
- [ ] Settings body canonical order 회귀 없음: "알림 설정" → "차단 관리" → "고객센터" 순서 + ComingSoon 에서 "차단 관리" 제거됨 검증.
- [ ] RootNavigator 등록 + link-screens 매핑 + zzem://block-management 딥링크 동작.
- [ ] E2E flow 생성: `apps/MemeApp/e2e/flows/settings-block-management.yaml` — appId + zzem://block-management deeplink + list item nickname assertVisible + [차단 해제] tap + confirm sheet assertVisible (Maestro CTA 한계로 sheet tap 후 결과는 Evaluator 코드 트레이스 위임).
- [ ] E2E seed 필요: caller 가 최소 1명을 차단한 상태 — be-002 seed fetcher 또는 테스트 API 로 주입 (e2e-seed-plan.md 에 명시).
- [ ] lint / typecheck / tsc --noEmit 신규 에러 0.

## Implementation Hints

- List 컴포넌트: 기존 `meme-collection.screen.tsx` 의 infiniteQuery + `onEndReached` 패턴을 참조. `FlatList` 또는 `FlashList` 재사용.
- Avatar 는 기존 `shared/ui/avatar` 또는 profile 컴포넌트 재사용. 원형 48×48.
- Toast: 기존 meme-viewer 또는 settings 에 Toast 재사용처 grep 으로 찾기 (`rg 'showToast\|Toast\\(' app/src`).
- useInfiniteQuery queryKey: `['my-blocks']`. select 로 flat `list` 합성.
- UnblockConfirmSheet 는 app-003 의 BlockConfirmSheet 와 visual 일관성 유지 (동일 2-button 패턴).

## Regression Guard

- Settings body canonical order 불변 (Phase 1 SettingsBody 순서).
- "알림 설정" 메뉴 (app-007 담당) stub 유지.
- "고객센터" stub 유지 (ComingSoon).
- ProfileCountRow, HomeHeader 미간섭.
- Phase 2 feed/like/payback 회귀 없음 (관련 없음이지만 React Query cache invalidation 범위 확인).
- Cross-component 영향 범위 전수: settings-body.tsx (메뉴 activate), coming-soon-settings-section.tsx (차단 관리 제거), root-navigator.tsx (Stack.Screen 추가), link-screens.ts, useNavigationLinking.ts. 외 파일 수정 금지.
