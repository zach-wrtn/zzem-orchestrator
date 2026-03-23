# Task: 002 - 프로필 API (조회 + 콘텐츠 탭)

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US2 (프로필), AC 2.1~2.6
- API Contract Reference: GET /profiles/me, GET /profiles/{userId}, GET /profiles/{userId}/contents
- Dependencies: 001 (콘텐츠에 isPublished 필드 필요)
- Parallel With: app/001

## Objective
사용자 프로필 조회 API와 프로필 내 콘텐츠 탭(게시물/비공개/좋아요) 조회 API를 구현한다.
기존 UserProfile 도메인을 확장하여 팔로워/팔로잉/재생성 카운트를 포함한다.

## Specification

### Input
- GET /profiles/me: 인증 토큰
- GET /profiles/{userId}: userId (path param)
- GET /profiles/{userId}/contents: userId, tab(published|private|liked), cursor, limit

### Output
- ProfileResponse: `{ userId, nickname, profileImageUrl, followerCount, followingCount, regeneratedCount, isMe }`
- ProfileContentsResponse: `{ items: [{ contentId, thumbnailUrl, mediaType, isPublished, favoriteCount, createdAt }], nextCursor, hasNext }`

### Business Rules
1. 내 프로필: 게시물/비공개/좋아요 3탭 모두 조회 가능
2. 타인 프로필: 게시물(published) 탭만 조회 가능, private/liked 탭 요청 시 403
3. 비공개 탭은 본인만 접근 가능
4. 좋아요 탭: 좋아요 누른 시점 최신순 정렬
5. 게시물/비공개 탭: 콘텐츠 생성일 최신순 정렬
6. regeneratedCount = 내 공개 콘텐츠가 타 유저에 의해 재생성된 총 횟수

## Implementation Hints
- 기존 패턴 참조: `apps/meme-api/src/application/user/` (유저 조회 패턴)
- 기존 패턴 참조: `apps/meme-api/src/domain/user-profile/` (프로필 도메인)
- 기존 Favorite 시스템 재사용하여 좋아요 탭 구현
- **필수 스킬 참조:**
  - `.claude/skills/nestjs-architecture/SKILL.md`
  - `.claude/skills/backend-ground-rule/SKILL.md`
  - `.claude/skills/cursor-pagination/SKILL.md` — 커서 기반 페이지네이션 필수

### 레이어 구현 순서
1. Persistence: 기존 UserProfile 스키마에 닉네임 관련 필드 확인/추가
2. Domain: ProfileDomainService (프로필 조회 + 카운트 집계)
3. Application: ProfileAppController + ProfileAppService
4. DTOs: ProfileResponse, ProfileContentsResponse (커서 페이지네이션)

## Acceptance Criteria
- [ ] GET /profiles/me 로 내 프로필 조회 가능 (카운트 포함)
- [ ] GET /profiles/{userId} 로 타인 프로필 조회 가능
- [ ] GET /profiles/{userId}/contents?tab=published 로 공개 콘텐츠 커서 페이지네이션 조회
- [ ] GET /profiles/{userId}/contents?tab=private 로 비공개 콘텐츠 조회 (본인만)
- [ ] GET /profiles/{userId}/contents?tab=liked 로 좋아요 콘텐츠 조회 (본인만)
- [ ] 타인이 private/liked 탭 요청 시 403

## QA Checklist
- [ ] Unit tests 통과 (권한 체크, 페이지네이션)
- [ ] 커서 페이지네이션 스킬 규칙 준수
- [ ] TypeScript 컴파일 에러 없음
- [ ] Lint 통과
- [ ] 기존 테스트 regression 없음
