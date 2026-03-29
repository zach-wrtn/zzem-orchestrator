# Task: 003-likes-ui

## Target
app-core-packages/apps/MemeApp

## Context
- PRD US3: 좋아요 (AC 3.1~3.3)
- 기존 좋아요 UI: SwipeFeedActions의 heart 아이콘 + DoubleTapLikeOverlay
- 기존 `useToggleFavoriteUseCase()` → 새 Like API로 교체/확장 필요
- API Contract: PUT /likes, GET /likes/me

## Objective
좋아요 토글을 새 Like API로 연동하고, 프로필 좋아요 탭에 실제 데이터를 연결하며, 그리드/스와이프에서 좋아요 수를 표시한다.

## Specification

### Screens / Components
- **SwipeFeedActions 수정**: 기존 favorite 대신 Like API 호출
  - 좋아요 수 표시: 실제 숫자 (축약 없음, 0 포함)
- **ProfileScreen 좋아요 탭**: GET /likes/me 연동
  - 좋아요 시점 최신순 그리드
- **그리드 카드 좋아요 수**: ContentItem에 likeCount 표시
- **DoubleTapLikeOverlay**: 기존 동작 유지, API만 교체

### Data Flow
- Domain: `useToggleLikeUseCase()`, `useGetMyLikedContentsUseCase()`
- Data: LikeRepository, likeQueryKey
- Optimistic update: 좋아요 토글 시 즉시 카운트 반영, 실패 시 롤백
- 캐시 무효화: 좋아요 토글 시 관련 피드 쿼리 갱신

### Implementation Hints
- 기존 `useToggleFavoriteUseCase()` 패턴 참고
- 기존 SwipeFeedActions의 heart 아이콘 색상/상태 로직 유지
- 좋아요 탭은 `useInfiniteQuery` + 그리드 레이아웃

## Acceptance Criteria
- [ ] 세로 스와이프에서 heart 아이콘 탭 시 Like API가 호출되고 아이콘 상태가 토글된다
- [ ] 더블탭 시 DoubleTapLikeOverlay 애니메이션이 동작하고 좋아요가 추가된다
- [ ] 좋아요 수가 세로 스와이프에서 실제 숫자로 표시된다 (0 포함, 축약 없음)
- [ ] 그리드 카드에 좋아요 수가 표시된다
- [ ] 프로필 좋아요 탭에 좋아요한 콘텐츠가 좋아요 시점 최신순으로 표시된다
- [ ] 좋아요 탭에서 콘텐츠 탭 시 해당 탭 콘텐츠만으로 세로 스와이프 진입한다
- [ ] 좋��요 토글 시 optimistic update가 적용되어 즉시 UI에 반영된다
- [ ] 비로그인 유저가 좋아요 시도 시 로그인 화면으로 이동한다
