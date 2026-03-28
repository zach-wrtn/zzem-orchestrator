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
/sprint <sprint-id>                              # 전체 파이프라인 (Phase 1~6)
/sprint <sprint-id> --phase=init                 # Phase 1
/sprint <sprint-id> --phase=spec                 # Phase 2
/sprint <sprint-id> --phase=prototype            # Phase 3
/sprint <sprint-id> --phase=build                # Phase 4
/sprint <sprint-id> --phase=build --resume       # Phase 4 중간 재시작
/sprint <sprint-id> --phase=pr                   # Phase 5
/sprint <sprint-id> --phase=pr --allow-partial   # FAILED 그룹 제외 PR
/sprint <sprint-id> --phase=retro                # Phase 6 (Retrospective)
/sprint <sprint-id> --continue                   # 같은 스프린트 내 미충족 항목 이어서 진행
/sprint <sprint-id> --follow-up=<prev-sprint-id> # 이전 스프린트 기반 후속 스프린트
/sprint <sprint-id> --status                     # 상태 대시보드
/sprint                                          # 최근 스프린트 자동 감지
```

## Prerequisites

- Agent Teams 활성화: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Teammate 정의: `.claude/teammates/` (be-engineer, fe-engineer, design-engineer, evaluator)
- Figma MCP 서버 설정 (Design Engineer용)
- `--follow-up` 사용 시: 이전 스프린트의 `retrospective/` 디렉토리 필수

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

### Gate → Phase 2

다음 조건 **모두** 충족 시 Phase 2 진입:
- [ ] `sprints/{sprint-id}/` 디렉토리 구조 완전 (PRD.md, sprint-config.yaml, tasks/, contracts/, evaluations/, logs/)
- [ ] PRD.md에 원본 PRD 링크 + 스코프 요약 존재
- [ ] sprint-config.yaml에 base branch 설정 존재

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

### Gate → Phase 3

다음 조건 **모두** 충족 시 Phase 3 진입:
- [ ] `api-contract.yaml` 존재 + OpenAPI 3.0 유효성 통과
- [ ] 모든 태스크 파일에 필수 섹션 존재 (Target, Context, Objective, Specification, AC)
- [ ] 태스크 번호 간 순환 의존성 없음
- [ ] 각 AC가 testable (모호한 표현 — "적절한", "빠른" 등 — 금지)
- [ ] Backend 태스크와 App 태스크가 API contract의 동일 endpoint를 참조

**Phase 3 스킵 조건**: app 태스크가 0개이거나, 모든 app 태스크에 `### Screens / Components` 섹션이 없으면 Phase 3를 건너뛰고 Phase 4로 직행.

### Output
```
Sprint Spec: {sprint-id}
  API Contract: {N} endpoints
  Tasks: Backend {N} + App {N}
  Evaluation Criteria: defined

→ Proceeding to Phase 3: Prototype
→ Proceeding to Phase 4: Build (no UI tasks — skipping prototype)
```

---

## Phase 3: Prototype (Sprint Lead + Design Engineer)

App 태스크의 UI 프로토타입을 Figma에 직접 생성하고 리뷰한다.

### Auto-Skip 조건

다음 중 하나라도 해당하면 Phase 3를 자동 스킵하고 Phase 4로 직행:
- `tasks/app/` 디렉토리에 태스크 파일이 0개
- 모든 app 태스크에 `### Screens / Components` 섹션이 없음
- `sprint-config.yaml`에 `prototype: skip` 설정

스킵 시 출력:
```
Phase 3 skipped: no prototypable UI tasks found
→ Proceeding to Phase 4: Build
```

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

#### 3.4 Gate → Phase 4

다음 조건 확인:
- [ ] `approval-status.yaml` 존재
- [ ] 모든 대상 화면에 approve/reject/skip 판정 완료 (pending 0)
- [ ] rejected 화면의 태스크에서 `## Prototype Reference` 제거 확인

**Warning 진입**: pending 또는 rejected 존재 시 경고 출력. `--force`로 무시 가능.

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

### 파이프라인 병렬화 규칙

순차 실행이 기본이지만, 다음 조건에서 병렬화 허용:

| 상황 | 허용 범위 |
|------|----------|
| Group N 평가 중 (4.4) | Group N+1 계약 작성 (4.1) 선행 가능 |
| Group N PASS 확정 전 | Group N+1 구현 (4.2) 시작 **불가** |
| 같은 그룹 BE/FE | 항상 병렬 실행 |
| 다른 레포 머지 (4.3) | 독립이므로 병렬 가능 |

**핵심 제약**: 이전 그룹이 PASS 되기 전에 다음 그룹 구현을 시작하지 않는다. 이전 그룹의 fix가 다음 그룹 spec에 영향을 줄 수 있기 때문.

### 4.0 Sprint 브랜치 생성 (첫 그룹 시)

**관련 레포만 브랜치 생성**: backend 태스크만 있으면 wrtn-backend만, app 태스크만 있으면 app-core-packages만 생성.

```bash
# wrtn-backend (backend 태스크 존재 시)
cd wrtn-backend
git fetch origin {backend-base}
git checkout -b zzem/{sprint-id} origin/{backend-base}

# app-core-packages (app 태스크 존재 시)
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

**Contract 합의 프로토콜:**

1. **Evaluator 리뷰 결과 분류**:
   | 이의 유형 | 처리 |
   |----------|------|
   | **Ambiguity** (모호한 기준) | Sprint Lead가 기준을 구체화 (수치, 조건 명시) |
   | **Missing Edge Case** | Done Criteria에 추가 |
   | **Untestable Criterion** | 검증 방법 재설계 또는 기준 재작성 |
   | **Scope Dispute** (범위 이견) | 원본 태스크 AC와 대조 → 일치하면 유지, 불일치하면 수정 |

2. **합의 루프**:
   - Round 1: Evaluator 리뷰 → Sprint Lead 수정
   - Round 2: Evaluator 재리뷰 → 합의 또는 잔여 이의
   - Round 3 (최종): 합의 실패 시 사용자에게 잔여 이의 목록 제시 → 사용자 판단

3. **합의 완료 시**: 계약서에 `## Sign-off` 섹션 추가 (날짜 + "Evaluator approved")

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

#### Cross-Repo 의존성 처리

같은 그룹 내 BE/FE가 병렬 실행될 때 FE가 아직 없는 BE API에 의존하는 경우:

1. **API Contract가 SSOT**: FE Engineer는 `api-contract.yaml`의 request/response 스키마를 기준으로 구현.
2. **Mock/Stub 전략**: FE 태스크 spec에 다음을 포함:
   ```
   ## API Dependency
   - Endpoint: POST /api/v1/follows
   - Contract: api-contract.yaml#/paths/~1api~1v1~1follows/post
   - FE는 contract 기반으로 구현. 실제 BE 연동은 Evaluator가 머지 후 검증.
   ```
3. **Evaluator 통합 검증**: 그룹 머지 완료 후 Evaluator가 BE↔FE 실제 연동을 검증.
4. **Contract 불일치 발견 시**: Evaluator가 ISSUES로 보고 → Sprint Lead가 contract 수정 → 양쪽 fix 태스크.

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

### 4.6 에러 처리 및 복구 플레이북

| 상황 | Sprint Lead 처리 |
|------|-----------------|
| Engineer 구현 실패 | fix 태스크 재할당 (최대 2회) → FAILED |
| 머지 충돌 | 스프린트 중단, 충돌 상세 출력, 수동 해결 요청 |
| Evaluator ISSUES/FAIL | 원 Engineer에게 보고서 전달 → fix loop |
| Worktree 생성 실패 | 기존 worktree 정리 후 재시도 |

#### 복구 플레이북

**P1: Engineer 구현 반복 실패 (fix 2회 초과)**
```
1. 실패 원인 분류: spec 모호 vs 기술적 한계 vs 의존성 문제
2. spec 모호 → Sprint Lead가 태스크 spec 재작성 후 재할당
3. 기술적 한계 → 사용자에게 scope 축소 또는 대안 접근 제안
4. 의존성 문제 → 선행 그룹 결과 확인, 필요시 그룹 순서 재조정
5. 해당 태스크 FAILED 마킹, 다른 태스크는 계속 진행
```

**P2: 머지 충돌 발생**
```
1. 충돌 파일 목록 + diff 출력
2. 충돌 원인 분석: 같은 그룹 내 BE/FE 겹침 vs 이전 그룹 잔여 변경
3. 사용자에게 충돌 컨텍스트 + 해결 가이드 제공
4. 사용자 해결 후 → git merge --continue → 나머지 머지 재개
5. 해결 불가 시 → git merge --abort → 해당 태스크만 FAILED 처리
```

**P3: Evaluator 반복 FAIL (fix loop 2회 초과)**
```
1. 누적 이슈 목록 정리 (1차 → 2차 → 3차)
2. 반복되는 이슈 패턴 분석
3. 사용자에게 3가지 옵션 제시:
   a) scope 축소: 해당 AC를 다음 스프린트로 이월
   b) 수동 수정: 사용자가 직접 코드 수정
   c) 그룹 재구현: 태스크 spec 수정 후 처음부터 재시작
4. 선택에 따라 sprint-config.yaml에 deferred 항목 기록
```

**P4: Worktree/Branch 오염**
```
1. git worktree list로 전체 worktree 상태 확인
2. 잔여 worktree: git worktree remove --force {path}
3. 잔여 branch: git branch -D zzem/{sprint-id}/{task-id}
4. sprint 브랜치 무결성 확인: git log --oneline zzem/{sprint-id}
5. 재시도
```

**P5: Phase 중간 재시작 (`/sprint {id} --phase=build --resume`)**
```
1. contracts/ 디렉토리에서 마지막 합의된 그룹 번호 확인
2. evaluations/ 디렉토리에서 마지막 PASS 그룹 번호 확인
3. 다음 미완료 그룹부터 재개
4. 이미 머지된 태스크는 스킵, 미머지 태스크만 재디스패치
```

### Gate → Phase 5

다음 조건 **모두** 충족 시 Phase 5 진입:
- [ ] 모든 그룹이 ACCEPTED (Evaluator PASS)
- [ ] FAILED 그룹 0개 (FAILED 그룹 존재 시 사용자에게 skip 여부 확인)
- [ ] 모든 worktree 정리 완료 (잔여 worktree 없음)
- [ ] sprint 브랜치에 모든 머지 커밋 반영

**Partial PR 허용**: `--allow-partial` 플래그 시 ACCEPTED 그룹만으로 PR 생성. FAILED 그룹은 PR body에 명시.

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
→ Proceeding to Phase 6: Retrospective
```

---

## Phase 6: Retrospective (Sprint Lead solo)

PR 생성 후 스프린트의 성과를 분석하고, 후속 작업을 위한 구조화된 산출물을 생성한다.

### Auto-Trigger

Phase 5 완료 후 자동 실행. `--phase=retro`로 독립 실행도 가능.

### Workflow

#### 6.1 Gap Analysis (PRD AC 달성 여부)

PRD.md의 모든 Acceptance Criteria를 순회하며, Evaluator 보고서와 태스크 상태를 대조한다.

```
For each AC in PRD:
  1. 해당 AC를 구현한 태스크 식별 (tasks/*.md의 AC 매핑)
  2. 태스크 상태 확인: COMPLETED / FAILED
  3. COMPLETED인 경우: evaluations/group-{N}.md에서 관련 이슈 확인
  4. 판정: fulfilled / partially_fulfilled / unfulfilled
  5. root_cause 분류: spec_ambiguity / technical_limit / dependency / scope_creep
```

저장: `sprints/{sprint-id}/retrospective/gap-analysis.yaml`

```yaml
sprint_id: "{sprint-id}"
prd_source: "{prd-file}"
generated_at: "{ISO8601}"

coverage:
  total_ac: {N}
  fulfilled: {N}
  partially_fulfilled: {N}
  unfulfilled: {N}
  fulfillment_rate: "{fulfilled / total_ac}"

items:
  - ac_id: "AC-{N}"
    ac_text: "{원본 AC 텍스트}"
    task_id: "{구현 태스크}"
    group: "group-{N}"
    status: "{fulfilled | partially_fulfilled | unfulfilled}"
    reason: "{상세 사유}"
    evidence: "{evaluations/group-{N}.md#issue-{N} | null}"
    root_cause: "{spec_ambiguity | technical_limit | dependency | scope_creep | null}"
    recommendation: "{후속 조치 제안}"
    priority: "{critical | high | medium | low}"
```

#### 6.2 Pattern Digest (반복 실패 패턴)

모든 Evaluator 보고서를 교차 분석하여 시스템적 패턴을 추출한다.

```
1. evaluations/group-*.md 전체 읽기
2. 이슈를 카테고리별로 그룹화: correctness / completeness / edge_case / integration / code_quality
3. 2개 이상 그룹에서 반복되는 패턴 식별
4. 시스템적 개선 제안 도출
```

저장: `sprints/{sprint-id}/retrospective/pattern-digest.yaml`

```yaml
patterns:
  - pattern: "{반복 패턴 설명}"
    category: "{correctness | completeness | edge_case | integration | code_quality}"
    frequency: {N}
    groups: ["group-{N}", ...]
    severity: "{critical | major | minor}"
    systemic_fix: "{시스템 수준 개선 방안}"

metrics:
  total_groups: {N}
  first_pass_rate: {0.0~1.0}       # 첫 평가에서 PASS한 비율
  avg_fix_cycles: {N.N}            # 평균 fix loop 횟수
  critical_issues_found: {N}
  major_issues_found: {N}
  minor_issues_found: {N}
  issues_fixed: {N}
  issues_deferred: {N}
```

#### 6.3 Deferral Index (이월 항목)

gap-analysis에서 `unfulfilled` 또는 `partially_fulfilled`인 항목을 구조화한다.

저장: `sprints/{sprint-id}/retrospective/deferred-items.yaml`

```yaml
deferred:
  - ac_id: "AC-{N}"
    original_task: "{task file path}"
    group: "group-{N}"
    status: "{unfulfilled | partially_fulfilled}"
    reason: "{미충족 사유}"
    root_cause: "{spec_ambiguity | technical_limit | dependency | scope_creep}"
    prior_attempts: {N}
    evaluator_notes: "{evaluations reference}"
    suggested_approach: "{다음 시도에서의 접근 방법}"
    priority: "{critical | high | medium | low}"
    estimated_complexity: "{small | medium | large}"

improvements:
  - description: "{사용자 피드백 또는 추가 개선 사항}"
    source: "{user_feedback | pattern_digest | evaluator_suggestion}"
    priority: "{high | medium | low}"
```

#### 6.4 사용자에게 Next Action 제안

gap-analysis 결과에 따라 분기:

| 상태 | 제안 |
|------|------|
| fulfillment_rate = 1.0 | "모든 AC 충족. 스프린트 완료." |
| deferred 1~2건 (small) | "`--continue`로 같은 스프린트 내에서 이어서 진행 권장" |
| deferred 3건+ 또는 large | "`--follow-up`으로 후속 스프린트 생성 권장" |
| root_cause가 spec_ambiguity 다수 | "PRD/태스크 spec 재작성 후 후속 스프린트 권장" |
| systemic_fix 존재 | "시스템 개선 선행 후 후속 스프린트 권장" |

### Gate

Phase 6는 최종 단계이므로 별도 gate 없음. 산출물 생성 완료 시 종료.

### Output
```
Sprint Retrospective: {sprint-id}

  PRD Coverage: {fulfilled}/{total_ac} AC fulfilled ({fulfillment_rate}%)
    Fulfilled:           {N}
    Partially fulfilled: {N}
    Unfulfilled:         {N}

  Build Quality:
    First-pass rate:     {N}% ({N}/{M} groups PASS on first eval)
    Avg fix cycles:      {N.N}
    Issues found:        {N} (C:{N} M:{N} m:{N})

  Patterns detected:     {N} systemic patterns
  Deferred items:        {N} ({N} critical, {N} high)

  Retrospective saved: sprints/{sprint-id}/retrospective/

→ Recommendation: {context-aware next action}
```

---

## --continue Mode (같은 스프린트 이어서 진행)

이전에 완료된 스프린트에서 미충족 항목만 이어서 처리한다.

### Prerequisites

- `retrospective/` 디렉토리 존재 (Phase 6 완료 필수)
- `deferred-items.yaml`에 1건 이상 항목 존재
- sprint 브랜치가 유효한 상태

### Workflow

```
/sprint {sprint-id} --continue

1. retrospective/deferred-items.yaml 읽기
2. 이월 항목을 새 그룹으로 구성 (기존 마지막 그룹 번호 + 1부터)
3. 이월 항목의 원본 태스크 spec 읽기
4. Evaluator 피드백 + suggested_approach 반영하여 태스크 spec 갱신
5. Phase 4 (Build) 루프 재진입 — 새 그룹부터 시작
   ├─ 4.1 Contract (이전 실패 원인 + 보강된 검증 방법 포함)
   ├─ 4.2 Implement
   ├─ 4.3 Merge (기존 sprint 브랜치에 추가 머지)
   ├─ 4.4 Evaluate
   └─ 4.5 Fix/Accept
6. 완료 후: 기존 PR에 추가 커밋 push 또는 새 PR 생성 (사용자 선택)
7. Phase 6 재실행 (gap-analysis 갱신)
```

### Contract 보강

`--continue`의 Sprint Contract에는 이전 실패 컨텍스트를 포함한다:

```markdown
# Sprint Contract: Group {N} (Continuation)

## Prior Context
- Original group: group-{M}
- Prior attempts: {N}
- Root cause: {from deferred-items.yaml}
- Evaluator feedback: {핵심 피드백 요약}

## Revised Approach
- {suggested_approach from deferred-items.yaml}

## Done Criteria
- [ ] {보강된 기준 1}
- [ ] {보강된 기준 2}
- [ ] Regression: 이전 그룹 구현 사항 영향 없음

## Verification Method
- {이전 실패를 반복하지 않기 위한 구체적 검증 방법}
```

### Output
```
Sprint Continue: {sprint-id}
  Deferred items: {N}
  New groups: {N} (group-{M+1} ~ group-{M+K})

  Entering Phase 4: Build (continuation)
```

---

## --follow-up Mode (후속 스프린트)

이전 스프린트의 Retrospective 산출물을 기반으로 새 스프린트를 생성한다.

### Invocation

```
/sprint {new-sprint-id} --follow-up={prev-sprint-id}
```

### Prerequisites

- 이전 스프린트의 `retrospective/` 디렉토리 존재
- 이전 스프린트의 `deferred-items.yaml` 또는 사용자 추가 요구사항 존재

### Workflow

#### Phase 1: Init (확장)

기존 Init에 다음을 추가:

```
1. 이전 스프린트의 retrospective/ 읽기:
   - gap-analysis.yaml → 미충족 AC 목록
   - pattern-digest.yaml → 시스템 패턴 + 메트릭
   - deferred-items.yaml → 이월 항목
2. 이전 스프린트의 api-contract.yaml 복사 (기반으로 확장)
3. follow-up 메타데이터 기록
```

디렉토리에 추가:
```
sprints/{new-sprint-id}/
├── ... (기존 구조)
└── follow-up-context.yaml       # 이전 스프린트 연결 정보
```

```yaml
# follow-up-context.yaml
previous_sprint: "{prev-sprint-id}"
inherited_from:
  deferred_items: {N}
  api_contract: true
  patterns: {N}
previous_metrics:
  fulfillment_rate: {0.0~1.0}
  first_pass_rate: {0.0~1.0}
  avg_fix_cycles: {N.N}
```

#### Phase 2: Spec (확장)

기존 Spec에 다음을 추가:

1. **Delta PRD 생성**: 이전 PRD + 이월 항목 + 개선 사항을 통합한 PRD 생성.

```markdown
# Delta PRD: {new-sprint-id}

## 선행 스프린트
- Sprint: {prev-sprint-id}
- Coverage: {fulfilled}/{total_ac} AC fulfilled
- Gap Analysis: {prev-sprint}/retrospective/gap-analysis.yaml

## 이월 항목 (Deferred from {prev-sprint-id})
### AC-{N}: {AC 제목}
- 원인: {root_cause}
- 이전 접근: {prior attempts summary}
- 보강된 접근: {suggested_approach}
- 보강된 AC: {구체화된 acceptance criteria}

## 개선 항목 (Improvements)
{사용자에게 추가 요구사항 확인 — 없으면 이월 항목만으로 진행}

## Regression Guard
이전 스프린트에서 완료된 기능이 후속 작업에 의해 깨지지 않았는지 검증:
- [ ] AC-001 ~ AC-{M}: 이전 충족 항목 회귀 없음
```

2. **Evaluator 캘리브레이션 보강**: pattern-digest의 systemic_fix를 evaluation criteria에 반영.

```
evaluation/criteria.md에 추가:
## Calibration from {prev-sprint-id}
- Pattern: {반복 패턴} → 이 패턴에 대해 추가 주의
- Pattern: {반복 패턴} → {systemic_fix} 적용 여부 확인
```

3. **Regression AC 생성**: 이전 스프린트에서 fulfilled된 AC를 간소화한 regression 체크리스트 생성.

```yaml
# tasks/{project}/{task-id}.md의 AC 섹션에 추가
## Regression Guard
- [ ] {이전 AC-001}: {검증 방법 — 기존 기능 동작 확인}
- [ ] {이전 AC-002}: {검증 방법}
```

#### Phase 3~5: 기존과 동일

#### Phase 6: Retrospective (확장)

기존 Retrospective에 추가:
- 이전 스프린트 대비 개선 추이 기록
- 이월 항목 해소 여부 추적

```yaml
# gap-analysis.yaml에 추가
follow_up_tracking:
  previous_sprint: "{prev-sprint-id}"
  inherited_deferred: {N}
  resolved_in_this_sprint: {N}
  still_deferred: {N}
  trend:
    fulfillment_rate: "{prev} → {current}"
    first_pass_rate: "{prev} → {current}"
```

### Output
```
Sprint Follow-Up Init: {new-sprint-id}
  Based on: {prev-sprint-id}
  Inherited: {N} deferred items, {N} patterns
  API Contract: inherited + extended

→ Proceeding to Phase 2: Spec (Delta PRD)
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
8. **Retrospective 상태**: `retrospective/` 디렉토리 존재 여부 + gap-analysis 요약

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

  ─── Bottleneck Detection ────────────────────────────
  ⚠ FE Engineer ACTIVE for 15m+ on impl/app/002-ui (threshold: 10m)
  ⚠ Group 002 blocked: waiting for FE completion

═══════════════════════════════════════════════════════
  Next step: {context-aware suggestion}
═══════════════════════════════════════════════════════
```

### 병목 감지 규칙

| 조건 | 경고 |
|------|------|
| Agent ACTIVE 10분+ 경과 | `⚠ {Agent} ACTIVE for {N}m+ on {task}` |
| Agent BUILD FAIL 상태 | `🔴 {Agent} build failed on {task}` |
| Agent ERROR 상태 | `🔴 {Agent} error on {task}` |
| 그룹 내 한쪽만 완료, 다른 쪽 5분+ | `⚠ Group {N} blocked: waiting for {side}` |
| Fix loop 2회차 진입 | `⚠ Group {N} in fix loop round 2` |

### 진행률 계산

```
progress = (accepted_groups / total_groups) * 100
bar_filled = round(progress / 100 * 12)
```

### Next Step 로직

상태 기반 자동 추천:
- 모든 그룹 ACCEPTED → "Ready for Phase 5: PR"
- 현재 그룹 평가 중 → "Waiting for Evaluator on Group {N}"
- Fix loop 중 → "Fix loop round {R} for Group {N}"
- FAILED 그룹 존재 → "Group {N} FAILED — user decision required"
- 구현 진행 중 → "Engineers working on Group {N}"
- PR 생성 완료, retrospective 미실행 → "Ready for Phase 6: Retrospective"
- Retrospective 완료, deferred 존재 → "`--continue` or `--follow-up` recommended"
- Retrospective 완료, 전체 충족 → "Sprint complete. All AC fulfilled."

### 자동 모니터링 (`/loop` 연계)

빌드 중 실시간 모니터링:
```
/loop 3m /sprint {sprint-id} --status
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
- **이전 그룹 PASS 전 다음 그룹 구현(4.2) 시작 금지** (계약 선행 작업만 허용)
- Phase 전환 시 Gate 조건 미충족이면 진행 차단 (`--force`로 오버라이드 가능)
- Fix loop 최대 2회, 3회차 실패 시 FAILED + 사용자 개입
- Backend-only 스프린트 시 Phase 3 자동 스킵, app-core-packages 브랜치 미생성
- **`--continue`는 retrospective/ 완료 후에만 사용 가능**
- **`--follow-up`은 이전 스프린트의 retrospective/ 존재 필수**
- **Regression Guard**: follow-up 스프린트에서 이전 충족 AC의 회귀 검증 필수
