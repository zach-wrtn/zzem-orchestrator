# app-005 · 좋아요 카운트 표시 + 셀프 좋아요 + API 재배선

- **Group**: 003
- **Owner**: fe-engineer
- **Depends on**: be-004 (likes endpoint), app-001 (FeedItemEntity 확장)

## Target

`app/apps/MemeApp/src/domain/favorite/favorite.usecase.ts`
`app/apps/MemeApp/src/data/favorite/` (있으면 repository-impl 수정 or 신규 `data/likes/`)
`app/apps/MemeApp/src/presentation/swipe-feed/components/swipe-feed-actions.tsx`
`app/apps/MemeApp/src/presentation/profile/` (그리드 카드에 좋아요 카운트 노출)
`app/apps/MemeApp/src/presentation/swipe-feed/swipe-feed.screen.tsx` (카운트 표시)

## Context

Phase 1 에서 `useToggleFavoriteUseCase()` 가 기존 `reaction` / `favorite` endpoint 에 바인딩되어 있음 (REACTION enum LIKE/DISLIKE 기반). be-004 로 신규 `POST/DELETE /v2/contents/:id/likes` endpoint 가 제공되므로, **기존 훅을 신규 endpoint 에 재배선** 한다.

AC 3.1: 셀프 좋아요 허용. AC 3.3: 좋아요 수는 **실제 숫자** (축약 없음, 0 포함). 그리드 카드 + 세로 스와이프 상세 양쪽에서 노출.

## Objective

좋아요 토글 훅을 be-004 endpoint 로 재배선. 좋아요 카운트를 실제 숫자로 그리드/상세에 표시. 셀프 좋아요 허용 검증.

## Specification

### API 재배선
- `useToggleFavoriteUseCase()` 또는 등가 훅 수정:
  - `toggleFavorite(contentId, nextState)`:
    - `nextState === true` → `POST /v2/contents/:contentId/likes`.
    - `nextState === false` → `DELETE /v2/contents/:contentId/likes`.
  - Response: `LikeToggleResponse { contentId, liked, likeCount }` → 로컬 state + React Query cache 업데이트.
- 기존 endpoint (`reaction` 류) 호출 경로는 유지 (다른 목적이면 회귀 방지), 좋아요 전용 로직만 치환.
- `enabled` gate: 훅은 mutation 이므로 enabled 개념 없음. 단 read-side `useGetContentLikeCount` 등이 있다면 parent-dependent 인 경우 `enabled: !!parentData` (rubric C12).

### Count 표시 — 실제 숫자
- `FeedItemEntity.likeCount` (app-001 매퍼에서 반영된 값) 을 그대로 숫자로 렌더.
- `likeCount.toString()` 또는 i18n `new Intl.NumberFormat('ko-KR').format(likeCount)` (천 단위 콤마 — PRD 에 명시 없으나 관례).
  - **축약 사용 금지** — korean-count 포매터 미사용.
- 0 일 때도 `"0"` 표시 (AC 3.3).

### 표시 위치
1. **세로 스와이프 좋아요 버튼** (app-001 레이아웃 내, 좋아요 아이콘 아래 카운트).
2. **MY / 타유저 프로필 그리드 카드** — 기존 카드에 좋아요 카운트 뱃지/텍스트 추가.
   - 프로필 그리드 컴포넌트: `profile-content-item.tsx` 또는 등가.
   - Prototype 에서 카드 레이아웃 (하트 icon + 숫자) 최종 확정.

### Self-like
- 소유자 판정 (`item.ownerId === myUserId`) 과 무관하게 좋아요 가능.
- 버튼 disable 금지. Self-like 시 `likeCount +1` 반영.

### React Query Cache 동기화
- 좋아요 토글 후 아래 쿼리 invalidate 또는 optimistic update:
  - 세로 스와이프 피드 (`meme-feed`).
  - 프로필 콘텐츠 목록 (`me-contents`, `user-contents`).
  - 좋아요 탭 목록 (`me-contents?visibility=liked`) — app-006 에서 활성화.
  - counts (`me-contents/counts`) — liked 증가.
- Optimistic update 예시 (Phase 1 favorite usecase 패턴 재사용):
  - onMutate: 모든 infinite query data 를 탐색해 해당 contentId 의 `{ liked, likeCount }` 업데이트.
  - onError: rollback.
  - onSuccess: 서버 응답으로 최종 sync (idempotent 하므로 UI drift 없음).

### Regression Guard
- 기존 favorite UI 가 다른 목적 (예: 저장/북마크) 이면 분리 유지 (조사 필요).
- `DoubleTapLikeOverlay` (기존 구현) 동작 유지 — 동일 훅 호출.

### Out of Scope
- 좋아요 탭 활성화 (app-006).
- 좋아요 알림 (Phase 3).
- 추천 시스템 시그널 (BE 측).

## Acceptance Criteria

- [ ] 좋아요 토글 훅이 be-004 endpoint (POST/DELETE) 호출.
- [ ] 응답 `LikeToggleResponse` 파싱 후 캐시 업데이트.
- [ ] 세로 스와이프 좋아요 버튼에 실제 숫자 카운트 렌더 (0 포함, 축약 없음). **ko-KR thousand separator 적용** (`>=1000` 시 콤마 — `8,600`, `12,345`). DRIFT-01 반영.
- [ ] 프로필 그리드 카드에 좋아요 카운트 표시.
- [ ] 셀프 좋아요 동작 (soldier content 에 본인이 좋아요 → count +1).
- [ ] 취소 시 count -1.
- [ ] Optimistic update 적용 + 에러 시 rollback (Phase 1 selllected 패턴 재사용).
- [ ] DoubleTapLikeOverlay 재사용 — 제스처로 좋아요 토글 가능.
- [ ] 신규 네트워크 호출 path 가 `/v2/contents/:id/likes` 인지 검증 (mock/log).
- [ ] `yarn typescript | grep -v '@wrtn/'` 신규 에러 0.

## Screens / Components

- **LikeButton** (Component, SwipeFeed 액션 바 내 — app-001 레이아웃 유지):
  - Icon: heart (filled when liked / outlined when not)
  - Count text: 실제 숫자 (축약 없음, 0 포함)
  - States: not-liked(0), not-liked(with-count), liked, self-liked
- **ProfileGridCard-LikeBadge** (Component, 프로필 그리드 카드 우하단):
  - Small heart icon + likeCount text
  - visibility: 항상 노출 (0 포함)
- **DoubleTapLikeOverlay** (Existing) — 재사용, 동일 훅 호출
- States: card-default / card-liked

## Implementation Hints

- 기존 `domain/favorite/favorite.usecase.ts` Phase 1 패턴 참조 — cache 일괄 update.
- QueryKey 상수 파일 (`favorite.query-key.ts` or `like.query-key.ts` 신설 검토).
- 그리드 카드 좋아요 badge: heart icon + 숫자 조합. Prototype 에서 배치/간격 확정.
- `liked` 상태 변화에 따른 하트 fill 색 스위칭 — 기존 LikeButton UI 의 active state.
- **주의**: 재생성 카운트는 korean-count 포맷 (app-001), 좋아요는 실제 숫자. 혼동 금지.
