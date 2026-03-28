# Agent Teams Architecture — ZZEM Agentic Sprint System v4

> Harness Design 패턴 기반 재설계. Planner-Generator-Evaluator 분리 + Feature-by-Feature Iteration.

## 1. 개요

### v3 → v4 변경

```
v3: Agent Teams (일괄 디스패치)
┌─────────────────────────────────────────────┐
│ Sprint Lead dispatches ALL tasks at once     │
│ Engineers self-QA → QA Engineer validates    │
│ Batch: implement all → merge all → QA all   │
└─────────────────────────────────────────────┘

v4: Harness Design (반복 루프)
┌─────────────────────────────────────────────┐
│ Sprint Lead dispatches ONE GROUP at a time   │
│ Engineers build → Evaluator actively assesses│
│ Loop: contract → implement → evaluate → fix │
└─────────────────────────────────────────────┘
```

**핵심 변경**:
1. Self-evaluation 제거 → 독립 Evaluator가 능동 평가
2. 일괄 디스패치 → 그룹 단위 반복 루프
3. 정적 QA → Active Evaluation (logic tracing, edge case probing)
4. Sprint Contract 도입 (구현 전 done 기준 합의)
5. Harness simplification (Opus 4.6 기준 불필요한 scaffolding 제거)

## 2. 팀 구성 (Planner-Generator-Evaluator)

| Role | Archetype | Agent | Phase | 핵심 책임 |
|------|-----------|-------|-------|----------|
| Planner | Planner | Sprint Lead | Phase 2 | PRD → deliverable-focused 명세 |
| Orchestrator | — | Sprint Lead | 전 Phase | 파이프라인 조율, 머지, PR |
| Prototype | — | Design Engineer | Phase 3 | Context Engine → Screen Spec → Figma 프로토타입 (3단계) |
| Generator | Generator | BE Engineer | Phase 4 | Backend 구현 |
| Generator | Generator | FE Engineer | Phase 4 | Frontend 구현 |
| Evaluator | Evaluator | Evaluator | Phase 4 | 능동적 품질 평가 |

### Teammate 정의 파일

```
.claude/teammates/
├── be-engineer.md       # Backend Generator
├── fe-engineer.md       # Frontend Generator
├── design-engineer.md   # Figma Prototype
└── evaluator.md         # Active Evaluator (v3의 qa-engineer.md 대체)
```

## 3. 태스크 조율 프로토콜

### 3.1 태스크 네이밍

| Phase | Pattern | Example |
|-------|---------|---------|
| Prototype | `proto/app/{task-id}/{ScreenName}` | `proto/app/001-profile/ProfileScreen` |
| Implementation | `impl/backend/{task-id}` | `impl/backend/001-profile-api` |
| Implementation | `impl/app/{task-id}` | `impl/app/001-profile-screen` |
| Evaluation | `eval/{project}/group-{N}` | `eval/backend/group-001` |

### 3.2 의존성 인코딩

```
태스크 파일 번호:     001 → 002 → 003
Agent Teams:         Group 001 unblocked
                     Group 002 after Group 001 ACCEPTED by Evaluator
                     Group 003 after Group 002 ACCEPTED by Evaluator
```

**v4 변경**: 의존성이 "머지 완료" 기준이 아닌 **"Evaluator PASS" 기준**으로 해소.

### 3.3 Communication

```
Engineer → Sprint Lead:
  "Task {task-id} complete, branch ready for merge"

Sprint Lead → Engineer:
  "Evaluator found issues: {summary}. Fix needed."

Sprint Lead → Evaluator:
  "Group {N} merged. Contract: contracts/group-{N}.md. Evaluate."

Evaluator → Sprint Lead:
  "Evaluation Group {N}: {PASS|ISSUES|FAIL}. Report: evaluations/group-{N}.md"

Sprint Lead → User:
  "Group {N} accepted. Proceeding to Group {N+1}."
  "Merge conflict. Manual resolution needed."
```

## 4. 실행 모델

### Phase 4: Build — Iterative Loop

```
Sprint Lead              BE Engineer        FE Engineer        Evaluator
    │                        │                  │                  │
    ├─ Sprint branch 생성    │                  │                  │
    │                        │                  │                  │
    │  ══ Group 001 ═══════════════════════════════════════════════│
    │                        │                  │                  │
    ├─ Contract 001 작성 ────┼──────────────────┼──► 리뷰 ────────┤
    │  ◄── "Contract agreed" ┼──────────────────┼─────────────────┤
    │                        │                  │                  │
    ├─ TaskCreate group 001  │                  │                  │
    │                        ├─ Pick: be/001    │                  │
    │                        ├─ Worktree        ├─ Pick: app/001  │
    │                        ├─ 구현            ├─ Worktree       │
    │                        ├─ Build Check     ├─ 구현           │
    │  ◄── "ready" ─────────┤                  ├─ Build Check    │
    ├─ git merge be/001      │                  │                  │
    │                        │                  │                  │
    │  ◄── "ready" ──────────┼──────────────────┤                  │
    ├─ git merge app/001     │                  │                  │
    │                        │                  │                  │
    ├─ TaskCreate: eval/group-001 ─────────────────────────► ─────┤
    │                        │                  │  ├─ Build Check │
    │                        │                  │  ├─ Logic Trace │
    │                        │                  │  ├─ Edge Cases  │
    │  ◄── "PASS" ───────────┼──────────────────┼─────────────────┤
    │                        │                  │                  │
    │  ══ Group 002 ═══════════════════════════════════════════════│
    │                        │                  │                  │
    ├─ Contract 002 작성     │                  │                  │
    ...                      ...                ...                │
```

### Fix Loop (ISSUES 발생 시)

```
Sprint Lead              Engineer           Evaluator
    │                        │                  │
    │  ◄── "ISSUES" ─────────┼──────────────────┤
    ├─ 보고서 전달 ──────────►                   │
    │                        ├─ 이슈 수정       │
    │  ◄── "fixed" ──────────┤                  │
    ├─ git merge fix         │                  │
    ├─ 재평가 요청 ──────────┼──────────────────►
    │                        │                  ├─ 재평가
    │  ◄── "PASS" ───────────┼──────────────────┤
    │                        │                  │
    │  (최대 2회 반복)       │                  │
```

### Worktree 격리

```
.worktrees/
├── backend_001-profile-api/       # BE Engineer
├── app_001-profile-screen/        # FE Engineer
└── (Evaluator는 sprint 브랜치에서 직접 검증 — worktree 불필요)
```

## 5. 파일 아티팩트 (File-Based Handoff)

```
sprints/{sprint-id}/
├── PRD.md                         # Init: PRD 참조
├── sprint-config.yaml             # Init: 설정
├── api-contract.yaml              # Spec: SSOT (Planner → Generator)
├── evaluation/
│   └── criteria.md                # Spec: 평가 기준 (Planner → Evaluator)
├── tasks/
│   ├── backend/*.md               # Spec: 태스크 명세 (Planner → Generator)
│   └── app/*.md
├── contracts/
│   ├── group-001.md               # Build: Sprint Contract (Sprint Lead ↔ Evaluator)
│   ├── group-002.md
│   └── ...
├── evaluations/
│   ├── group-001.md               # Build: 평가 보고서 (Evaluator → Generator)
│   ├── group-002.md
│   └── ...
├── prototypes/
│   ├── context/
│   │   └── context-engine.yaml    # Prototype: Context Engine (WHY/WHAT/HOW)
│   ├── library-catalog.yaml       # Prototype: Figma 라이브러리 카탈로그
│   └── app/                       # Prototype: Figma 스크린샷/링크
│       ├── {task-id}/
│       │   ├── {ScreenName}.spec.md  # Machine-readable Screen Spec
│       │   ├── {ScreenName}.png      # Figma 스크린샷
│       │   └── figma-link.md         # Figma URL
│       └── approval-status.yaml
├── retrospective/                     # Retro: 스프린트 회고 (Phase 6)
│   ├── gap-analysis.yaml              # PRD AC 달성 여부 매핑
│   ├── pattern-digest.yaml            # 반복 실패 패턴 + 메트릭
│   └── deferred-items.yaml            # 이월 항목 레지스트리
├── follow-up-context.yaml             # Follow-up: 이전 스프린트 연결 (선택)
└── logs/
```

## 6. 에러 처리

| 상황 | 처리 | v3 대비 변경 |
|------|------|-------------|
| Engineer 빌드 실패 | 자체 수정 재시도 | Self-QA → Build Check로 축소 |
| 머지 충돌 | 스프린트 중단, 사용자 수동 해결 | 변경 없음 |
| Evaluator ISSUES | Engineer에게 보고서 전달 → fix loop | NEW: 능동 평가 기반 |
| Evaluator FAIL | fix loop (최대 2회) → FAILED | NEW: Active evaluation |
| Fix loop 3회 초과 | FAILED + 사용자 개입 | v3의 self-QA 3회 → Eval loop 3회 |
| Figma MCP 불가 | Design Engineer 수동 폴백 | 변경 없음 |

## 7. v3 → v4 마이그레이션

| 항목 | v3 | v4 |
|------|----|----|
| QA 방식 | Self-QA + QA Engineer (정적) | Build Check + Evaluator (능동) |
| Teammate | qa-engineer.md | evaluator.md (신규) |
| 디스패치 | 전체 태스크 일괄 | 그룹 단위 반복 |
| Phase 이름 | Plan / Execute | Spec / Build |
| Contract | 없음 | contracts/group-{N}.md |
| 평가 보고서 | QA Report (pass/fail) | Evaluation Report (scored, evidence-based) |
| 타임아웃 | 30분 | 제거 (Opus 4.6 신뢰) |
| 설정 | task_timeout + qa_retry | eval_retry_limit만 |

기존 스프린트 데이터, 브랜치 전략, Figma 워크플로우는 변경 없이 호환.

## 8. Post-Sprint Iteration (v4.1)

### Phase 6: Retrospective

PR 생성 후 자동 실행. PRD AC 달성률 분석, 반복 패턴 추출, 이월 항목 구조화.

```
Sprint Lead
    │
    ├─ 6.1 Gap Analysis      PRD AC vs 실제 달성 매핑
    ├─ 6.2 Pattern Digest    Evaluator 보고서 종합 → 시스템 패턴
    ├─ 6.3 Deferral Index    이월 항목 구조화
    └─ 6.4 Next Action       사용자에게 --continue / --follow-up 제안
```

### Sprint Continuation (`--continue`)

같은 sprint 브랜치 위에서 이월 항목만 이어서 처리:
- retrospective/deferred-items.yaml 기반
- 새 그룹 번호로 Phase 4 재진입
- 기존 PR에 추가 커밋 또는 새 PR 생성

### Follow-Up Sprint (`--follow-up`)

이전 스프린트의 Retrospective를 기반으로 새 스프린트 생성:
- Delta PRD: 이월 항목 + 보강된 AC + 개선 사항
- Evaluator 캘리브레이션: pattern-digest 반영
- Regression Guard: 이전 충족 AC 회귀 검증
- 추이 추적: 스프린트 간 품질 메트릭 비교
