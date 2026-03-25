# Task: 001-content-publish-status

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: 콘텐츠 공개/비공개 상태 관리
- API Contract Reference: PUT /contents/{contentId}/publish
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: 없음
- Parallel With: 001-profile-api, 001-nickname-auto-generation

## Objective
콘텐츠에 공개/비공개 상태(isPublished)를 추가하여 사용자가 자신의 콘텐츠를 피드에 공개하거나 비공개로 전환할 수 있도록 한다. 커스텀 프롬프트로 생성된 콘텐츠는 공개할 수 없으며, 기존 콘텐츠는 모두 비공개 상태로 마이그레이션한다.

## Specification

### Input
- **PUT /contents/{contentId}/publish**
  - Path Parameter: `contentId` (string, required)
  - Body: `{ "isPublished": boolean }`
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`

### Output
- **PUT /contents/{contentId}/publish**
  - 200 OK: `{ "contentId": string, "isPublished": boolean, "updatedAt": string }`
  - 400 Bad Request: 커스텀 프롬프트 콘텐츠인 경우
  - 403 Forbidden: 본인 콘텐츠가 아닌 경우
  - 404 Not Found: 콘텐츠가 존재하지 않는 경우

### Business Rules
1. Content 스키마에 `isPublished: boolean` 필드를 추가한다 (default: false).
2. 커스텀 프롬프트로 생성된 콘텐츠는 공개 전환 불가 (400 에러 반환).
3. 콘텐츠 소유자만 공개/비공개 상태를 변경할 수 있다.
4. 기존 콘텐츠 마이그레이션: 모든 기존 콘텐츠를 `isPublished: false`(비공개)로 설정한다.
5. 공개된 콘텐츠만 피드 및 다른 사용자의 프로필에 노출된다.
6. 비공개 콘텐츠는 본인 프로필의 private 탭에서만 확인 가능하다.

## Implementation Hints
- 기존 패턴 참조: content 도메인의 기존 CRUD 패턴
- 마이그레이션 스크립트: MongoDB migration으로 기존 document에 `isPublished: false` 추가
- 필수 스킬 참조:
  - `.claude/skills/nestjs-architecture/SKILL.md` — 레이어 구조
  - `.claude/skills/backend-ground-rule/SKILL.md` — 네이밍, DTO, DB 규칙

## Acceptance Criteria
- [ ] Content 스키마에 `isPublished` 필드가 추가되었다
- [ ] PUT /contents/{contentId}/publish API가 정상 동작한다
- [ ] 커스텀 프롬프트 콘텐츠 공개 시 400 에러가 반환된다
- [ ] 본인 콘텐츠가 아닌 경우 403 에러가 반환된다
- [ ] 기존 콘텐츠 마이그레이션 스크립트가 존재하고 정상 동작한다
- [ ] 공개 상태 변경 후 updatedAt이 갱신된다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
