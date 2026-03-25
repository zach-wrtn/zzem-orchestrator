# Task: 002-credit-payback

## Target
- target_api: meme-api
- target_path: apps/meme-api/src/

## Context
- Sprint: 2026-03-sprint-1
- PRD Section: 크레딧 페이백 시스템
- API Contract Reference: POST /credit/payback/trigger, GET /credit/payback/config
  - Contract 위치: ../sprint-orchestrator/sprints/2026-03-sprint-1/api-contract.yaml
- Dependencies: 001-content-publish-status (isPublished 필드 필요)
- Parallel With: 002-follow-api

## Objective
공개된 콘텐츠의 원작자에게 생성 비용의 일정 비율을 크레딧으로 페이백하는 시스템을 구현한다. 페이백 비율은 환경 변수로 관리하며, 마진 체크를 통과한 경우에만 지급한다. 페르소나 콘텐츠는 수령인이 없으므로 페이백을 건너뛴다.

## Specification

### Input
- **POST /credit/payback/trigger** (내부 API)
  - Body: `{ "contentId": string, "regeneratedByUserId": string }`
  - Auth: Internal service call
- **GET /credit/payback/config**
  - Auth: `@DUser("userId")`, `@UseGuards(LibUserGuard)`

### Output
- **POST /credit/payback/trigger**
  - 200 OK: `{ "paybackAmount": number, "creditType": "promotion", "recipientUserId": string }`
  - 200 OK (skipped): `{ "skipped": true, "reason": "persona_content" | "margin_check_failed" | "not_published" }`
- **GET /credit/payback/config**
  - 200 OK: `{ "paybackRate": number, "creditType": "promotion" }`

### Business Rules
1. 페이백 비율은 생성 비용의 1%이며, Config 환경 변수로 관리한다.
2. 페이백 금액 계산: `ceil(generationCost * paybackRate)` — 올림 처리.
3. 마진 체크: 페이백 지급 전 마진이 충분한지 확인한다.
4. 크레딧 타입은 `promotion`으로 지급한다.
5. 페르소나 콘텐츠는 수령인이 없으므로 페이백을 건너뛴다 (skipped 응답).
6. 비공개(isPublished: false) 콘텐츠는 페이백 대상에서 제외한다.
7. 크레딧 히스토리에 "크레딧 페이백" 설명 + 썸네일을 함께 기록한다.
8. 원작자에게 페이백 알림을 트리거한다 (알림 시스템 구현 후 연동).

## Implementation Hints
- 기존 패턴 참조: credit 도메인의 크레딧 지급/차감 로직
- 페이백 비율은 ConfigService 또는 환경 변수로 관리
- 필수 스킬 참조:
  - `.claude/skills/nestjs-architecture/SKILL.md` — 레이어 구조
  - `.claude/skills/backend-ground-rule/SKILL.md` — 네이밍, DTO, DB 규칙

## Acceptance Criteria
- [ ] POST /credit/payback/trigger가 정상 동작한다
- [ ] 페이백 금액이 올림(ceil) 처리된다
- [ ] 마진 체크 실패 시 skipped 응답이 반환된다
- [ ] 페르소나 콘텐츠에 대해 페이백이 건너뛰어진다
- [ ] 비공개 콘텐츠에 대해 페이백이 건너뛰어진다
- [ ] 크레딧 타입이 promotion으로 지급된다
- [ ] 크레딧 히스토리에 "크레딧 페이백" + 썸네일이 기록된다
- [ ] GET /credit/payback/config가 페이백 설정을 반환한다

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
