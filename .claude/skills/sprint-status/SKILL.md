---
name: sprint-status
description: Show sprint progress dashboard with task statuses, branch info, and next steps. Use when the user wants to check sprint status, or says /sprint-status.
---

# Sprint Status

## Goal

스프린트의 현재 진행 상태를 대시보드 형태로 출력한다.

## Invocation

```
/sprint-status <sprint-id>
/sprint-status              # 가장 최근 스프린트 자동 감지
```

## Workflow

### 1. 스프린트 디렉토리 확인

sprint-id가 주어지지 않으면 `sprint-orchestrator/sprints/` 하위에서 가장 최근 디렉토리를 선택한다.

### 2. 정보 수집

**태스크 상태:**
- `tasks/backend/*.md`, `tasks/app/*.md` 목록
- 각 태스크의 result 파일 존재 여부 및 Status 필드 파싱
  - result 파일 위치: 해당 프로젝트 레포 내 `{task-id}.result.md`
  - Status: COMPLETED | PARTIAL | FAILED | MISSING (result 파일 없음)

**브랜치 상태:**
- 각 레포에서 sprint 브랜치(`zzem/{sprint-id}`) 존재 여부
- sprint 브랜치의 커밋 수 (base branch 대비)

**PR 상태:**
- `gh pr list`로 해당 sprint 브랜치의 PR 존재 여부 및 상태 확인

### 3. 대시보드 출력

```
═══════════════════════════════════════════════════
  Sprint: {sprint-id}
  PRD: {prd-source}
  Config: backend → {base-branch} | app → {base-branch}
═══════════════════════════════════════════════════

  Progress: ████████░░░░ {N}/{M} tasks

  Task                           Backend      App
  ─────────────────────────────  ───────────  ───────────
  001-content-publish-status     COMPLETED    COMPLETED
  002-profile-api                COMPLETED    PARTIAL
  003-profile-edit-and-nickname  RUNNING      COMPLETED
  004-credit-payback             PENDING      PENDING

  Branches:
    wrtn-backend:       zzem/{sprint-id} ({N} commits ahead of {base})
    app-core-packages:  zzem/{sprint-id} ({N} commits ahead of {base})

  PRs:
    wrtn-backend:       {url} [{state}]
    app-core-packages:  not created

═══════════════════════════════════════════════════
  Next step: {context-aware suggestion}
═══════════════════════════════════════════════════
```

### 4. Next Step 추천

현재 상태에 따라 다음 행동을 추천한다:

| 상태 | 추천 |
|------|------|
| 태스크 파일만 있고 실행 안 됨 | `/sprint-run {sprint-id}` |
| 일부 태스크 실패 | `/sprint-run {sprint-id} {failed-task-id}` (재실행) |
| 전체 완료, PR 없음 | `/sprint-pr {sprint-id}` |
| PR 생성됨 | PR 리뷰 링크 안내 |
| 스프린트 디렉토리 없음 | `/sprint-init` |

## Constraints

- 읽기 전용: 어떤 파일도 수정하지 않는다
- 프로젝트 레포가 없거나 접근 불가하면 해당 컬럼을 "N/A"로 표시
- git/gh 명령 실패 시 graceful하게 처리 (가용한 정보만 출력)
