# Task: 003-notification-api

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: 알림 시스템
- API Contract Reference: GET /notifications, PUT /notifications/{id}/read, GET /notifications/unread-count, GET /notifications/settings, PUT /notifications/settings
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: 002-follow-api, 002-credit-payback (알림 소스)
- Parallel With: 003-block-report-api, 003-opinion-api

## Objective
좋아요, 크레딧 페이백, 뉴스, 팔로우 카테고리의 알림 시스템을 구현한다. 커서 기반 페이지네이션으로 알림 목록을 제공하고, 카테고리별 알림 설정(ON/OFF)을 지원한다. 페르소나 계정은 모든 알림에서 제외한다.

## Specification

### Input
- **GET /notifications**
  - Query Parameters: `cursor` (optional), `limit` (optional, default 20)
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`
- **PUT /notifications/{id}/read**
  - Path Parameter: `id` (string, required)
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`
- **GET /notifications/unread-count**
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`
- **GET /notifications/settings**
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`
- **PUT /notifications/settings**
  - Body:
    ```json
    {
      "like": true,
      "credit": true,
      "news": true,
      "follow": true
    }
    ```
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`

### Output
- **GET /notifications**
  - 200 OK: Cursor-paginated notification list
    ```json
    {
      "items": [
        {
          "id": "string",
          "category": "like" | "credit" | "news" | "follow",
          "message": "string",
          "thumbnailUrl": "string | null",
          "isRead": false,
          "createdAt": "string"
        }
      ],
      "nextCursor": "string | null"
    }
    ```
- **PUT /notifications/{id}/read**
  - 200 OK: `{ "id": string, "isRead": true }`
- **GET /notifications/unread-count**
  - 200 OK: `{ "count": number }`
- **GET /notifications/settings**
  - 200 OK: `{ "like": true, "credit": true, "news": true, "follow": true }`
- **PUT /notifications/settings**
  - 200 OK: updated settings object

### Business Rules
1. 알림 카테고리: like(좋아요), credit(크레딧 페이백), news(뉴스), follow(팔로우).
2. 알림 보존 기간: 1개월 — TTL index 또는 배치 삭제로 구현.
3. 페르소나 계정은 모든 알림에서 제외한다 (발신/수신 모두).
4. 좋아요 알림: 개별 알림, 빈도 제한 없음.
5. 팔로우 알림: 개별 알림, 즉시 푸시 + 인앱 알림.
6. 크레딧 페이백 알림: 배치 전달 (일정 주기로 모아서 발송).
7. 사용자는 카테고리별로 알림을 ON/OFF 설정할 수 있다.
8. 알림 설정이 OFF인 카테고리의 알림은 생성하지 않는다.
9. 읽지 않은 알림 개수를 unread-count API로 제공한다.

## Implementation Hints
- 기존 패턴 참조: feed 도메인의 커서 페이지네이션, favorite 도메인의 이벤트 발행 패턴
- MongoDB TTL index를 사용하여 1개월 후 자동 삭제 구현
- 알림 생성은 이벤트 기반으로 처리 (NestJS EventEmitter 또는 유사 패턴)
- 필수 스킬 참조:
  - `.claude/skills/nestjs-architecture/SKILL.md` — 레이어 구조
  - `.claude/skills/backend-ground-rule/SKILL.md` — 네이밍, DTO, DB 규칙
  - `.claude/skills/cursor-pagination/SKILL.md` — 커서 기반 페이지네이션

## Acceptance Criteria
- [ ] GET /notifications가 커서 페이지네이션으로 알림 목록을 반환한다
- [ ] PUT /notifications/{id}/read로 알림을 읽음 처리할 수 있다
- [ ] GET /notifications/unread-count가 읽지 않은 알림 수를 반환한다
- [ ] GET/PUT /notifications/settings로 카테고리별 알림 설정을 관리할 수 있다
- [ ] 페르소나 계정에게 알림이 생성되지 않는다
- [ ] 1개월 이상 된 알림이 자동 삭제된다 (TTL index)
- [ ] 알림 설정이 OFF인 카테고리의 알림이 생성되지 않는다
- [ ] 좋아요 알림이 개별적으로 생성된다
- [ ] 크레딧 페이백 알림이 배치로 전달된다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
