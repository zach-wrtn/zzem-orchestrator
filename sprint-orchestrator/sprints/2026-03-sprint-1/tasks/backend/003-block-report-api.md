# Task: 003-block-report-api

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: 차단/신고 시스템
- API Contract Reference: POST /blocks/{targetUserId}, DELETE /blocks/{targetUserId}, POST /reports
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: 002-follow-api (차단 시 A→B 팔로우 제거)
- Parallel With: 003-notification-api, 003-opinion-api

## Objective
사용자 차단 및 콘텐츠/사용자 신고 기능을 구현한다. 차단 시 A→B 방향의 팔로우만 일방적으로 제거하고, 좋아요는 DB에 유지하되 노출하지 않는다. 신고 비율은 추천 페널티 시그널로 활용한다.

## Specification

### Input
- **POST /blocks/{targetUserId}**
  - Path Parameter: `targetUserId` (string, required)
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`
- **DELETE /blocks/{targetUserId}**
  - Path Parameter: `targetUserId` (string, required)
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`
- **POST /reports**
  - Body:
    ```json
    {
      "targetType": "content" | "user",
      "targetId": "string",
      "reason": "string",
      "description": "string (max 100 chars)"
    }
    ```
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`

### Output
- **POST /blocks/{targetUserId}**
  - 201 Created: `{ "blockedUserId": string, "createdAt": string }`
  - 400 Bad Request: 자기 자신을 차단한 경우
  - 409 Conflict: 이미 차단 중인 경우
- **DELETE /blocks/{targetUserId}**
  - 200 OK: `{ "unblockedUserId": string }`
  - 404 Not Found: 차단 관계가 없는 경우
- **POST /reports**
  - 201 Created: `{ "reportId": string, "createdAt": string }`
  - 400 Bad Request: description이 100자 초과인 경우

### Business Rules
1. 차단 시 A→B 방향의 팔로우만 일방적으로 제거한다 (B→A 팔로우는 유지).
2. 차단된 사용자의 좋아요는 DB에 유지하되, 피드/프로필에서 숨긴다.
3. 차단된 사용자의 콘텐츠는 피드와 프로필에서 노출하지 않는다.
4. 자기 자신은 차단할 수 없다.
5. 신고 사유(reason)와 상세 설명(description, 최대 100자)을 함께 저장한다.
6. 신고 대상에게 알림을 보내지 않는다.
7. 신고 비율이 높은 콘텐츠/사용자에 대해 추천 페널티 시그널을 제공한다.
8. 동일 사용자가 동일 대상에 대해 중복 신고할 수 없다.

## Implementation Hints
- 기존 패턴 참조: user-report 도메인의 기존 신고 로직, favorite 도메인의 관계 관리
- 차단 시 팔로우 제거는 follow-api의 서비스를 호출
- 피드/프로필 조회 시 차단 사용자 필터링 로직 추가 필요
- 필수 스킬 참조:
  - `.claude/skills/nestjs-architecture/SKILL.md` — 레이어 구조
  - `.claude/skills/backend-ground-rule/SKILL.md` — 네이밍, DTO, DB 규칙

## Acceptance Criteria
- [ ] POST /blocks/{targetUserId}로 차단이 정상 동작한다
- [ ] DELETE /blocks/{targetUserId}로 차단 해제가 정상 동작한다
- [ ] 차단 시 A→B 팔로우만 제거되고 B→A는 유지된다
- [ ] 차단된 사용자의 콘텐츠가 피드/프로필에서 숨겨진다
- [ ] POST /reports로 신고가 정상 동작한다
- [ ] description이 100자를 초과하면 400 에러가 반환된다
- [ ] 동일 대상 중복 신고 시 에러가 반환된다
- [ ] 신고 대상에게 알림이 발송되지 않는다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
