# APP-004: Follow UI

## Target
- **User Story**: US6 (팔로우)
- **Acceptance Criteria**: AC 6.1, 6.2, 6.3
- **API Dependency**: BE-004 (Follow API)

## Context
팔로우 버튼, 팔로워/팔로잉 리스트 화면. 팔로우 상태 3가지(none/following/mutual) 표시. 리스트는 본인만 조회 가능.

## Objective
팔로우 관련 UI 컴포넌트 구현.

## Specification

### Screens / Components

#### FollowButton
- 타 유저 프로필, 팔로워/팔로잉 리스트에서 노출
- 상태별 표시:
  - `none` → "팔로우" (primary 스타일)
  - `following` → "팔로잉" (secondary 스타일)
  - `mutual` → "맞팔로우" (secondary 스타일)
- 탭 → 팔로우 토글
- Optimistic update
- API: `POST /follows` / `DELETE /follows/:targetUserId`

#### FollowerListScreen
- 프로필에서 팔로워 카운트 탭 시 이동
- 가나다순 정렬 리스트
- 각 아이템: 프로필 이미지, 닉네임, FollowButton
- cursor pagination (무한 스크롤)
- 아이템 탭 → 해당 유저 프로필 이동
- API: `GET /follows/me/followers`

#### FollowingListScreen
- 프로필에서 팔로잉 카운트 탭 시 이동
- 가나다순 정렬 리스트
- 각 아이템: 프로필 이미지, 닉네임, FollowButton
- cursor pagination (무한 스크롤)
- 아이템 탭 → 해당 유저 프로필 이동
- API: `GET /follows/me/following`

### Data Flow
- FollowButton: `useMutation` → follow/unfollow → invalidate follow queries + profile query
- FollowerListScreen: `useInfiniteQuery` → `GET /follows/me/followers`
- FollowingListScreen: `useInfiniteQuery` → `GET /follows/me/following`

### Implementation Hints
- FollowButton 재사용: 프로필, 리스트, 검색 결과 등
- Optimistic update: followStatus 즉시 전환
- React Navigation stack으로 리스트 → 프로필 이동

## Acceptance Criteria

### AC 6.1: 팔로우 상태
- 3가지 상태(none/following/mutual) 올바르게 표시
- 토글 시 상태 즉시 전환

### AC 6.2: 팔로우 리스트
- 가나다순 정렬
- 각 유저에 팔로우 상태 버튼 표시
- 무한 스크롤 동작
- 타 유저 프로필에서는 리스트 진입 불가 (카운트 숫자만 표시)

### AC 6.3: 팔로우와 피드 추천
- 팔로우/언팔로우 후 피드에 반영 (서버 측 부스트)
