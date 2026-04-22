# app-006 · 좋아요 탭 활성화 (AC 3.2)

- **Group**: 003
- **Owner**: fe-engineer
- **Depends on**: be-004 (liked 리스트 endpoint), app-005 (좋아요 토글 신규 API)

## Target

`app/apps/MemeApp/src/domain/me-contents/me-contents.usecase.ts` (`isLikedPhase1` 플래그 제거)
`app/apps/MemeApp/src/presentation/profile/profile.screen.tsx` (좋아요 탭 렌더 분기)
`app/apps/MemeApp/src/presentation/profile/components/profile-content-grid.tsx` (재사용)

## Context

Phase 1 의 `me-contents.usecase.ts:43` 에 `const isLikedPhase1 = visibility === "liked"` 플래그 존재. 이 플래그 true 일 때 쿼리 실행 skip + 빈 리스트 반환.

`profile.screen.tsx:122-147` 는 `tab === "liked"` 시 `ProfileEmptyState` 고정 렌더. Phase 2 에서 실제 좋아요한 콘텐츠 리스트로 전환.

AC 3.2: 최신순 (좋아요 누른 시점), 피드/프로필/검색 어떤 경로 좋아요도 단일 탭에 통합.

## Objective

`isLikedPhase1` 플래그 제거. 좋아요 탭에서 `/v2/me/contents?visibility=liked` 실제 호출 + 그리드 렌더. 빈 상태 (0 건) UI 처리.

## Specification

### UseCase 변경
- `me-contents.usecase.ts` 의 `isLikedPhase1` / `enabled: !isLikedPhase1` gate 제거.
- `useGetMyContentsUseCase({ visibility: 'liked' })` 는 실제 쿼리 실행.
- 다른 visibility (public/private) 는 동일 동작 유지 (회귀 없음).

### 응답 매핑
- BE 응답 `ContentListResponse` — 각 ContentSummary 는 `liked: true` 보장 (be-004). 앱 측에서 추가 검증 불필요.
- 동일 매퍼 (`meme.mapper.ts` or `me-contents.mapper.ts`) 재사용.

### 그리드 렌더
- 기존 `profile-content-grid` 컴포넌트 재사용 (공개/비공개 탭과 동일 UI).
- 좋아요 탭에서도 카드에 좋아요 카운트 (app-005) + 썸네일 + 필요한 메타.
- 탭 전환 시 counts 동기화.

### Empty State
- 좋아요한 콘텐츠 0 건인 경우: 기존 `ProfileEmptyState` 재사용 (Phase 1 이미 사용 중).
  - 메시지 커스터마이즈: `"아직 좋아요한 콘텐츠가 없어요"` (Prototype 에서 최종 확정).

### 그리드 카드 → 세로 스와이프 연결
- 좋아요 탭에서 카드 탭 → `SwipeFeed` with `source: { kind: 'liked', ... }` 또는 기존 `{ kind: 'me', visibility: 'liked' }` variant 사용.
- SwipeFeed 의 discriminated union 에 liked variant 지원 필요 여부 확인:
  - 현재 `{kind:'me', visibility:'public'|'private'}` 만 지원 (Phase 1).
  - `visibility: 'liked'` 확장 필요. `useGetProfileSwipeFeedUseCase` 가 liked 케이스도 BE `/me/contents?visibility=liked` 호출하도록 라우팅 추가.
- `enabled` gate: `visibility === 'liked'` 일 때도 queryFn 정상 실행 (rubric C12 — variant 별 enabled 가드).

### Counts 연동
- `me-contents/counts` 응답의 `liked` 값 실제 noteworthy. 카운트 라벨에 반영 (`"좋아요 {count}"`).
- counts 응답 `liked === 0` 이면 tab chip 에 `"좋아요"` 또는 PRD 에 따라 숨김 — PRD 2.2 "3탭 노출" 이므로 **0 일 때도 탭 표시** 가 default. Prototype 에서 확정.

### Regression Guard
- 공개/비공개 탭 동작 회귀 없음.
- 좋아요 탭 빈 상태 → ProfileEmptyState 렌더 회귀 없음 (Phase 1 동작 보존).

### Out of Scope
- 좋아요 탭 전용 정렬 옵션 (최신순만).
- 좋아요 탭 검색.

## Acceptance Criteria

- [ ] `isLikedPhase1` 플래그 제거됨 (grep 으로 확인).
- [ ] 좋아요 탭에서 실제 콘텐츠 리스트 렌더 (seed 기반 e2e 검증).
- [ ] 그리드 카드 탭 → 세로 스와이프 진입 (liked 컨텍스트 유지).
- [ ] 빈 상태 (0 건) → ProfileEmptyState + 메시지.
- [ ] counts 응답의 liked 값이 탭 라벨에 반영.
- [ ] SwipeFeed liked variant 에서 queryFn 정상 동작 + enabled 가드 (rubric C12).
- [ ] 공개/비공개 탭 회귀 없음 (Phase 1 e2e `my-profile-default-landing.yaml` 통과).
- [ ] `yarn typescript | grep -v '@wrtn/'` 신규 에러 0.

## Screens / Components

- **MyProfileScreen-LikedTab** (Screen variant — MY Profile 의 좋아요 탭 활성 상태):
  - 그리드 레이아웃 (기존 공개/비공개 탭 그리드 재사용, 2열 or 3열)
  - 각 카드: thumbnail + likeCount badge (app-005)
  - Header: 기존 유지 (프로필 정보 + 3탭 bar)
- **LikedTabEmptyState** (Component, 좋아요 0 건):
  - Message: "아직 좋아요한 콘텐츠가 없어요"
  - Illustration: 기존 ProfileEmptyState 재사용 or 하트 그레이 icon
- States: default(with-items) / empty / loading / error

## Implementation Hints

- `me-contents.usecase.ts` 의 기존 플래그 라인을 삭제 대신 조건 변경.
- SwipeFeed 의 `useGetProfileSwipeFeedUseCase` variant switch 에 liked 케이스 추가:
  - `source.kind === 'me' && source.visibility === 'liked'` → `/v2/me/contents?visibility=liked` 호출.
- Prototype 단계에서 좋아요 탭 빈 상태 메시지/일러스트 확정.
- 쿼리 key 차별화: `['me-contents', visibility]` 패턴 유지.
