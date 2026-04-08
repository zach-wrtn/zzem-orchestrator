# ZZEM Orchestrator — Architecture

## Design Philosophy

> Ref: "Harness Design for Long-Running Agentic Applications" (Anthropic Engineering)

이 시스템은 Claude Code Agent Teams를 활용한 **Planner-Generator-Evaluator** 패턴 기반 스프린트 오케스트레이션 시스템이다.

### 8 Core Principles

1. **Planner-Generator-Evaluator 분리**: 생성과 평가를 분리. Self-evaluation은 신뢰할 수 없다.
2. **Sprint Contract**: 구현 전 Generator와 Evaluator가 "done" 기준에 합의.
3. **Feature-by-Feature Iteration**: 기능 그룹 단위 반복 루프.
4. **Active Evaluation**: 정적 검사가 아닌, 코드 로직 추적 및 엣지 케이스 탐색.
5. **Deliverable-Focused Spec**: 결과물 중심 명세. 구현 세부사항 사전 지정 금지 (What, not How).
6. **File-Based Handoff**: 에이전트 간 상태 전달은 구조화된 파일 아티팩트로.
7. **Minimal Harness**: 모델이 자체 처리 가능한 부분은 scaffolding 제거.
8. **Context Checkpoint**: Phase/Group 전환 시 구조화된 요약을 파일로 보존.

---

## Sprint Pipeline

```
Phase 1: Init       Sprint Lead가 디렉토리 구조 초기화
    ↓
Phase 2: Spec       Sprint Lead(Planner)가 PRD → 태스크 + API Contract 분해
    ↓
Phase 3: Prototype   Design Engineer가 화면별 HTML 프로토타입 생성, 사용자 리뷰
    ↓                PRD Amendment + Refined PRD 역추출
Phase 4: Build       기능 그룹 단위 반복 루프 ─┐
    │                  4.1 Contract (합의)      │
    │                  4.2 Implement (병렬)     │ × N groups
    │                  4.3 Merge               │
    │                  4.4 Evaluate            │
    │                  4.5 Fix Loop (최대 2회)  ─┘
    ↓
Phase 5: PR          Sprint 브랜치 → base branch PR 생성
    ↓
Phase 6: Retro       Gap Analysis + Pattern Digest + Deferred Index → REPORT.md
```

### Phase Gates

각 Phase 전환 시 Gate 조건을 검증한다. 미충족 시 진행 차단 (`--force`로 오버라이드 가능).

| Gate | 핵심 조건 |
|------|----------|
| Init → Spec | 디렉토리 구조 완전, PRD.md 존재, base branch 설정 |
| Spec → Prototype | API Contract 유효, 태스크 필수 섹션 존재, AC testable |
| Prototype → Build | 모든 화면 판정 완료 (pending 0), amendment 판정 완료 |
| Build → PR | 모든 그룹 PASS, worktree 정리 완료, checkpoint 생성 완료 |

---

## Agent Team (Harness Design v4)

```
                    ┌──────────────────┐
                    │   Sprint Lead    │  Planner + Orchestrator
                    │   (Main Agent)   │  Phase 관리, 태스크 디스패치
                    └───────┬──────────┘
                            │
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
    ┌───────────────┐ ┌──────────────┐ ┌─────────────┐
    │  BE Engineer  │ │ FE Engineer  │ │   Design    │  Generators
    │  (Teammate)   │ │ (Teammate)   │ │  Engineer   │
    │               │ │              │ │ (Teammate)  │
    │  wrtn-backend │ │ MemeApp      │ │ HTML Proto  │
    │  worktree     │ │ worktree     │ │             │
    └───────────────┘ └──────────────┘ └─────────────┘
            │               │
            └───────┬───────┘
                    ↓
            ┌───────────────┐
            │   Evaluator   │  독립 평가자
            │  (Teammate)   │  코드 수정 불가 (Read-only)
            │               │  Logic Tracing + Edge Case
            └───────────────┘
```

### Teammate 파일

| Agent | 파일 | 역할 |
|-------|------|------|
| BE Engineer | `.claude/teammates/be-engineer.md` | wrtn-backend meme-api 구현 |
| FE Engineer | `.claude/teammates/fe-engineer.md` | app-core-packages MemeApp 구현 |
| Design Engineer | `.claude/teammates/design-engineer.md` | Context Engine → Screen Spec → HTML Prototype |
| Evaluator | `.claude/teammates/evaluator.md` | Active Evaluation (Logic Tracing, Edge Case Probing) |

### Task Subject 네이밍

| Phase | Subject 패턴 | Owner |
|-------|-------------|-------|
| Prototype | `proto/app/{task-id}/{ScreenName}` | Design Engineer |
| Implementation | `impl/backend/{task-id}` | BE Engineer |
| Implementation | `impl/app/{task-id}` | FE Engineer |
| Evaluation | `eval/{project}/group-{N}` | Evaluator |
| Revision | `revise/{minor\|major}/app/{task-id}` | Design Engineer |
| Contract Review | `contract-review/group-{N}` | Evaluator |

---

## Build Loop (Phase 4) Detail

```
Group N:
  ┌──────────────────────────────────────────────────────┐
  │ 4.1 Sprint Contract                                  │
  │   Sprint Lead 작성 → Evaluator 리뷰 (최대 3 round)    │
  │   Done Criteria + Verification Method 합의            │
  ├──────────────────────────────────────────────────────┤
  │ 4.2 Implement (BE/FE 병렬)                            │
  │   각 Engineer가 worktree에서 구현                      │
  │   Build Check: tsc + eslint + jest                   │
  ├──────────────────────────────────────────────────────┤
  │ 4.3 Merge                                            │
  │   Sprint Lead가 sprint 브랜치에 --no-ff 머지           │
  │   App 태스크 → QA Pattern Check 실행                   │
  ├──────────────────────────────────────────────────────┤
  │ 4.4 Evaluate                                         │
  │   Evaluator: Active Evaluation                       │
  │   - Contract Verification (Done Criteria 1:1 증명)    │
  │   - Logic Tracing (실행 흐름 추적)                     │
  │   - Edge Case Probing (경계값, null, 권한)             │
  │   - Cross-Task Integration Check                     │
  ├──────────────────────────────────────────────────────┤
  │ 4.5 Verdict                                          │
  │   PASS → Checkpoint 생성 → Group N+1                  │
  │   ISSUES/FAIL → Fix Loop (최대 2회)                   │
  │   3회 실패 → FAILED + 사용자 개입                      │
  └──────────────────────────────────────────────────────┘
```

### 병렬화 규칙

| 상황 | 허용 |
|------|------|
| 같은 그룹 BE/FE | 항상 병렬 |
| 다른 레포 머지 | 병렬 가능 |
| Group N 평가 중 + Group N+1 계약 | 선행 가능 |
| Group N PASS 전 + Group N+1 구현 | **불가** |

---

## Evaluation System

### Severity Classification

| Severity | 정의 | 예시 |
|----------|------|------|
| **Critical** | 기능 불가 / 데이터 손상 위험 | API 500, 무한 루프, injection |
| **Major** | AC 미충족 / 비즈니스 규칙 위반 | 카운트 미감소, 차단 유저 노출 |
| **Minor** | 동작 무관 코드 품질 | unused import, 비효율적 쿼리 |

### Verdict Rules

| 판정 | 조건 | 후속 |
|------|------|------|
| **PASS** | Critical 0, Major 0 | 다음 그룹 |
| **ISSUES** | Critical 0, Major 1+ | Fix Loop |
| **FAIL** | Critical 1+, Major 3+ | Fix Loop 또는 재구현 |

### Evaluator Anti-Patterns

- 파일/함수 존재만 확인하고 VERIFIED 판정
- Happy path만 테스트하고 PASS 판정
- 이슈를 나열한 뒤 "전반적으로 잘 구현되었다"로 결론
- Generator의 의도를 선의로 해석

---

## Prototype System (Phase 3)

### Design Engineer 3-Step Process

```
Step A: Context Engine Assembly
  WHY (PRD Business Intent) + WHAT (Design Tokens) + HOW (Orchestration Rules)
  → context-engine.yaml + tokens.css

Step B: UX Decomposition
  Context Engine → 화면별 Screen Spec (machine-readable md)
  Component Tree + Layout Spec + States + Interactions + Labels + Token Map

Step C: Prototype Generation
  Screen Spec + HTML Template → self-contained HTML prototype
  Control Panel (스크린 선택, 상태 토글) + Device Frame (390×844)
```

### Review Workflow

```
Sprint Lead가 스크린샷 캡처 → 사용자 리뷰
  approve  → Prototype Reference를 태스크에 추가
  reject   → 참조에서 제외
  revise   → minor(CSS) 또는 major(구조) revision
  skip     → pending 유지
```

### PRD Feedback Loop

1. **Amendment Extraction** (3.4): revision 피드백 → 무엇이 바뀌었는지 (delta)
2. **PRD Refinement** (3.5): 승인 프로토타입 → 무엇이 있는지 (full spec)

---

## Context Window Management

장시간 스프린트에서 context 품질 유지를 위한 프로토콜.

### Checkpoint System

```
checkpoints/
├── phase-2-summary.md      # Spec 결과
├── phase-3-summary.md      # Prototype 결과
├── group-001-summary.md    # Build 결과 (per group)
└── group-002-summary.md
```

**규칙**:
1. Phase/Group 전환 시 checkpoint 생성 필수 (미생성 시 진행 차단)
2. 이후 단계에서는 원본 대신 checkpoint 참조
3. Fix loop에서 이전 이슈 재현 시에만 원본 Read 허용

### Progressive File Reading

- `api-contract.yaml`: 현재 그룹 endpoint만 (`offset`/`limit`)
- 태스크 파일: AC 섹션 중심
- Evaluation 보고서: verdict + 이슈 목록만
- 이전 그룹: checkpoint summary만

---

## Branching Strategy

```
                    origin/{base-branch}
                         │
                         ├── zzem/{sprint-id}              ← Sprint 브랜치
                         │      ├── zzem/{sprint-id}/001   ← Task worktree
                         │      ├── zzem/{sprint-id}/002
                         │      └── ...
                         │
                         └── PR: zzem/{sprint-id} → {base}
```

| 항목 | Backend | App |
|------|---------|-----|
| Base branch | `sprint-config.yaml` → `branches.backend.base` | `sprint-config.yaml` → `branches.app.base` |
| Sprint branch | `zzem/{sprint-id}` | `zzem/{sprint-id}` |
| Task branch | `zzem/{sprint-id}/{task-id}` | `zzem/{sprint-id}/{task-id}` |
| Worktree 경로 | `.worktrees/backend_{task-id}` | `.worktrees/app_{task-id}` |

---

## Error Recovery Playbooks

| ID | 상황 | 처리 |
|----|------|------|
| P1 | Engineer 구현 반복 실패 | spec 모호 → spec 재작성; 기술적 한계 → scope 축소; 의존성 → 그룹 순서 재조정 |
| P2 | 머지 충돌 | 충돌 파일 + diff 출력 → 사용자 수동 해결 → `--continue` 또는 `--abort` |
| P3 | Evaluator 반복 FAIL | 3가지 옵션: scope 축소, 수동 수정, 그룹 재구현 |
| P4 | Worktree/Branch 오염 | `git worktree list` → `remove --force` → 재시도 |
| P5 | Phase 중간 재시작 | contracts/ + evaluations/ 스캔 → 미완료 그룹부터 재개 |

---

## Sprint Modes

| Mode | 용도 | 전제조건 |
|------|------|---------|
| `--continue` | 같은 스프린트 내 미충족 항목 재시도 | retrospective/ 완료 + deferred-items.yaml 존재 |
| `--follow-up=<prev>` | 이전 스프린트 기반 후속 스프린트 | 이전 retrospective/ 존재 |
| `--status` | 실시간 대시보드 | 스프린트 디렉토리 존재 |
| `--resume` | Phase 4 중간 재시작 | 기존 contracts/ + evaluations/ 존재 |
| `--allow-partial` | FAILED 그룹 제외 PR | ACCEPTED 그룹 1개 이상 |

---

## Constraints

- 머지 충돌: 자동 해결 없이 사용자 개입 요청
- PR 생성/push: 반드시 사용자 확인
- Teammate: 원격 push 및 브랜치 머지 금지 (Sprint Lead 전담)
- Evaluator 피드백 없이 그룹 accept 금지
- 이전 그룹 PASS 전 다음 그룹 구현 시작 금지
- Fix loop 최대 2회, 3회 실패 시 FAILED + 사용자 개입
- Checkpoint 미생성 시 Phase/Group 전환 차단
- `.worktrees/` 디렉토리는 `.gitignore`에 포함
