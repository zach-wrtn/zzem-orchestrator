# APP-003: Like UI

## Target
- **User Story**: US3 (좋아요)
- **Acceptance Criteria**: AC 3.1, 3.2, 3.3
- **API Dependency**: BE-003 (Like API)

## Context
좋아요 버튼 인터랙션 및 프로필 좋아요 탭. 셀프 좋아요 허용. 좋아요 수 실제 숫자 노출 (0 포함, 축약 없음). 기존 피드의 좋아요 UI 위치/인터랙션 위에 레이어링.

## Objective
좋아요 관련 UI 컴포넌트 구현.

## Specification

### Screens / Components

#### LikeButton
- 세로 스와이프 + 그리드 카드에서 노출
- 탭 → 토글 (좋아요/취소)
- Optimistic update: 탭 즉시 UI 반영 → API 호출 → 실패 시 롤백
- 좋아요 수 표시: 실제 숫자 (축약 없음, 0일 때도 노출)
- 좋아요 애니메이션 (하트 팝)
- API: `POST /favorites/content/toggle`

#### LikeTab (ProfileScreen 내 탭)
- 프로필 좋아요 탭 콘텐츠 그리드
- 좋아요 시점 최신순 정렬
- 모든 경로 좋아요 통합 표시
- cursor pagination (무한 스크롤)
- 차단된 유저 콘텐츠 자동 필터링 (서버 측)
- API: `GET /profiles/me/favorites`

### Data Flow
- LikeButton: `useMutation` → `POST /favorites/content/toggle` → optimistic update + invalidate like queries
- LikeTab: `useInfiniteQuery` → `GET /profiles/me/favorites`
- 좋아요 상태는 콘텐츠 아이템의 `isLiked` 필드로 판단

### Implementation Hints
- Optimistic update: React Query `onMutate` → update cache → `onError` rollback
- 애니메이션: React Native Animated 또는 Reanimated
- 그리드/스와이프 양쪽에서 LikeButton 재사용

## Acceptance Criteria

### AC 3.1: 셀프 좋아요
- 내 콘텐츠에 좋아요 가능
- 토글 정상 동작

### AC 3.2: 좋아요 탭
- 좋아요한 콘텐츠 최신순 그리드
- 무한 스크롤 동작
- 다른 경로에서 누른 좋아요도 통합 표시

### AC 3.3: 좋아요 추천 시그널
- 좋아요 수: 실제 숫자 표시 (0 포함, 축약 없음)
- 그리드 카드 + 세로 스와이프 모두에서 좋아요 수 노출
