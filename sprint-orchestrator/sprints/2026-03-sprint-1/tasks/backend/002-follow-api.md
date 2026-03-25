# Task: 002-follow-api

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: 팔로우 시스템
- API Contract Reference: POST /follows/{targetUserId}, DELETE /follows/{targetUserId}, GET /profiles/{userId}/followers, GET /profiles/{userId}/followings
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: 001-profile-api (프로필 구조 필요)
- Parallel With: 002-credit-payback

## Objective
사용자 간 팔로우/언팔로우 기능을 구현한다. 팔로워/팔로잉 목록은 프로필 소유자만 조회할 수 있으며, 가나다순으로 정렬한다. 팔로우 상태는 following, mutual, none으로 구분하고, 피드 추천 부스트 시그널을 제공한다.

## Specification

### Input
- **POST /follows/{targetUserId}**
  - Path Parameter: `targetUserId` (string, required)
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`
- **DELETE /follows/{targetUserId}**
  - Path Parameter: `targetUserId` (string, required)
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`
- **GET /profiles/{userId}/followers**
  - Path Parameter: `userId` (string, required)
  - Query Parameters: `cursor` (optional), `limit` (optional, default 20)
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`
- **GET /profiles/{userId}/followings**
  - Path Parameter: `userId` (string, required)
  - Query Parameters: `cursor` (optional), `limit` (optional, default 20)
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`

### Output
- **POST /follows/{targetUserId}**
  - 201 Created: `{ "followStatus": "following" | "mutual" }`
  - 400 Bad Request: 자기 자신을 팔로우한 경우
  - 409 Conflict: 이미 팔로우 중인 경우
- **DELETE /follows/{targetUserId}**
  - 200 OK: `{ "followStatus": "none" }`
  - 404 Not Found: 팔로우 관계가 없는 경우
- **GET /profiles/{userId}/followers, /followings**
  - 200 OK: Cursor-paginated user list (가나다순 정렬)
  - 403 Forbidden: 본인이 아닌 경우

### Business Rules
1. 자기 자신은 팔로우할 수 없다.
2. 이미 팔로우 중인 사용자를 다시 팔로우하면 409 에러를 반환한다.
3. 팔로우 상태: `following` (일방 팔로우), `mutual` (맞팔로우), `none` (팔로우 관계 없음).
4. 팔로워/팔로잉 목록은 본인(owner)만 조회할 수 있다.
5. 팔로워/팔로잉 목록은 닉네임 기준 가나다순(알파벳순)으로 정렬한다.
6. 페르소나 계정 팔로우는 허용하되, 페르소나에게 알림을 보내지 않는다.
7. 팔로우한 사용자의 콘텐츠에 피드 추천 부스트 시그널을 제공한다.
8. Follow 스키마: `{ followerId, followingId, createdAt }` 형태로 저장한다.

## Implementation Hints
- 기존 패턴 참조: favorite(좋아요 토글) 도메인의 관계 저장 패턴
- 팔로워/팔로잉 카운트는 profile-api의 응답에 반영해야 함
- 필수 스킬 참조:
  - `.claude/skills/nestjs-architecture/SKILL.md` — 레이어 구조
  - `.claude/skills/backend-ground-rule/SKILL.md` — 네이밍, DTO, DB 규칙
  - `.claude/skills/cursor-pagination/SKILL.md` — 커서 기반 페이지네이션

## Acceptance Criteria
- [ ] POST /follows/{targetUserId}로 팔로우가 정상 동작한다
- [ ] DELETE /follows/{targetUserId}로 언팔로우가 정상 동작한다
- [ ] 자기 자신 팔로우 시 400 에러가 반환된다
- [ ] 중복 팔로우 시 409 에러가 반환된다
- [ ] 팔로우 상태(following/mutual/none)가 정확히 반환된다
- [ ] 팔로워/팔로잉 목록이 가나다순으로 정렬된다
- [ ] 본인이 아닌 사용자가 목록 조회 시 403이 반환된다
- [ ] 프로필 API의 followerCount, followingCount가 정확히 반영된다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
