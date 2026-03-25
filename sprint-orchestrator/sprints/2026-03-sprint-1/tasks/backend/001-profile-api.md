# Task: 001-profile-api

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: 프로필 API (조회 + 카운트)
- API Contract Reference: GET /profiles/me, GET /profiles/{userId}, GET /profiles/{userId}/contents
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: 없음
- Parallel With: 001-content-publish-status, 001-nickname-auto-generation

## Objective
사용자 프로필 조회 API를 구현하여 팔로워/팔로잉/재생성 카운트를 포함한 프로필 정보를 제공한다. 탭 기반 콘텐츠 목록(published, private, liked)을 지원하며, private 탭은 본인에게만 노출한다. 기존 user-profile 도메인을 확장하여 구현한다.

## Specification

### Input
- **GET /profiles/me**
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`
- **GET /profiles/{userId}**
  - Path Parameter: `userId` (string, required)
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`
- **GET /profiles/{userId}/contents**
  - Path Parameter: `userId` (string, required)
  - Query Parameters:
    - `tab`: `published` | `private` | `liked` (required)
    - `cursor`: string (optional, base64 encoded)
    - `limit`: number (optional, default 20)
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`

### Output
- **GET /profiles/me, GET /profiles/{userId}**
  - 200 OK:
    ```json
    {
      "userId": "string",
      "nickname": "string",
      "profileImageUrl": "string | null",
      "followerCount": 0,
      "followingCount": 0,
      "regeneratedCount": 0,
      "shareUrl": "string",
      "isMyProfile": true
    }
    ```
- **GET /profiles/{userId}/contents**
  - 200 OK: Cursor-paginated content list
  - 403 Forbidden: private 탭을 타인이 요청한 경우

### Business Rules
1. `/profiles/me`는 JWT에서 추출한 userId로 본인 프로필을 조회한다.
2. followerCount, followingCount는 팔로우 기능 구현 전까지 0으로 반환한다.
3. regeneratedCount는 해당 유저가 생성한 총 콘텐츠 수이다.
4. `tab=private`는 본인만 접근 가능하며, 타인 요청 시 403을 반환한다.
5. `tab=published`는 공개된 콘텐츠만 노출한다.
6. `tab=liked`는 좋아요한 콘텐츠를 최신 좋아요 순으로 노출한다.
7. 프로필 공유 URL을 생성하여 shareUrl로 반환한다.
8. 기존 user-profile 도메인을 확장하여 구현한다.

## Implementation Hints
- 기존 패턴 참조: user-profile 도메인의 기존 구조, feed 도메인의 커서 페이지네이션
- 필수 스킬 참조:
  - `.claude/skills/nestjs-architecture/SKILL.md` — 레이어 구조
  - `.claude/skills/backend-ground-rule/SKILL.md` — 네이밍, DTO, DB 규칙
  - `.claude/skills/cursor-pagination/SKILL.md` — 커서 기반 페이지네이션

## Acceptance Criteria
- [ ] GET /profiles/me가 본인 프로필을 정상 반환한다
- [ ] GET /profiles/{userId}가 다른 사용자 프로필을 정상 반환한다
- [ ] followerCount, followingCount, regeneratedCount가 응답에 포함된다
- [ ] GET /profiles/{userId}/contents?tab=published가 공개 콘텐츠를 커서 페이지네이션으로 반환한다
- [ ] tab=private를 타인이 요청 시 403이 반환된다
- [ ] tab=liked가 좋아요한 콘텐츠를 최신순으로 반환한다
- [ ] shareUrl이 프로필 응답에 포함된다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
