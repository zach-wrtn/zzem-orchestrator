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
8. **Context Checkpoint**: Phase/Group 전환 시 구조화된 요약을 파일로 보존. 자동 압축에 의존하지 않는다.
9. **Objective Verification via E2E**: Evaluator의 주관적 active evaluation을 Maestro e2e의 객관적 AC 증명으로 보강. Phase 2에서 AC↔flow 매핑, Phase 4에서 그룹 스모크 게이트, Phase 5에서 풀스위트 회귀 게이트.

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
/sprint <sprint-id> --phase=qa-fix --jql="..."   # Phase QA-Fix on existing sprint (per-sprint path)
/sprint <sprint-id> --phase=qa-fix --dry-run     # QA-Fix dry-run (no Jira writes)
/sprint <new-id> --type=qa-fix --jql="..."       # New integration QA-Fix sprint (Path B)
/sprint <sprint-id> --continue                   # 같은 스프린트 내 미충족 항목 이어서 진행
/sprint <sprint-id> --follow-up=<prev-sprint-id> # 이전 스프린트 기반 후속 스프린트
/sprint <sprint-id> --status                     # 상태 대시보드
/sprint                                          # 최근 스프린트 자동 감지
```

## Prerequisites

- Agent Teams 활성화: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Teammate 정의: `.claude/teammates/` (be-engineer, fe-engineer, design-engineer, evaluator)
- HTML 프로토타입 템플릿 (Design Engineer용)
- `--follow-up` 사용 시: 이전 스프린트의 `retrospective/` 디렉토리 필수

---

## Context Window Management

> 장시간 스프린트에서 context 품질을 유지하기 위한 필수 프로토콜.

### Checkpoint 시스템

각 Phase/Group 완료 시 `checkpoints/` 디렉토리에 구조화된 요약을 저장한다. 이후 Phase에서는 **원본 대신 checkpoint를 참조**한다.

```
sprints/{sprint-id}/checkpoints/
├── phase-2-summary.md      # Spec 결과: 태스크 목록, endpoint 목록, 핵심 결정
├── phase-3-summary.md      # Prototype 결과: 승인 현황, revision 요약, amendment
├── group-001-summary.md    # Build 결과: 판정, 이슈, 교훈
├── group-002-summary.md
└── group-003-summary.md
```

**규칙**:
1. **Phase 전환 시**: 해당 phase의 checkpoint 생성 후 다음 phase 진행
2. **Group 전환 시**: 해당 group의 checkpoint 생성 후 다음 group 진행
3. **참조 우선순위**: checkpoint → 태스크 파일 → 원본 (필요 시에만)
4. **예외**: Fix loop에서 이전 이슈를 정확히 재현해야 할 때만 원본 evaluation report Read 허용

### Progressive File Reading

파일을 읽을 때 전체가 아닌 필요한 부분만 읽는다:
- **api-contract.yaml**: 현재 그룹의 관련 endpoint만 (`offset`/`limit` 활용)
- **태스크 파일**: AC 섹션 중심으로 읽기
- **Evaluation 보고서**: verdict + 이슈 목록 섹션만
- **이전 그룹 정보**: `checkpoints/group-{N}-summary.md`만 참조

### Budget Pressure Injection

> Ref: Hermes Agent IterationBudget — 컨텍스트 소진 전 동적 스티어링.

장기 Build Loop에서 컨텍스트 윈도우 품질을 유지하기 위해,
Sprint Lead는 각 그룹의 진행 상황을 모니터링하고 pressure 레벨에 따라 행동을 조정한다.

**Pressure 레벨 판단**:

| 레벨 | 조건 | Sprint Lead 행동 |
|------|------|-----------------|
| 🟢 Normal | 현재 그룹 내 fix loop 0회 | 정상 진행 |
| 🟡 Caution | fix loop 1회차 진입 또는 Engineer 태스크 2회 이상 재할당 | Checkpoint 즉시 생성 + 이전 그룹 상세 컨텍스트 drop |
| 🔴 Urgent | fix loop 2회차 또는 그룹 내 총 이슈 5건+ | scope 축소 제안 + 사용자 개입 요청 준비 |

**Pressure 주입 방식**:

Sprint Lead가 Engineer/Evaluator에게 태스크를 할당할 때,
현재 pressure 레벨에 따라 태스크 Description에 컨텍스트 힌트를 추가한다:

- 🟡 Caution: `⚠ Context Pressure: Caution — 핵심 AC에 집중. 부가 개선 금지.`
- 🔴 Urgent: `🔴 Context Pressure: Urgent — 최소 기능만 구현. scope 축소 가능성 있음.`

이 힌트는 Engineer/Evaluator의 동작에 직접 영향을 준다:
- Engineer: Caution에서 불필요한 리팩토링/추가 기능 금지. Urgent에서 AC 충족 최소 구현만.
- Evaluator: Caution에서 Minor 이슈 보고 생략. Urgent에서 Critical만 보고.

### Frozen Snapshot Protocol

> Ref: Hermes Agent — 세션 시작 시 시스템 프롬프트를 1회 로드 후 고정. Anthropic prompt caching 최적화.

**원칙**: Teammate가 스폰될 때 참조하는 디자인 시스템, 패턴 라이브러리, KB 데이터를
**1회만 로드하고 세션 내에서 재로드하지 않는다**.

**Snapshot 대상** (Teammate 스폰 시 1회 로드):

| 대상 | 파일 | 소비자 |
|------|------|--------|
| Design System (DESIGN.md) | `docs/designs/DESIGN.md` (존재 시) | Design Engineer |
| Foundations + Components | `docs/designs/foundations/*.mdx` + `docs/designs/components/*.mdx` (Zod frontmatter SSOT) | Design Engineer |
| Component Patterns Index | `docs/designs/README.md` | Design Engineer |
| Design KB | `zzem-kb:read type=pattern category=design_proto` (+ `design_spec`) 결과 | Design Engineer |
| Code KB | `zzem-kb:read type=pattern category=<관련>` 결과 | Evaluator, Engineers |
| API Contract (그룹 범위) | `contracts/api-contract.yaml` (현재 그룹 endpoints) | Engineers, Evaluator |

**적용 방식**:

Sprint Lead가 Teammate에게 TaskCreate 시, Description에 snapshot context를 **인라인으로 포함**한다.
Teammate는 별도로 이 파일들을 Read하지 않는다.

```
TaskCreate:
  Subject: proto/app/{task-id}/{ScreenName}
  Description: |
    --- FROZEN SNAPSHOT ---
    {DESIGN.md 핵심 섹션 발췌 — 존재 시}
    {foundations/*.mdx + components/*.mdx 관련 frontmatter}
    {KB design 패턴 중 관련 항목}
    --- END SNAPSHOT ---

    태스크 상세: {task-id} 참조
    Screen Spec 템플릿: sprint-orchestrator/templates/screen-spec-template.md
```

**금지 사항**:
- Teammate가 snapshot 대상 파일을 직접 Read하는 것 (Sprint Lead가 이미 제공)
- Sprint Lead가 같은 세션 내에서 snapshot을 재구성하는 것 (한 번만)
- 단, `tokens.css`와 `context-engine.yaml`은 Design Engineer가 직접 생성하므로 예외

**비용 효과**: 4-agent × 다회 호출 구조에서 시스템 프롬프트 + 참조 파일의 반복 로드를 제거.

---

## Phase Routing

**현재 Phase를 판단하고, 해당 phase 파일을 Read하여 상세 워크플로우를 실행한다.**

| Phase | 파일 | 트리거 |
|-------|------|--------|
| Phase 1: Init | `phase-init.md` | `--phase=init` 또는 스프린트 디렉토리 미존재 |
| Phase 2: Spec | `phase-spec.md` | `--phase=spec` 또는 Phase 1 Gate 통과 (type=standard만) |
| Phase 3: Prototype | `phase-prototype.md` | `--phase=prototype` 또는 Phase 2 Gate 통과 |
| Phase 4: Build | `phase-build.md` | `--phase=build` 또는 Phase 3 Gate 통과 |
| Phase 5: PR | `phase-pr.md` | `--phase=pr` 또는 Phase 4 Gate 통과 |
| Phase 6: Retro | `phase-retro.md` | `--phase=retro` 또는 Phase 5 완료 |
| Phase QA-Fix | `phase-qa-fix.md` | `--phase=qa-fix` (per-sprint) 또는 type=qa-fix sprint의 Phase 1 Gate 통과 (integration) |
| Modes | `phase-modes.md` | `--continue`, `--follow-up`, `--status` |

**실행 방법**: 현재 phase를 판단한 후, 해당 파일을 **이 skill 디렉토리에서 Read**하여 상세 워크플로우를 따른다.

```
Phase 파일 경로: .claude/skills/sprint/{phase-file}
```

> **중요**: 현재 phase에 해당하지 않는 phase 파일은 Read하지 않는다. 이는 context window 효율을 위한 의도적 설계다.

### Phase 판단 로직

1. `--phase=X` 명시 → 해당 phase 직행
2. `--type=qa-fix` 명시 (신규 sprint) → Phase 1 Init (qa-fix 분기) → Phase QA-Fix
3. `--continue` → `phase-modes.md` Read
4. `--follow-up` → `phase-modes.md` Read
5. `--status` → `phase-modes.md` Read
6. 인자 없음 → 스프린트 디렉토리 상태에서 자동 판단:
   - 디렉토리 미존재 → Phase 1
   - `sprint-config.yaml`의 `type: qa-fix` → Phase QA-Fix
   - `api-contract.yaml` 미존재 → Phase 2
   - `approval-status.yaml` 미존재 + app 태스크 존재 → Phase 3
   - `evaluations/` 비어있음 → Phase 4
   - PR 미생성 → Phase 5
   - `retrospective/` 미존재 → Phase 6
   - 모두 존재 → `--status` 모드

**`--phase=qa-fix` (per-sprint)**: 기존 sprint dir이 type=standard여도 OK. 그 sprint dir에 `qa-fix/` 서브디렉토리를 추가 생성하여 작업한다.

---

## Team Configuration

### Teammate Files

| Teammate | 파일 | 역할 |
|----------|------|------|
| BE Engineer | `.claude/teammates/be-engineer.md` | Backend Generator |
| FE Engineer | `.claude/teammates/fe-engineer.md` | Frontend Generator |
| Design Engineer | `.claude/teammates/design-engineer.md` | HTML 프로토타입 |
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
- Backend-only 스프린트 시 Phase 3 자동 스킵, app role의 sprint 브랜치 미생성
- **`--continue`는 retrospective/ 완료 후에만 사용 가능**
- **`--follow-up`은 이전 스프린트의 retrospective/ 존재 필수**
- **Regression Guard**: follow-up 스프린트에서 이전 충족 AC의 회귀 검증 필수
- **Checkpoint 필수**: Phase/Group 전환 시 checkpoint 미생성이면 진행 차단
