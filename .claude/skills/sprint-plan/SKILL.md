---
name: sprint-plan
description: Decompose a sprint PRD into tasks, API contract, and QA scenarios. Use when the user wants to plan a sprint, break down a PRD into tasks, or says /sprint-plan.
---

# Sprint Plan

## Goal

스프린트 PRD를 읽고, 기존 코드베이스 패턴을 파악한 뒤, 태스크 파일 + API contract + QA 시나리오를 생성한다.

## Invocation

```
/sprint-plan <sprint-id>
/sprint-plan              # 가장 최근 생성된 스프린트 자동 감지
```

## Workflow

### 1. 스프린트 디렉토리 확인

```
sprint-orchestrator/sprints/{sprint-id}/ 존재 확인
PRD.md 존재 확인
sprint-config.yaml 존재 확인
```

없으면: "먼저 /sprint-init을 실행하세요" 안내 후 중단.

### 2. PRD 분석

PRD.md의 source 링크를 따라가서 원본 PRD를 읽는다.
User Story와 Acceptance Criteria를 추출한다.

### 3. 기존 코드베이스 패턴 파악

**Backend (wrtn-backend/apps/meme-api/src/):**
- 기존 Controller, Service, Module 패턴 확인
- DTO, Entity 구조 파악
- 기존 API 엔드포인트 목록 확인

**App (app-core-packages/apps/MemeApp/src/):**
- 기존 화면(Screen) 구조 확인
- 컴포넌트, 네비게이션 패턴 파악
- API 호출 패턴 (hooks, services) 확인

### 4. API Contract 생성

`api-contract.yaml`을 OpenAPI 3.0 형식으로 작성한다.

- PRD의 각 기능에 대한 엔드포인트 정의
- Request/Response 스키마 정의
- 기존 API 패턴(인증, 에러 응답 등)과 일관성 유지

### 5. 태스크 분해

각 기능을 backend/app 태스크로 분해한다.

**태스크 파일 형식**: `sprint-orchestrator/templates/` 내 기존 태스크를 참조하되, 아래 필수 섹션을 포함한다:

```markdown
# Task: {NNN}-{feature-slug}

## Target
- target_app: MemeApp                  # (app 태스크)
- target_api: meme-api                 # (backend 태스크)
- target_path: {수정 대상 경로}

## Context
- Sprint: {sprint-id}
- PRD Section: {해당 User Story}
- API Contract Reference: {api-contract.yaml 내 path}
  - Contract 위치: ../sprint-orchestrator/sprints/{sprint-id}/api-contract.yaml
- Dependencies: {선행 태스크 ID}
- Parallel With: {동시 수행 가능한 태스크}

## Objective
{2-3문장 요약}

## Specification
### Input
### Output
### Business Rules

## Implementation Hints
- 기존 패턴 참조: {유사 구현체 경로}
- 필수 스킬 참조: {해당 레포의 .claude/skills/ 내 관련 스킬}

## Acceptance Criteria
- [ ] {검증 가능한 조건}

## QA Checklist
- [ ] Unit tests 통과
- [ ] Lint/Type check 통과
- [ ] 기존 테스트 regression 없음
- [ ] 수정된 파일이 target_path 범위 내인지 확인
```

**태스크 번호 규칙:**
- 번호는 의존성 순서 반영 (낮은 번호 = 선행)
- 동일 번호 = 병렬 수행 가능
- backend/app 태스크는 동일 기능이면 같은 번호 부여

### 6. QA 시나리오 생성

`qa/test-scenarios.md`에 통합 테스트 시나리오를 작성한다.

### 7. 검증 (Validate)

생성된 산출물을 자체 검증한다:

- [ ] api-contract.yaml이 유효한 OpenAPI 3.0인지
- [ ] 모든 태스크 파일에 필수 섹션(Target, Context, Objective, Specification, Acceptance Criteria)이 있는지
- [ ] target_app/target_api가 실제 존재하는 경로인지
- [ ] 태스크 간 의존성에 순환이 없는지
- [ ] api-contract.yaml에 정의된 모든 엔드포인트가 태스크로 커버되는지

검증 실패 시 자동 수정 후 재검증한다.

### 8. 결과 출력

```
Sprint Plan: {sprint-id}

  API Contract: sprint-orchestrator/sprints/{sprint-id}/api-contract.yaml
    - {N} endpoints defined

  Tasks:
    Backend ({N}):
      001-{slug} — {objective 요약}
      002-{slug} — {objective 요약}
    App ({N}):
      001-{slug} — {objective 요약}
      002-{slug} — {objective 요약}

  QA Scenarios: {N} scenarios

  Dependency Graph:
    001: backend/001 ∥ app/001  (parallel)
    002: backend/002 → app/002  (app depends on backend)
    ...

Next: /sprint-run {sprint-id}
```

## Constraints

- 읽기 전용 모드: 기존 코드베이스 파일을 수정하지 않음
- 생성하는 파일: api-contract.yaml, tasks/**/*.md, qa/test-scenarios.md만
- 태스크 하나의 예상 작업량은 1-4시간 분량 (atomic task)
- 기존 코드 패턴을 무시하고 새로운 패턴을 도입하지 않음
