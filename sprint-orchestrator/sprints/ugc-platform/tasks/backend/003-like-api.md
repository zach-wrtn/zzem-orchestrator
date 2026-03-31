# BE-003: Like API

## Target
- **User Story**: US3 (좋아요)
- **Acceptance Criteria**: AC 3.1, 3.2, 3.3
- **API Contract**: `api-contract.yaml` — Like section

## Context
콘텐츠 좋아요 토글 및 좋아요한 콘텐츠 목록 조회. 셀프 좋아요 허용. 좋아요 데이터는 추천 시스템에 시그널로 전달. 차단된 유저 콘텐츠는 좋아요 목록에서 필터링.

## Objective
- `POST /favorites/content/toggle` — 좋아요 토글 (좋아요/취소)
- `GET /profiles/me/favorites` — 내가 좋아요한 콘텐츠 목록

## Specification

### Data Model
- **Like** collection (MongoDB)
  - `userId` (string, indexed)
  - `contentId` (string, indexed)
  - `createdAt` (Date)
  - Compound unique index: `{userId, contentId}`

### Toggle Logic
- 기존 Like 문서 존재 → 삭제 (unlike)
- 미존재 → 생성 (like)
- Content의 `likeCount` 동기 업데이트 (`@Lock` for concurrency)
- 셀프 좋아요 허용 (userId === content.userId 체크 안 함)

### Like List
- cursor pagination (Like.createdAt 기준 내림차순)
- 차단된 유저의 콘텐츠 필터링 (Block collection join)
- 삭제된 콘텐츠 필터링

### Recommendation Signal
- 좋아요 생성/삭제 시 추천 시스템에 이벤트 발행 (기존 이벤트 버스 활용)

### Implementation Hints
- `@Lock()` decorator for likeCount atomic update
- `@Transactional()` for toggle + count update
- 차단 필터: aggregation pipeline에서 Block lookup

## Acceptance Criteria

### AC 3.1: 셀프 좋아요
- 본인 콘텐츠에 좋아요 토글 → 성공, likeCount 반영
- 페르소나 콘텐츠 좋아요 → 성공

### AC 3.2: 좋아요 탭
- `GET /profiles/me/favorites` → 좋아요 시점 최신순 정렬
- 모든 경로(피드/프로필/검색)에서 누른 좋아요 통합 조회
- 차단된 유저 콘텐츠 미노출

### AC 3.3: 좋아요 추천 시그널
- 좋아요/취소 시 추천 시스템에 이벤트 전달
- likeCount: 실제 숫자 그대로 반환 (축약 없음, 0 포함)
