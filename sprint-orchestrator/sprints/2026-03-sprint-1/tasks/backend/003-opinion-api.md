# Task: 003-opinion-api

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: 의견 보내기
- API Contract Reference: POST /opinions
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: 001-profile-api
- Parallel With: 003-block-report-api, 003-notification-api

## Objective
사용자가 자유 텍스트(최대 300자)로 의견을 보낼 수 있는 기능을 구현한다. 선택적으로 관련 콘텐츠 ID를 첨부할 수 있으며, 의견은 DB에만 저장한다 (관리자 UI는 별도 구현 예정).

## Specification

### Input
- **POST /opinions**
  - Body:
    ```json
    {
      "text": "string (max 300 chars)",
      "contentId": "string | null (optional)"
    }
    ```
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`

### Output
- **POST /opinions**
  - 201 Created: `{ "opinionId": string, "createdAt": string }`
  - 400 Bad Request: text가 빈 문자열이거나 300자 초과인 경우
  - 404 Not Found: contentId가 존재하지 않는 콘텐츠인 경우

### Business Rules
1. 의견 텍스트는 최대 300자까지 허용한다.
2. 빈 문자열은 허용하지 않는다.
3. contentId는 선택 사항이며, 제공 시 존재하는 콘텐츠인지 검증한다.
4. 의견은 DB에만 저장하며, 관리자 UI는 이번 스프린트에서 구현하지 않는다.
5. 의견 저장 시 작성자의 userId를 함께 기록한다.
6. 동일 사용자의 의견 제출 빈도 제한은 없다.

## Implementation Hints
- 기존 패턴 참조: user-report 도메인의 저장 패턴 (사용자 입력을 DB에 저장하는 단순 구조)
- Opinion 스키마: `{ userId, text, contentId?, createdAt }`
- 필수 스킬 참조:
  - `.claude/skills/nestjs-architecture/SKILL.md` — 레이어 구조
  - `.claude/skills/backend-ground-rule/SKILL.md` — 네이밍, DTO, DB 규칙

## Acceptance Criteria
- [ ] POST /opinions로 의견이 정상 저장된다
- [ ] 300자 초과 텍스트 입력 시 400 에러가 반환된다
- [ ] 빈 문자열 입력 시 400 에러가 반환된다
- [ ] contentId 제공 시 존재하지 않는 콘텐츠이면 404 에러가 반환된다
- [ ] 작성자 userId가 의견과 함께 저장된다
- [ ] 관리자 UI 없이 DB에만 저장된다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
