# BE-004: Follow API

## Target
- **User Story**: US6 (팔로우)
- **Acceptance Criteria**: AC 6.1, 6.2, 6.3
- **API Contract**: `api-contract.yaml` — Follow section

## Context
유저 간 팔로우/언팔로우, 팔로워/팔로잉 리스트 조회. 팔로우 시 추천 부스트 시그널 전달. 차단 시 편방향 해제. 페르소나 계정 팔로우 가능하나 알림 미발송.

## Objective
- `POST /follows` — 팔로우
- `DELETE /follows/:targetUserId` — 언팔로우
- `GET /follows/me/followers` — 내 팔로워 리스트
- `GET /follows/me/following` — 내 팔로잉 리스트

## Specification

### Data Model
- **Follow** collection (MongoDB)
  - `followerId` (string, indexed) — 팔로우 하는 유저
  - `followingId` (string, indexed) — 팔로우 당하는 유저
  - `createdAt` (Date)
  - Compound unique index: `{followerId, followingId}`

### Follow Status Logic
- `none`: 팔로우 관계 없음
- `following`: 내가 상대를 팔로우
- `mutual`: 서로 팔로우

### Follow/Unfollow
- 셀프 팔로우 불가 (400)
- 중복 팔로우 시도 시 idempotent (기존 유지)
- 팔로우 시 UserProfile의 followerCount/followingCount 업데이트

### Follower/Following List
- 가나다순 정렬 (nickname collation)
- cursor pagination
- 각 유저에 followStatus 포함
- 타 유저 프로필에서는 리스트 조회 불가 (본인만 가능)

### Block Integration
- 차단 시 `followerId → followingId` 방향만 해제 (BE-006에서 호출)
- 역방향(B→A) 팔로우는 유지

### Recommendation Signal
- 팔로우 생성/삭제 시 추천 시스템에 부스트 시그널 이벤트 발행

### Implementation Hints
- `@Transactional()` for follow + count update
- `@Lock()` for count atomic update
- Korean collation: `{ locale: 'ko' }` in Mongoose sort

## Acceptance Criteria

### AC 6.1: 팔로우 상태
- 프로필 조회 시 followStatus 반환 (none/following/mutual)
- 맞팔로우 정확히 감지

### AC 6.2: 팔로우 리스트
- 팔로워/팔로잉 리스트 가나다순 정렬
- 각 유저에 followStatus 버튼 상태 포함
- 본인만 리스트 조회 가능 (타인 요청 시 403)

### AC 6.3: 팔로우와 피드 추천
- 팔로우/언팔로우 시 추천 시스템에 시그널 전달
- 페르소나 계정 팔로우 가능
