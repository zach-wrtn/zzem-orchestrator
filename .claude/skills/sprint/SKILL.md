---
name: sprint
description: Harness-driven sprint orchestration with Planner-Generator-Evaluator pattern. Use when the user wants to run a sprint pipeline, or says /sprint.
---

# Sprint — Harness-Driven Orchestration

## Design Principles

> Ref: "Harness Design for Long-Running Agentic Applications" (Anthropic Engineering)

1. **Planner-Generator-Evaluator 분리**: 생성과 평가를 분리. Self-evaluation은 신뢰할 수 없다.
2. **Sprint Contract**: 구현 전 Generator와 Evaluator가 "done" 기준에 합의.
3. **Feature-by-Feature Iteration**: 기능 그룹 단위 반복 루프.
4. **Active Evaluation**: 정적 검사가 아닌, 코드 로직 추적 및 엣지 케이스 탐색.
5. **Deliverable-Focused Spec**: 결과물 중심 명세. 구현 세부사항 사전 지정 금지.
6. **File-Based Handoff**: 에이전트 간 상태 전달은 구조화된 파일 아티팩트로.
7. **Minimal Harness**: 모델이 자체 처리 가능한 부분은 scaffolding 제거.

## Goal

Sprint Lead로서 Planner-Generator-Evaluator 패턴으로 스프린트를 오케스트레이션한다.
- **Planner**: Sprint Lead가 Phase 2에서 deliverable-focused spec 생성
- **Generator**: BE/FE Engineer가 기능 구현
- **Evaluator**: 독립 Evaluator가 active evaluation 수행

## Invocation

```
/sprint <sprint-id>                    # 전체 파이프라인 (Phase 1~5)
/sprint <sprint-id> --phase=init       # Phase 1
/sprint <sprint-id> --phase=spec       # Phase 2
/sprint <sprint-id> --phase=prototype  # Phase 3
/sprint <sprint-id> --phase=build      # Phase 4
/sprint <sprint-id> --phase=pr         # Phase 5
/sprint <sprint-id> --status           # 상태 대시보드
/sprint                                # 최근 스프린트 자동 감지
```

## Prerequisites

- Agent Teams 활성화: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Teammate 정의: `.claude/teammates/` (be-engineer, fe-engineer, design-engineer, evaluator)
- Figma MCP 서버 설정 (Design Engineer용)

---

## Phase 1: Init (Sprint Lead solo)

스프린트 디렉토리를 초기화한다.

### Workflow

1. **인자 수집**: `sprint-id`와 `prd-file` 경로. 없으면 사용자에게 질문.
2. **PRD 존재 확인**: `docs/prds/{prd-file}` 확인.
3. **디렉토리 생성**:
   ```
   sprint-orchestrator/sprints/{sprint-id}/
   ├── PRD.md
   ├── sprint-config.yaml
   ├── tasks/
   │   ├── app/.gitkeep
   │   └── backend/.gitkeep
   ├── contracts/.gitkeep
   ├── evaluations/.gitkeep
   ├── prototypes/app/.gitkeep
   └── logs/.gitkeep
   ```
4. **PRD.md**: 원본 링크 + 스코프 요약 자동 생성.
5. **sprint-config.yaml**: 사용자에게 base branch 질문 후 생성.

### Output
```
Sprint initialized: {sprint-id}
  Directory: sprint-orchestrator/sprints/{sprint-id}/
  PRD: {prd-file}
  Base branches: backend → {base}, app → {base}

→ Proceeding to Phase 2: Spec
```

---

## Phase 2: Spec (Sprint Lead as Planner)

PRD를 **deliverable-focused** 명세로 확장한다.

### Planner 원칙

- **What, not How**: 각 기능이 달성해야 할 결과를 명세. 구현 방법은 Generator가 결정.
- **Testable Criteria**: 모든 AC는 코드로 검증 가능한 형태로 작성.
- **Over-specification 회피**: 구현 세부사항 사전 지정은 오류 cascade 유발.

### Workflow

1. **PRD 분석**: User Story + AC 추출, 비즈니스 목표 파악.
2. **코드베이스 패턴 파악**:
   - Backend: `wrtn-backend/apps/meme-api/src/`
   - App: `app-core-packages/apps/MemeApp/src/`
3. **API Contract 생성**: `api-contract.yaml` (OpenAPI 3.0) — SSOT.
4. **태스크 분해**: `tasks/backend/*.md`, `tasks/app/*.md`
   - 필수 섹션: Target, Context, Objective, Specification, Acceptance Criteria
   - Implementation Hints는 **기존 패턴 참조만** 포함. 구체적 구현 지시 금지.
   - 번호 규칙: 동일 번호 = 병렬, 낮은 번호 = 선행
5. **Evaluation Criteria**: `evaluation/criteria.md` 생성.
   - 그룹별 평가 기준 + Evaluator 캘리브레이션 가이드
6. **자체 검증**: OpenAPI 유효성, AC testability, 순환 의존성 없음.

### Output
```
Sprint Spec: {sprint-id}
  API Contract: {N} endpoints
  Tasks: Backend {N} + App {N}
  Evaluation Criteria: defined

→ Proceeding to Phase 3: Prototype
```

---

## Phase 3: Prototype (Sprint Lead + Design Engineer)

App 태스크의 UI 프로토타입을 Figma에 직접 생성하고 리뷰한다.

### Workflow

#### 3.1 태스크 필터

app 태스크 중 `### Screens / Components` 섹션이 있는 태스크만 대상.

#### 3.2 Design Engineer 스폰

각 대상 태스크에 대해:
```
TaskCreate:
  Subject: proto/app/{task-id}/{ScreenName}
  Description: <태스크 파일 + figma-prompt-template.md 참조>
  Owner: Design Engineer
```

Design Engineer가 Figma MCP (`use_figma`)로 프로토타입 생성 후 `TaskUpdate: completed`.

#### 3.3 리뷰 (Sprint Lead ↔ 사용자)

각 프로토타입을 사용자에게 순차 리뷰:

| 선택 | 동작 |
|------|------|
| **approve** | `approval-status.yaml` 업데이트, 태스크에 `## Prototype Reference` 추가 |
| **reject** | 상태 기록, 프로토타입 참조 제외 |
| **revise** | 피드백 → Design Engineer 수정 태스크 할당 |
| **skip** | pending 유지, 다음 화면 |

#### 3.4 Gate

Phase 4 진입 전 `approval-status.yaml` 확인. pending/rejected 있으면 경고. `--force`로 무시 가능.

### Output
```
Sprint Prototype: {sprint-id}
  Generated: {N} screens (Figma)
  Approved: {N}, Pending: {N}, Rejected: {N}

→ Proceeding to Phase 4: Build
```

---

## Phase 4: Build (Sprint Lead + BE + FE + Evaluator — Iterative Loop)

**핵심**: 전체 태스크 일괄 디스패치가 아닌, 기능 그룹 단위 반복 루프.

```
For each feature group (001, 002, 003, ...):
  4.1 Contract  → Sprint Lead drafts, Evaluator reviews
  4.2 Implement → Engineers build in worktrees
  4.3 Merge     → Sprint Lead merges to sprint branch
  4.4 Evaluate  → Evaluator actively assesses
  4.5 Fix/Accept → Fix loop or proceed to next group
```

### 4.0 Sprint 브랜치 생성 (첫 그룹 시)

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

Base branch 우선순위: `sprint-config.yaml` → `defaults.base` → `"main"`

### 4.1 Sprint Contract (per group)

Sprint Lead가 해당 그룹의 계약서를 구성한다:

```markdown
# Sprint Contract: Group {N}

## Scope
- Tasks: {task-ids}
- Endpoints: {related API endpoints}

## Done Criteria
- [ ] {testable criterion 1}
- [ ] {testable criterion 2}
- ...

## Verification Method
- {Evaluator가 각 criterion을 어떻게 검증할지}
- {테스트할 엣지 케이스}
- {검증할 비즈니스 규칙}
```

저장: `sprints/{sprint-id}/contracts/group-{N}.md`

Evaluator에게 계약서 리뷰 요청:

```
TaskCreate:
  Subject: contract-review/group-{N}
  Description: <계약서 경로 + 원본 태스크 파일 참조>
  Owner: Evaluator
```

**Contract 합의 루프:**
- Evaluator가 "Contract approved" → 구현 시작
- Evaluator가 이의 제기 (모호한 기준, 누락된 edge case 등) → Sprint Lead가 계약서 수정 → Evaluator 재리뷰
- 최대 2회 반복 후 합의 안 되면 사용자에게 판단 요청

### 4.2 Implement (Engineers)

해당 그룹의 태스크만 디스패치:

```
For each task in current group:
  TaskCreate:
    Subject: impl/{project}/{task-id}
    Description: <태스크 파일 + API contract + Sprint Contract 참조>
    Owner: {BE/FE} Engineer
```

BE/FE Engineer가 worktree에서 구현 후 완료 보고.
**같은 그룹의 BE/FE 태스크는 병렬 실행.**

### 4.3 Merge (Sprint Lead)

completed 태스크를 순차 머지:

```
1. git checkout zzem/{sprint-id}
2. git merge zzem/{sprint-id}/{task-id} --no-ff -m "merge: {task-id}"
3. 충돌 시: 스프린트 중단, 사용자 개입 요청
4. 성공 시: worktree 정리 (git worktree remove + branch delete)
```

같은 레포 내: 번호 오름차순 순차 머지.
다른 레포: 독립이므로 병렬 머지 가능.

### 4.4 Evaluate (Evaluator)

그룹의 모든 태스크 머지 완료 후, Evaluator에게 평가 할당:

```
TaskCreate:
  Subject: eval/{project}/group-{N}
  Description: <Sprint Contract + 머지된 코드 경로 + evaluation criteria>
  Owner: Evaluator
```

Evaluator는 **Active Evaluation** 수행:
- Sprint Contract의 Done Criteria를 코드에서 하나씩 증명
- Logic tracing으로 실행 흐름 추적
- Edge case를 능동적으로 탐색
- Skepticism: "버그가 있다고 가정하고 찾아라"

평가 보고서: `sprints/{sprint-id}/evaluations/group-{N}.md`

판정:
| 판정 | 조건 | 다음 단계 |
|------|------|----------|
| **PASS** | Critical/Major 이슈 0개 | 다음 그룹으로 진행 |
| **ISSUES** | Critical 0, Major 1+ | 4.5 Fix Loop |
| **FAIL** | Critical 1+, 또는 Major 3+ | 4.5 Fix Loop (또는 재구현) |

### 4.5 Fix Loop

ISSUES 또는 FAIL 시:
1. Evaluator 보고서를 원 Engineer에게 전달
2. Engineer가 이슈별 수정 후 완료 보고
3. Sprint Lead 머지
4. Evaluator 재평가
5. **최대 2회 반복**, 3회차 실패 시 FAILED 처리 + 사용자 개입 요청

### 4.6 에러 처리

| 상황 | Sprint Lead 처리 |
|------|-----------------|
| Engineer 구현 실패 | fix 태스크 재할당 (최대 2회) → FAILED |
| 머지 충돌 | 스프린트 중단, 충돌 상세 출력, 수동 해결 요청 |
| Evaluator ISSUES/FAIL | 원 Engineer에게 보고서 전달 → fix loop |
| Worktree 생성 실패 | 기존 worktree 정리 후 재시도 |

### Output
```
Sprint Build: {sprint-id}

  [Group 001] ACCEPTED
    impl/backend/001-profile-api        merged → eval PASS
    impl/app/001-profile-screen         merged → eval PASS

  [Group 002] EVALUATING
    impl/backend/002-follow-api         merged
    impl/app/002-follow-ui              merged
    eval: pending...

  Results: 1/3 groups accepted, 1/3 evaluating

→ Proceeding to Phase 5: PR (all groups accepted)
```

---

## Phase 5: PR (Sprint Lead solo)

Sprint 브랜치에서 base branch로 PR을 생성한다.

### Workflow

1. **사전 확인**: 각 레포 sprint 브랜치 변경사항 확인.
2. **태스크 상태 수집**: COMPLETED/FAILED 목록.
3. **Push + PR 생성** (레포별, **사용자 확인 필수**):

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

### Tasks
| Task | Status | Evaluation |
|------|--------|------------|
| {task-id} | {status} | {eval result} |

### Evaluation Summary
- Groups: {N} total, {N} accepted, {N} failed
- Issues found & fixed: {N}

### Generated by
zzem-orchestrator Harness-Driven Sprint System v4
EOF
)"
```

4. **중복 PR 확인**: 동일 head/base PR → 기존 PR URL 안내.

### Output
```
Sprint PR: {sprint-id}
  wrtn-backend:       {url} (zzem/{sprint-id} → {base})
  app-core-packages:  {url} (zzem/{sprint-id} → {base})

Sprint pipeline complete!
```

---

## --status Mode (anytime, read-only)

### 정보 수집

1. **태스크 상태**: TaskList 또는 result 파일
2. **프로토타입 상태**: `approval-status.yaml`
3. **Sprint Contract 상태**: `contracts/` 디렉토리
4. **평가 상태**: `evaluations/` 디렉토리
5. **브랜치 상태**: sprint 브랜치 커밋 수
6. **PR 상태**: `gh pr list`
7. **Agent Activity**: `logs/*.jsonl` — 각 에이전트 JSONL 파일의 마지막 줄 파싱

### Log Parsing

`sprint-orchestrator/sprints/{sprint-id}/logs/` 디렉토리의 JSONL 파일을 파싱한다:

1. 각 에이전트 파일(`be-engineer.jsonl`, `fe-engineer.jsonl`, `design-engineer.jsonl`, `evaluator.jsonl`)의 **마지막 줄**을 읽는다.
2. JSON 파싱하여 `task`, `phase`, `message`, `ts` 추출.
3. `ts`로부터 경과 시간 계산.
4. `phase` → Display Status 매핑:

| phase | Display |
|-------|---------|
| `started`, `context_loaded` | LOADING |
| `worktree_created`, `implementing`, `figma_generating`, `evaluating`, `fixing` | ACTIVE |
| `build_check` | BUILDING |
| `build_failed` | BUILD FAIL |
| `figma_complete` | SAVING |
| `completed` | IDLE (마지막 로그가 completed이면 현재 대기 중) |
| `error` | ERROR |

5. 로그 파일이 없거나 비어있으면 **IDLE** 표시 (아직 활성화되지 않은 에이전트).

### Dashboard Output

```
═══════════════════════════════════════════════════════
  Sprint: {sprint-id}
  PRD: {prd-source}
  Architecture: Planner-Generator-Evaluator
═══════════════════════════════════════════════════════

  Build Progress: ████████░░░░ Group {N}/{M}

  Group   Contract   Backend         App             Evaluation
  ─────   ────────   ────────────    ────────────    ──────────
  001     agreed     COMPLETED       COMPLETED       PASS
  002     agreed     COMPLETED       RUNNING         pending
  003     draft      pending         pending         —

  ─── Agent Activity ───────────────────────────────────
  Agent              Task                    Phase        Elapsed   Detail
  ────────────────   ─────────────────────   ──────────   ───────   ──────────────────────
  BE Engineer        impl/backend/002-api    BUILDING     2m ago    tsc --noEmit
  FE Engineer        impl/app/002-ui         ACTIVE       5m ago    FollowerList 컴포넌트 생성
  Design Engineer    —                       IDLE         —         —
  Evaluator          —                       IDLE         —         —

  Prototypes:
    001-profile-screen    ProfileScreen     approved
    002-follow-ui         FollowerListScreen approved

  PRs:
    wrtn-backend:       not created
    app-core-packages:  not created

═══════════════════════════════════════════════════════
  Next step: {context-aware suggestion}
═══════════════════════════════════════════════════════
```

---

## Team Configuration

### Teammate Files

| Teammate | 파일 | 역할 |
|----------|------|------|
| BE Engineer | `.claude/teammates/be-engineer.md` | Backend Generator |
| FE Engineer | `.claude/teammates/fe-engineer.md` | Frontend Generator |
| Design Engineer | `.claude/teammates/design-engineer.md` | Figma 프로토타입 |
| Evaluator | `.claude/teammates/evaluator.md` | Active Evaluation |

### Task Naming Convention

| Phase | Subject 패턴 | Owner |
|-------|-------------|-------|
| Prototype | `proto/app/{task-id}/{ScreenName}` | Design Engineer |
| Implementation | `impl/backend/{task-id}` | BE Engineer |
| Implementation | `impl/app/{task-id}` | FE Engineer |
| Evaluation | `eval/{project}/group-{N}` | Evaluator |

## Constraints

- 머지 충돌: 자동 해결 없이 즉시 사용자 개입 요청
- `.worktrees/` 디렉토리는 `.gitignore`에 포함
- PR 생성/push 전 반드시 사용자 확인
- Teammate는 원격 push 및 브랜치 머지 금지 (Sprint Lead 전담)
- **Evaluator 피드백 없이 그룹을 accept하지 않는다**
