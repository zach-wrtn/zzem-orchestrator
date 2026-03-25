---
name: sprint-init
description: Initialize a new sprint directory with config, PRD link, and folder structure. Use when starting a new sprint, or when the user says /sprint-init.
---

# Sprint Init

## Goal

새 스프린트 디렉토리를 생성하고, sprint-config.yaml과 PRD 링크를 세팅한다.

## Invocation

```
/sprint-init <sprint-id> <prd-file>
/sprint-init                         # interactive — 물어보며 진행
```

## Workflow

### 1. 인자 수집

인자가 부족하면 물어본다:

- **sprint-id**: 스프린트 식별자 (예: `2026-03-sprint-2`)
- **prd-file**: PRD 파일 경로 (예: `docs/prds/PRD-002-creator-monetization.md`)

### 2. PRD 파일 존재 확인

```
docs/prds/{prd-file} 이 존재하는지 확인
없으면 에러 출력 후 중단
```

### 3. 디렉토리 구조 생성

```
sprint-orchestrator/sprints/{sprint-id}/
├── PRD.md                    # PRD 링크
├── sprint-config.yaml        # 브랜치 설정
├── tasks/
│   ├── app/                  # (빈 디렉토리)
│   └── backend/              # (빈 디렉토리)
├── qa/                       # (빈 디렉토리)
└── logs/                     # (빈 디렉토리)
```

### 4. PRD.md 생성

PRD 원본을 복사하지 않고 링크만 생성한다:

```markdown
---
source: ../../../{prd-file-relative-path}
---

# PRD Reference

이 스프린트의 PRD 원본: [{prd-filename}](../../../{prd-file-relative-path})

## 스프린트 스코프 요약

(PRD를 읽고 이 스프린트에 포함되는 User Story들을 요약하여 기록)
```

PRD 원본을 읽고 스코프 요약을 자동 생성한다.

### 5. sprint-config.yaml 생성

템플릿 `sprint-orchestrator/templates/sprint-config-template.yaml`을 참고하여 생성한다.

사용자에게 각 프로젝트의 base branch를 물어본다:

```
backend (wrtn-backend) base branch? [develop]:
app (app-core-packages) base branch? [main]:
```

기본값은 괄호 안의 값.

### 6. 결과 출력

```
Sprint initialized: {sprint-id}

  Directory: sprint-orchestrator/sprints/{sprint-id}/
  PRD: {prd-file}
  Base branches:
    backend: {base-branch}
    app: {base-branch}

Next: /sprint-plan {sprint-id}
```

## Constraints

- 이미 존재하는 sprint-id면 덮어쓰지 않고 에러 출력
- PRD 파일이 `docs/prds/` 하위에 없으면 경고 (다른 경로도 허용은 하되 확인)
- `tasks/`, `qa/`, `logs/` 디렉토리는 빈 상태로 생성 (`.gitkeep` 파일 추가)
