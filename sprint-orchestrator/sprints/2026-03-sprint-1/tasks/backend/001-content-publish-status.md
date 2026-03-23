# Task: 001 - 콘텐츠 공개/비공개 상태 관리

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: US1 (피드 공개), AC 1.1~1.4
- API Contract Reference: PUT /contents/{contentId}/publish-status, GET /contents/{contentId}/publish-info
- Dependencies: 없음 (선행 태스크 없음)
- Parallel With: app/001

## Objective
콘텐츠의 공개/비공개 상태를 관리하는 API를 구현한다.
기존 콘텐츠 스키마에 `isPublished` 필드를 추가하고, 공개/비공개 전환 API와 상태 조회 API를 만든다.
커스텀 프롬프트 콘텐츠는 공개 불가 처리한다.

## Specification

### Input
- PUT /contents/{contentId}/publish-status: `{ isPublished: boolean }`
- GET /contents/{contentId}/publish-info: contentId (path param)

### Output
- PUT: `{ contentId, isPublished, updatedAt }`
- GET: `{ contentId, isPublished, isCustomPrompt, totalPaybackCredits, regenerationCount }`

### Business Rules
1. 커스텀 프롬프트 결과물은 공개(isPublished=true) 전환 시 400 에러 반환
2. 기능 업데이트 이전 콘텐츠는 비공개 상태 유지 (마이그레이션은 별도 배치)
3. 업데이트 이후 신규 콘텐츠는 공개가 디폴트
4. 비공개 전환 시 이미 지급된 페이백 크레딧은 회수하지 않음
5. 공개/비공개 전환은 콘텐츠 소유자만 가능

## Implementation Hints
- 기존 패턴 참조: `apps/meme-api/src/application/favorite/` (toggle 패턴)
- 기존 콘텐츠 관련 스키마를 찾아 `isPublished: boolean` 필드 추가
- `isCustomPrompt` 필드도 확인 (커스텀 프롬프트 여부 판별 로직)
- **필수 스킬 참조:**
  - `.claude/skills/nestjs-architecture/SKILL.md` — Controller → Application → Domain → Persistence 레이어 구조
  - `.claude/skills/backend-ground-rule/SKILL.md` — 네이밍, DTO 규칙

### 레이어 구현 순서
1. Persistence: 기존 콘텐츠 스키마에 `isPublished` 필드 추가
2. Domain: ContentPublishDomainService (상태 전환 로직, 커스텀 프롬프트 체크)
3. Application: ContentPublishAppController + ContentPublishAppService
4. DTOs: request/response 정의

## Acceptance Criteria
- [ ] PUT /contents/{contentId}/publish-status 로 공개↔비공개 전환 가능
- [ ] 커스텀 프롬프트 콘텐츠에 isPublished=true 요청 시 400 에러
- [ ] 콘텐츠 소유자가 아닌 유저의 요청은 403 에러
- [ ] GET /contents/{contentId}/publish-info 로 상태 조회 가능
- [ ] 신규 생성 콘텐츠의 isPublished 기본값 = true (커스텀 프롬프트 제외)

## QA Checklist
- [ ] Unit tests 통과 (커스텀 프롬프트 체크, 소유권 검증)
- [ ] TypeScript 컴파일 에러 없음
- [ ] Lint 통과
- [ ] 기존 테스트 regression 없음
- [ ] Swagger 문서에 정상 노출
