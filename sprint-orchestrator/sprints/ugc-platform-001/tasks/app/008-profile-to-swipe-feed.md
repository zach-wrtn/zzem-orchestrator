# app-008 · 프로필 → 세로 스와이프 피드 엔트리

- **Group**: 003
- **Owner**: fe-engineer
- **Depends on**: app-003 (본인 프로필), app-006 (타유저 프로필), be-003 / be-004 (콘텐츠 리스트)

## Target

`app/apps/MemeApp/src/presentation/profile/` + 기존 swipe-feed screen.

## Context

AC 2.5: 본인 프로필의 공개/비공개 탭에서 콘텐츠 탭 → 세로 스와이프 피드 진입, 해당 탭의 콘텐츠만 노출. AC 7.1: 타유저 프로필의 게시물 탭 → 해당 유저의 게시물만 노출.

기존 앱에는 세로 스와이프 피드 스크린이 존재(`swipe-feed.yaml` E2E flow 기준). 본 태스크는 **프로필 → 피드로의 진입 파라미터 전달**과 **피드 측의 source 해석**만 다룬다.

## Objective

프로필 그리드의 탭 동작이 세로 스와이프 피드로 진입하여, 해당 그리드와 동일한 콘텐츠 컨텍스트(본인 공개/본인 비공개/타유저 공개)를 유지하게 한다.

## Specification

### Screens / Components
- 신규 스크린 없음. 기존 SwipeFeedScreen에 **진입 source 파라미터**를 추가.

### Behavior
- 프로필 그리드 아이템 onPress → `navigation.navigate('SwipeFeed', { source: ProfileFeedSource, initialContentId })`.
- `ProfileFeedSource` union 예시:
  - `{ kind: 'me', visibility: 'public' }`
  - `{ kind: 'me', visibility: 'private' }`
  - `{ kind: 'user', userId: string }`
- SwipeFeed 내부 콘텐츠 쿼리는 source별로 다른 endpoint를 호출:
  - me/public → `/v2/me/contents?visibility=public`
  - me/private → `/v2/me/contents?visibility=private`
  - user/:id → `/v2/users/:userId/contents`
- 좋아요 탭에서의 진입은 본 Phase 대상 아님(콘텐츠 없음).
- 커서 페이지네이션은 기존 Swipe 로직 재사용 — queryFn만 source별 분기.

### KB Contract Clauses
- completeness-003 (major, freq 1): `SwipeFeed` route.types에 `source` param 추가 시, 모든 navigate 호출부(프로필 그리드, 타유저 그리드, 기존 홈 경로)에서 전달되는지. 기존 홈 경로에서 `source` 미전달 시 기존 동작(추천 풀) fallback 보장.
- integration-001 (critical): 응답 필드명 일치.
- correctness-001 (critical): Cursor 응답 재래핑 금지(BE 이미 준수). FE는 `nextCursor`를 그대로 consuming하는지 확인.

### Tests
- Maestro flow 신규: `profile-to-swipe-feed.yaml`
  - `zzem://e2e-auth` → 프로필 탭 → 공개 탭 → 첫 아이템 openLink(`zzem://swipe-feed?...`) 또는 testID 기반 tap.
  - Feed 내 첫 아이템 콘텐츠 id가 공개 탭 첫 아이템과 일치 `assertVisible`.
- CTA 검증 타협: 탭 결과(Feed 진입)까지는 `assertVisible`, 무한 스크롤 동작은 Evaluator 코드 추적.

## Acceptance Criteria

- [ ] 본인 공개 탭 아이템 탭 → SwipeFeed에 본인 공개 콘텐츠만 노출 + `initialContentId` 위치로 시작.
- [ ] 본인 비공개 탭 아이템 탭 → SwipeFeed에 본인 비공개 콘텐츠만.
- [ ] 타유저 게시물 탭 아이템 탭 → SwipeFeed에 해당 유저 공개 콘텐츠만.
- [ ] 기존 홈/피드 경로(추천)는 source 미전달 시 기존 동작 유지 — 회귀 없음.
- [ ] Maestro `profile-to-swipe-feed.yaml` 통과.

## Implementation Hints

- 참조: `shared/routes/route.types.ts`, 기존 `swipe-feed.yaml` E2E flow.
- 기존 SwipeFeed queryFn 분기는 switch 또는 source별 factory 함수로 분리.
- `initialContentId`가 응답 목록 내 index를 계산하는 로직은 기존 SwipeFeed 패턴 재사용.
