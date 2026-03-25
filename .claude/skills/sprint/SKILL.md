---
name: sprint
description: Unified sprint orchestration with Agent Teams. Use when the user wants to run a sprint pipeline, or says /sprint.
---

# Sprint — Unified Orchestration with Agent Teams

## Goal

Sprint Lead로서 전체 스프린트 파이프라인을 Agent Teams로 오케스트레이션한다.
BE/FE/Design/QA 전문 Teammate를 스폰하여 태스크를 병렬 실행하고, 머지 및 PR까지 자동화한다.

## Invocation

```
/sprint <sprint-id>                    # 전체 파이프라인 (Phase 1~5)
/sprint <sprint-id> --phase=init       # Phase 1만 실행
/sprint <sprint-id> --phase=plan       # Phase 2만 실행
/sprint <sprint-id> --phase=prototype  # Phase 3만 실행
/sprint <sprint-id> --phase=run        # Phase 4부터 재개
/sprint <sprint-id> --phase=pr         # Phase 5만 실행
/sprint <sprint-id> --status           # 상태 대시보드 (읽기 전용)
/sprint                                # 최근 스프린트 자동 감지
```

## Prerequisites

- Agent Teams 활성화: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (settings.local.json)
- Teammate 정의: `.claude/teammates/` 디렉토리에 4개 파일
- Stitch MCP 서버 설정 (Design Engineer용)

---

## Phase 1: Init (Sprint Lead solo)

스프린트 디렉토리를 초기화한다. Teammate 불필요.

### Workflow

1. **인자 수집**: `sprint-id`와 `prd-file` 경로를 받는다. 없으면 사용자에게 질문.
2. **PRD 존재 확인**: `docs/prds/{prd-file}` 확인.
3. **디렉토리 생성**:
   ```
   sprint-orchestrator/sprints/{sprint-id}/
   ├── PRD.md
   ├── sprint-config.yaml
   ├── tasks/
   │   ├── app/.gitkeep
   │   └── backend/.gitkeep
   ├── prototypes/app/.gitkeep
   ├── qa/.gitkeep
   └── logs/.gitkeep
   ```
4. **PRD.md**: 원본 링크 + 스코프 요약 자동 생성.
5. **sprint-config.yaml**: 사용자에게 base branch 질문 후 생성.
   - 템플릿: `sprint-orchestrator/templates/sprint-config-template.yaml`

### Output
```
Sprint initialized: {sprint-id}
  Directory: sprint-orchestrator/sprints/{sprint-id}/
  PRD: {prd-file}
  Base branches: backend → {base}, app → {base}

→ Proceeding to Phase 2: Plan
```

---

## Phase 2: Plan (Sprint Lead solo)

PRD를 분석하여 태스크 파일, API contract, QA 시나리오를 생성한다. Teammate 불필요.

### Workflow

1. **PRD 분석**: PRD.md의 source 링크를 따라가서 User Story + Acceptance Criteria 추출.
2. **코드베이스 패턴 파악**:
   - Backend: `wrtn-backend/apps/meme-api/src/` — Controller, Service, Module, DTO, Entity 패턴
   - App: `app-core-packages/apps/MemeApp/src/` — Screen, ViewModel, Repository, Navigation 패턴
3. **API Contract 생성**: `api-contract.yaml` (OpenAPI 3.0).
4. **태스크 분해**: `tasks/backend/*.md`, `tasks/app/*.md` 생성.
   - 태스크 파일 필수 섹션: Target, Context, Objective, Specification, Implementation Hints, Acceptance Criteria, QA Checklist
   - 번호 규칙: 동일 번호 = 병렬, 낮은 번호 = 선행
5. **QA 시나리오**: `qa/test-scenarios.md` 생성.
6. **자체 검증**: OpenAPI 유효성, 필수 섹션, 순환 의존성 없음, 엔드포인트 커버리지.

### Output
```
Sprint Plan: {sprint-id}
  API Contract: {N} endpoints
  Tasks: Backend {N} + App {N}
  QA Scenarios: {N}

→ Proceeding to Phase 3: Prototype
```

---

## Phase 3: Prototype (Sprint Lead + Design Engineer)

App 태스크의 UI 프로토타입을 생성하고 리뷰한다.

### Workflow

#### 3.1 태스크 목록 구성

app 태스크 중 `### Screens / Components` 섹션이 있는 태스크를 필터한다.
backend 태스크와 `Screens / Components`가 없는 app 태스크는 스킵한다.

#### 3.2 Design Engineer 스폰

Teammate 정의 파일을 읽는다: `.claude/teammates/design-engineer.md`

각 대상 태스크에 대해 `TaskCreate`:
```
Subject: proto/app/{task-id}/{ScreenName}
Description: <태스크 파일 전문 + stitch-prompt-template.md 참조 지시>
Owner: Design Engineer
```

Design Engineer가 각 화면의 프로토타입을 생성하고 `TaskUpdate: completed`로 보고한다.

#### 3.3 리뷰 (Sprint Lead ↔ 사용자)

각 프로토타입에 대해 사용자에게 순차적으로 리뷰를 진행한다:

```
─────────────────────────────────────────
Prototype: {task-id} / {ScreenName}
File: prototypes/app/{task-id}/{ScreenName}.html
─────────────────────────────────────────
```

브라우저에서 열기: `open {html-file-path}`

사용자 선택:
| 선택 | 동작 |
|------|------|
| **approve** | `approval-status.yaml` 업데이트, 태스크 파일에 `## Prototype Reference` 추가 |
| **reject** | 상태 기록, 프로토타입 참조 제외 |
| **revise** | 피드백 수집 → Design Engineer에게 수정 태스크 할당 → Stitch 재호출 |
| **skip** | pending 상태 유지, 다음 화면으로 이동 |

#### 3.4 태스크 파일 연결

승인된 프로토타입을 태스크 파일에 추가 (`## Implementation Hints` 뒤에 삽입):

```markdown
## Prototype Reference
- Approved: ../prototypes/app/{task-id}/{ScreenName}.html
- Key visual decisions: {승인 시 노트}
```

### Gate

Phase 4 진입 전 `approval-status.yaml` 확인:
- `pending` 또는 `rejected` 상태가 있으면 경고 출력
- `--force` 플래그로 게이트 무시 가능

### Output
```
Sprint Prototype: {sprint-id}
  Generated: {N} screens across {M} tasks
  Approved: {N}, Pending: {N}, Rejected: {N}

→ Proceeding to Phase 4: Execute
```

---

## Phase 4: Execute (Sprint Lead + BE + FE + QA — Full Parallelism)

태스크를 BE/FE Teammate에게 분배하여 병렬 실행하고, QA Teammate가 검증한다.

### Workflow

#### 4.1 Sprint 브랜치 생성 (Sprint Lead)

`sprint-config.yaml`에서 base branch를 해석하여 각 레포에 sprint 브랜치를 생성한다:

```bash
# wrtn-backend
cd wrtn-backend
git fetch origin {backend-base}
git checkout -b zzem/{sprint-id} origin/{backend-base}

# app-core-packages
cd app-core-packages
git fetch origin {app-base}
git checkout -b zzem/{sprint-id} origin/{app-base}
```

Base branch 해석 우선순위:
1. `sprint-config.yaml` → `branches.{project}.base`
2. `sprint-config.yaml` → `defaults.base`
3. `"main"` (하드코딩 폴백)

#### 4.2 태스크 리스트 구성 (Sprint Lead)

모든 태스크 파일을 읽고 Agent Teams 공유 태스크 리스트에 등록한다:

```
For each task file in tasks/backend/*.md:
  TaskCreate:
    Subject: impl/backend/{task-id}
    Description: <태스크 파일 전문 + API contract 경로 + sprint-id>
    Owner: BE Engineer

For each task file in tasks/app/*.md:
  TaskCreate:
    Subject: impl/app/{task-id}
    Description: <태스크 파일 전문 + API contract 경로 + prototype ref + sprint-id>
    Owner: FE Engineer
```

**의존성 인코딩:**
- 태스크 번호 기준으로 그룹화 (001, 002, 003, 004)
- 그룹 N+1의 태스크는 같은 프로젝트의 그룹 N 태스크에 `addBlockedBy`
- 태스크 파일의 `Dependencies` 필드에 명시된 크로스 태스크 의존성도 인코딩

#### 4.3 Teammate 활성화

BE Engineer와 FE Engineer를 스폰한다:
- Teammate 정의: `.claude/teammates/be-engineer.md`, `.claude/teammates/fe-engineer.md`
- 각 Teammate는 자신에게 할당된 unblocked 태스크를 자동으로 pick하여 작업을 시작한다.
- 동일 번호 그룹의 BE/FE 태스크가 **진정한 병렬**로 실행된다.

#### 4.4 머지 사이클 (Sprint Lead)

Sprint Lead는 `TaskList`를 모니터링하여 completed 태스크를 순차 머지한다:

```
When TaskUpdate: completed detected for impl/{project}/{task-id}:

  1. 해당 프로젝트 레포로 이동
  2. git checkout zzem/{sprint-id}
  3. git merge zzem/{sprint-id}/{task-id} --no-ff -m "merge: {task-id}"
  4. 충돌 시:
     - 스프린트 중단
     - 충돌 내용 출력
     - 사용자에게 수동 해결 요청
  5. 성공 시:
     - Worktree 정리: git worktree remove .worktrees/{project}_{task-id} --force
     - Task branch 삭제: git branch -d zzem/{sprint-id}/{task-id}
  6. 다음 그룹 의존성 해소 확인 → unblock
```

**같은 레포 내 머지 순서**: 번호 오름차순으로 순차 머지.
**서로 다른 레포**: 독립 git repo이므로 병렬 머지 가능.

#### 4.5 QA 검증 (Sprint Lead + QA Engineer)

각 태스크 머지 후, Sprint Lead가 QA 태스크를 생성한다:

```
TaskCreate:
  Subject: qa/{project}/{task-id}
  Description: <원본 태스크의 Acceptance Criteria + QA Checklist + Business Rules>
  Owner: QA Engineer
  addBlockedBy: [impl/{project}/{task-id}]
```

QA Engineer가 검증 후:
- **PASS**: 정상 진행
- **FAIL**: Sprint Lead가 원 엔지니어(BE/FE)에게 fix 태스크 재할당

#### 4.6 에러 처리

| 상황 | Sprint Lead 처리 |
|------|-----------------|
| Teammate 태스크 실패 | fix 태스크 재할당 (최대 2회) → 3회차 FAILED |
| 머지 충돌 | 스프린트 중단, 충돌 상세 출력, 수동 해결 요청 |
| QA 실패 | 원 엔지니어에게 QA report와 함께 fix 태스크 재할당 |
| Teammate 타임아웃 (30분) | 태스크 FAILED 처리, 다음 태스크 진행 |
| Worktree 생성 실패 | 기존 worktree 정리 후 재시도 |

### Output
```
Sprint Execute: {sprint-id}

  [Group 001]
    impl/backend/001-profile-api           ✓ COMPLETED → merged → QA PASS
    impl/backend/001-nickname-auto-gen     ✓ COMPLETED → merged → QA PASS
    impl/app/001-profile-screen            ✓ COMPLETED → merged → QA PASS
    impl/app/001-profile-edit-screen       ✓ COMPLETED → merged → QA PASS

  [Group 002]
    impl/backend/002-follow-api            ✓ COMPLETED → merged → QA PASS
    impl/app/002-follow-ui                 ⟳ RUNNING...

  Results: {N}/{M} tasks completed

→ Proceeding to Phase 5: PR (all tasks complete)
```

---

## Phase 5: PR (Sprint Lead solo)

Sprint 브랜치에서 base branch로 PR을 생성한다.

### Workflow

1. **사전 확인**: 각 레포에 sprint 브랜치 변경사항 존재 여부 확인.
2. **태스크 상태 수집**: result 파일 또는 TaskList에서 COMPLETED/FAILED 목록.
3. **Push + PR 생성** (레포별):

```bash
cd {project-dir}
git checkout zzem/{sprint-id}
git push -u origin zzem/{sprint-id}
```

```bash
gh pr create \
  --base {base-branch} \
  --head zzem/{sprint-id} \
  --title "feat: Sprint {sprint-id} — {repo-name}" \
  --body "$(cat <<'EOF'
## Sprint: {sprint-id}

### Summary
{PRD 스코프 요약}

### Branch Strategy
- **Base**: `{base-branch}`
- **Sprint Branch**: `zzem/{sprint-id}`
- **Merge Strategy**: task branches → sprint branch → PR

### Tasks
| Task | Status | Key Changes |
|------|--------|-------------|
| {task-id} | {status} | {변경 요약} |

### Merge History
{git log --oneline}

### QA Summary
- Total: {N} tasks
- Completed: {N}
- Failed: {N}

### Generated by
zzem-orchestrator Agentic Sprint System (Agent Teams)
EOF
)"
```

4. **중복 PR 확인**: 이미 동일 head/base PR이 있으면 기존 PR URL 안내.
5. **사용자 확인**: push + PR은 외부 영향 있는 작업이므로 반드시 사용자 동의 후 실행.

### Output
```
Sprint PR: {sprint-id}

  wrtn-backend:
    PR: {url}
    zzem/{sprint-id} → {base-branch}
    Changes: {N} commits, {N} files

  app-core-packages:
    PR: {url}
    zzem/{sprint-id} → {base-branch}
    Changes: {N} commits, {N} files

Sprint pipeline complete! 🎉
```

---

## --status Mode (Sprint Lead, anytime)

스프린트 상태를 대시보드로 출력한다. 읽기 전용.

### 정보 수집

1. **태스크 상태**: TaskList 또는 result 파일에서 COMPLETED/PARTIAL/FAILED/MISSING
2. **프로토타입 상태**: `approval-status.yaml`에서 approved/pending/rejected
3. **브랜치 상태**: 각 레포에서 sprint 브랜치 존재 + 커밋 수
4. **PR 상태**: `gh pr list`로 확인

### Dashboard Output

```
═══════════════════════════════════════════════════
  Sprint: {sprint-id}
  PRD: {prd-source}
  Config: backend → {base} | app → {base}
  Team: Sprint Lead + BE + FE + Design + QA
═══════════════════════════════════════════════════

  Progress: ████████░░░░ {N}/{M} tasks

  Task                              Backend        App
  ──────────────────────────────    ───────────    ───────────
  001-profile / publish / nickname  COMPLETED      COMPLETED
  002-follow / payback              RUNNING        COMPLETED
  003-block-report / notification   PENDING        PENDING
  004-persona / credit              PENDING        PENDING

  Prototypes:
    001-profile-screen       ProfileScreen           ✓ approved
    002-follow-ui            FollowerListScreen      ✓ approved
    003-block-report-ui      ReportScreen            ○ pending

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

### Next Step 추천 로직

| 상태 | 추천 |
|------|------|
| 태스크 파일만 있고 프로토타입 없음 | `/sprint {id} --phase=prototype` |
| 프로토타입 pending/rejected 있음 | `/sprint {id} --phase=prototype` (리뷰 진행) |
| 프로토타입 승인 완료, 실행 안 됨 | `/sprint {id} --phase=run` |
| 일부 태스크 실패 | 실패 태스크 재실행 안내 |
| 전체 완료, PR 없음 | `/sprint {id} --phase=pr` |
| PR 생성됨 | PR 리뷰 링크 안내 |

---

## Team Configuration Reference

### Teammate Files

| Teammate | 파일 | 역할 |
|----------|------|------|
| BE Engineer | `.claude/teammates/be-engineer.md` | Backend 태스크 구현 |
| FE Engineer | `.claude/teammates/fe-engineer.md` | App 태스크 구현 |
| Design Engineer | `.claude/teammates/design-engineer.md` | Stitch UI 프로토타입 |
| QA Engineer | `.claude/teammates/qa-engineer.md` | Acceptance Criteria 검증 |

### Task Naming Convention

| Phase | Subject 패턴 | Owner |
|-------|-------------|-------|
| Prototype | `proto/app/{task-id}/{ScreenName}` | Design Engineer |
| Implementation | `impl/backend/{task-id}` | BE Engineer |
| Implementation | `impl/app/{task-id}` | FE Engineer |
| QA Validation | `qa/{project}/{task-id}` | QA Engineer |

### Sprint Config Team Section

```yaml
team:
  teammates: [be-engineer, fe-engineer, design-engineer, qa-engineer]
  settings:
    task_timeout_minutes: 30
    qa_retry_limit: 2
    max_parallel_tasks: 4
```

---

## Constraints

- 단일 태스크 타임아웃: 30분
- QA 재시도: 최대 2회 (3회차 FAILED)
- 머지 충돌: 자동 해결 시도 없이 즉시 사용자 개입 요청
- `.worktrees/` 디렉토리는 `.gitignore`에 포함
- PR 생성/push 전 반드시 사용자 확인
- Teammate는 원격 push 및 브랜치 머지를 수행하지 않음 (Sprint Lead 전담)
