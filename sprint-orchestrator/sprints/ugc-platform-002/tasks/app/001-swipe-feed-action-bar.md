# app-001 · 세로 스와이프 액션 바 재구성 (재생성 카운트 버튼 추가)

- **Group**: 002
- **Owner**: fe-engineer
- **Depends on**: be-002 (regenerateCount 필드), be-004 (likeCount/liked 필드)

## Target

`app/apps/MemeApp/src/presentation/swipe-feed/components/` 및 관련 엔티티/매퍼:
- `swipe-feed-actions.tsx`
- `data/meme/meme.mapper.ts` / `FeedItemEntity`
- `shared/ui/icon/` (필요 시 icon token 확장)

## Context

Phase 1 기준 `swipe-feed-actions.tsx` 는 좋아요 + 공유 + 더보기 3 버튼 구조. AC 1.7 은 **좋아요 / 재생성 / 공유 / 더보기 4 버튼** 을 위에서 아래로 배치하도록 명시. 재생성 버튼은 카운트 표시 (축약 O), 공유 버튼은 카운트 미노출.

좋아요 카운트는 실제 숫자 (AC 3.3), 재생성 카운트는 축약 포맷 (korean-count — "8.6천"). 댓글 버튼은 **미노출** (spec-out, 댓글 Figma 디자인은 Phase 1 에서 미구현).

## Objective

세로 스와이프 우측 액션 바 레이아웃을 PRD AC 1.7 순서 (좋아요 → 재생성 → 공유 → 더보기) 로 재구성. 재생성 횟수 버튼 신규 추가. 각 버튼의 카운트 포맷 규칙 준수.

## Specification

### Layout (위 → 아래)
1. **좋아요 (하트)** — 카운트 실제 숫자 (AC 3.3, `likeCount` 그대로 렌더. 0 도 표시).
2. **재생성** — 카운트 축약 (`regenerateCount` 을 korean-count 포맷으로. 0 일 때 표시 여부는 **0 도 노출** — PRD 직역 "실제 숫자 표시" 와 구분하기 위해 프로토타입에서 최종 확정).
3. **공유** — 카운트 미노출. 탭 시 OS 공유 시트.
4. **더보기 (···)** — 탭 시 바텀시트 (app-002 에서 메뉴 구성).

### Button Behavior
- 좋아요: 기존 `useToggleFavoriteUseCase()` 재사용 가능하나, be-004 의 신규 endpoint 로 **재배선 필요**. app-005 에서 담당. 본 태스크는 레이아웃과 버튼 구조만.
- 재생성: 탭 시 동작 없음 (읽기 전용 카운트). 향후 재생성 상세로 네비게이션할 수 있으나 본 스프린트 scope 외.
- 공유: 기존 `useNativeShare()` 또는 세로 스와이프 공유 훅 재사용. 공유 횟수 트래킹 미구현.
- 더보기: app-002 의 ActionSheet 호출. 본 태스크는 트리거 버튼만.

### Entity / Mapper 수정
- `FeedItemEntity` 또는 등가 엔티티에 `regenerateCount: number`, `likeCount: number`, `liked: boolean`, `isCustomPrompt: boolean`, `sourceContentId: string | null` 필드 추가.
- `meme.mapper.ts` 에서 BE 응답 ContentSummary → entity 매핑 시 신규 필드 주입.
- Zod 스키마 업데이트 (각 필드 타입).

### Telemetry
- 기존 `click_vertical_feed_action_btn` 이벤트 확장: `button_name` 에 `regenerate` 추가.

### Regression Guard
- Phase 1 의 `profile-to-swipe-feed.yaml` e2e flow 는 레이아웃 변경 후에도 통과해야 한다.
- `swipe-feed-actions.tsx` 의 기존 testID (`swipe-feed-actions.like-button` 등) 유지 또는 리네임 시 e2e 동시 업데이트.

### Out of Scope
- 좋아요 API 재배선 (app-005).
- 더보기 메뉴 구성 (app-002).
- CTA 분기 (app-003).
- 게시 토글 (app-004).

## Acceptance Criteria

- [ ] 우측 액션 바 4 버튼 (좋아요 / 재생성 / 공유 / 더보기) 가 위→아래 순서로 렌더.
- [ ] 좋아요 카운트가 실제 숫자로 표시 (예: 8600 → `"8600"`). 0 일 때도 노출.
- [ ] 재생성 카운트가 korean-count 포맷으로 표시 (8600 → `"8.6천"`).
- [ ] 공유 버튼 카운트 미노출. 아이콘만.
- [ ] 더보기 버튼은 탭 시 app-002 의 ActionSheet trigger (연결).
- [ ] `FeedItemEntity` 에 `regenerateCount`, `likeCount`, `liked`, `isCustomPrompt`, `sourceContentId` 필드 존재 + zod 검증 통과.
- [ ] 매퍼가 BE 응답의 신규 필드를 정확히 매핑 (unit test 로 커버).
- [ ] 댓글 버튼 미노출 (Spec-out 확인).
- [ ] 기존 `profile-to-swipe-feed.yaml` e2e flow 통과 (회귀 없음).
- [ ] `yarn typescript | grep -v '@wrtn/'` 신규 에러 0 (rubric C7 v3).

## Screens / Components

- **SwipeFeedActionBar** (Component, 세로 스와이프 우측 영역) — 4 buttons 위→아래 순서:
  - `LikeButton` (하트 icon + likeCount 실제 숫자)
  - `RegenerateCountButton` (회전 화살표 icon + regenerateCount 축약)
  - `ShareButton` (공유 icon only)
  - `MoreButton` (··· icon, bottom sheet 트리거)
- States: default / with-counts (0 포함) / liked / not-liked
- Regression: 댓글 버튼 없음, 기존 tracking 이벤트 `click_vertical_feed_action_btn` 확장.
- **Footer canonical (DRIFT-02 반영)**: SwipeFeed footer layout (`.sf-creator` + `.sf-footer` + `.cta-button`) 은 app-003 이 SSOT. action bar 는 footer 위 별도 레이어 (`right: 12px; bottom: 240px`), CTA 와 수직 분리.

## Implementation Hints

- 참조: `swipe-feed-actions.tsx` 현재 구조 (좋아요 + 공유 + 더보기).
- Korean count 포매터: `app/apps/MemeApp/src/shared/lib/korean-count.ts` (Phase 1 산출물).
- Icon token: `Icon.Pressable` 기반. 재생성 아이콘은 디자인 시스템에 존재하는 것 재사용 (회전 화살표 / refresh icon).
- Tracking: 기존 `click_vertical_feed_action_btn` 이벤트 spec 참조.
- Prototype 단계에서 카운트 `0` 표시 여부 / 버튼 높이 등 최종 확정 필요 — screen-spec 에 canonical ACSpec 명시.
