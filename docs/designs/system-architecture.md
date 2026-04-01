# System Architecture — ZZEM Agentic Sprint System v4

> Ref: [Harness Design for Long-Running Agentic Applications](https://www.anthropic.com/engineering/harness-design-long-running-apps) (Anthropic Engineering)
>
> 모든 harness 컴포넌트는 "모델이 자체 처리할 수 없는 것"에 대한 가설이다.
> 모델이 발전하면 가설을 재검증한다.

---

## 1. Core Architecture: Planner-Generator-Evaluator

GAN에서 영감받은 3-agent 분리 패턴. **생성과 평가의 분리**가 품질의 기반이다.

```
Planner ──spec──► Generator ──code──► Evaluator
                      ▲                    │
                      └──── feedback ──────┘
```

### 왜 분리하는가?

에이전트가 자기 결과물을 평가하면 **관대해진다**: 문제를 발견하고도 "별거 아니다"라고 합리화한다.
외부 평가자가 같은 코드를 보면 문제를 정확히 지적한다.
이 단일 변경이 전체 품질을 극적으로 향상시킨다.

---

## 2. Team

| Role | Archetype | Agent | Phase | 핵심 책임 |
|------|-----------|-------|-------|----------|
| Planner | Planner | Sprint Lead | Phase 2 | PRD → deliverable-focused 명세 |
| Orchestrator | — | Sprint Lead | 전 Phase | 파이프라인 조율, 머지, PR |
| Prototype | — | Design Engineer | Phase 3 | 태스크 Spec → HTML 프로토타입 |
| Generator | Generator | BE Engineer | Phase 4 | Backend 구현 |
| Generator | Generator | FE Engineer | Phase 4 | Frontend 구현 |
| Evaluator | Evaluator | Evaluator | Phase 4 | 능동적 품질 평가 |

### Teammate 정의 파일

```
.claude/teammates/
├── be-engineer.md       # Backend Generator
├── fe-engineer.md       # Frontend Generator
├── design-engineer.md   # HTML Prototype
└── evaluator.md         # Active Evaluator
```

---

## 3. Key Patterns

### 3.1 Sprint Contract

구현 시작 전, Generator와 Evaluator가 "done"의 의미에 합의한다.

- 각 기능 그룹별 testable success criteria 정의
- Evaluator가 검증 방법을 사전 확인
- 모호한 AC를 구체적 검증 기준으로 변환
- 파일 아티팩트: `contracts/group-{N}.md`

### 3.2 Feature-by-Feature Iteration

전체 태스크를 한번에 디스패치하지 않는다. 기능 그룹 단위로:

```
Group 001: Contract → Implement → Merge → Evaluate → Accept/Fix
Group 002: Contract → Implement → Merge → Evaluate → Accept/Fix
Group 003: ...
```

장점:
- 초기 그룹의 피드백이 후속 그룹 품질을 향상
- 문제를 조기에 발견하여 cascade 방지
- 각 그룹이 독립적으로 testable

### 3.3 Active Evaluation

정적 검사(tsc, lint, jest)는 **평가가 아니라 빌드 체크**다.

진정한 평가:
- **Logic Tracing**: 코드 실행 흐름을 직접 추적
- **Edge Case Probing**: "이 입력이면?", "이 상태에서는?"
- **Skepticism**: 버그가 있다고 가정하고 증명을 찾는다
- **Evidence-Based**: 모든 판정에 코드 위치와 근거를 명시

### 3.4 File-Based Handoff

에이전트 간 상태 전달은 구조화된 파일 아티팩트로:

```
sprints/{sprint-id}/
├── api-contract.yaml       # Planner → Generator (SSOT)
├── tasks/{project}/*.md    # Planner → Generator (태스크 명세)
├── contracts/group-{N}.md  # Planner → Generator + Evaluator (합의)
├── evaluations/group-{N}.md # Evaluator → Generator (피드백)
└── prototypes/app/         # Design → Generator (시각적 참조)
```

### 3.5 Deliverable-Focused Specification

Planner는 **What**을 명세하고, **How**는 Generator가 결정한다.

- Over-specification은 오류 cascade를 유발
- 구현 세부사항 사전 지정 금지
- AC는 testable 형태로 작성
- Implementation Hints는 기존 패턴 참조만

---

## 4. Execution Model

### 4.1 Phase 4: Build — Iterative Loop

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
    ├─ TaskCreate: eval ─────────────────────────────────────►────┤
    │                        │                  │  ├─ Logic Trace │
    │                        │                  │  ├─ Edge Cases  │
    │  ◄── "PASS" ───────────┼──────────────────┼─────────────────┤
    │                        │                  │                  │
    │  ══ Group 002 ═══════════════════════════════════════════════│
    ...
```

### 4.2 Fix Loop (ISSUES 발생 시)

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
    │  (최대 2회 반복, 3회차 실패 시 FAILED)       │
```

### 4.3 태스크 네이밍

| Phase | Pattern | Example |
|-------|---------|---------|
| Prototype | `proto/app/{task-id}/{ScreenName}` | `proto/app/001-profile/ProfileScreen` |
| Implementation | `impl/backend/{task-id}` | `impl/backend/001-profile-api` |
| Implementation | `impl/app/{task-id}` | `impl/app/001-profile-screen` |
| Evaluation | `eval/{project}/group-{N}` | `eval/backend/group-001` |

### 4.4 의존성 규칙

```
Group 001 → unblocked
Group 002 → Group 001이 Evaluator PASS 후에만 구현 시작
Group 003 → Group 002가 Evaluator PASS 후에만 구현 시작
```

**v4 변경**: 의존성이 "머지 완료" 기준이 아닌 **"Evaluator PASS" 기준**으로 해소.

---

## 5. Evaluator Calibration

### 5.1 Grading Criteria

| 기준 | 가중치 | 설명 |
|------|--------|------|
| Correctness | 높음 | 비즈니스 로직이 AC와 정확히 일치하는가 |
| Completeness | 높음 | 모든 요구사항이 구현되었는가 (stub 없이) |
| Edge Cases | 중간 | 경계 조건과 에러 상태가 처리되는가 |
| Integration | 중간 | API contract과 실제 구현이 일관되는가 |
| Code Quality | 낮음 | 기존 패턴 준수 |

> Code Quality 가중치가 낮은 이유: Claude는 기본적으로 코드 품질이 높다.
> Correctness와 Completeness에 집중하는 것이 품질 향상에 더 효과적.

### 5.2 Skepticism Prompting

```
당신은 코드 리뷰어가 아니라 버그 헌터다.
- 구현이 완벽해 보여도 의심하라
- "이건 동작할 것 같은데..."라고 느끼면 실제로 trace하라
- 문제를 발견한 후 "별거 아닐 수도"라고 자신을 설득하지 마라
- Happy path가 아닌 edge case에서 시작하라
```

### 5.3 평가 판정

| 판정 | 조건 | 다음 단계 |
|------|------|----------|
| **PASS** | Critical/Major 이슈 0개 | 다음 그룹 진행 |
| **ISSUES** | Critical 0, Major 1+ | Fix Loop |
| **FAIL** | Critical 1+, 또는 Major 3+ | Fix Loop (또는 재구현) |

---

## 6. Error Handling

| 상황 | 처리 |
|------|------|
| Engineer 빌드 실패 | 자체 수정 재시도 |
| 머지 충돌 | 스프린트 중단, 사용자 수동 해결 |
| Evaluator ISSUES | Engineer에게 보고서 전달 → fix loop |
| Evaluator FAIL | fix loop (최대 2회) → FAILED |
| Fix loop 3회 초과 | FAILED + 사용자 개입 |

---

## 7. Harness Simplification (v3 → v4)

Opus 4.6 기준으로 불필요해진 scaffolding 제거.

| v3 (Agent Teams) | v4 (Harness Design) | 근거 |
|---|---|---|
| Self-QA (tsc + lint + jest) | Build Check (tsc only) | Self-evaluation 안티패턴 |
| 30분 타임아웃 | 제거 | Opus 4.6은 장시간 태스크를 안정적으로 수행 |
| 3회 self-QA 실패 → FAILED | 제거 | Evaluator가 품질 판단 |
| 전체 태스크 일괄 디스패치 | 그룹 단위 반복 | Feature-by-feature iteration |
| QA Engineer (정적 검증) | Evaluator (능동적 평가) | Skepticism-first, evidence-based |
| Phase 2: Plan | Phase 2: Spec | Deliverable-focused |

### 제거하지 않는 것 (여전히 load-bearing)

| 컴포넌트 | 유지 이유 |
|---------|----------|
| Worktree 격리 | 병렬 작업 시 파일 충돌 방지 — 모델 능력과 무관 |
| Sprint Contract | 구현 전 합의가 품질의 기반 |
| 순차 머지 | Git 충돌 최소화 — 구조적 제약 |
| PR 전 사용자 확인 | 외부 영향 작업의 안전장치 |
| API contract SSOT | BE/FE 간 일관성 보장 |

---

## 8. Post-Sprint Iteration

### 8.1 Phase 6: Retrospective

PR 생성 후 자동 실행:

```
Sprint Lead
    │
    ├─ 6.1 Gap Analysis      PRD AC vs 실제 달성 매핑
    ├─ 6.2 Pattern Digest    Evaluator 보고서 종합 → 시스템 패턴
    ├─ 6.3 Deferral Index    이월 항목 구조화
    ├─ 6.4 Sprint Report     REPORT.md 생성
    └─ 6.5 Next Action       사용자에게 --continue / --follow-up 제안
```

### 8.2 Sprint Continuation vs Follow-Up

| | `--continue` | `--follow-up` |
|--|------------|--------------|
| 브랜치 | 같은 sprint 브랜치 | 새 sprint 브랜치 |
| PRD | 같은 PRD (변경 없음) | Delta PRD (보강) |
| API Contract | 같은 contract | 상속 + 확장 |
| 그룹 번호 | 이어서 (N+1~) | 새로 (001~) |
| 적합한 상황 | 소수 이월 (1~2건, small) | 다수 이월 또는 추가 요구사항 |
| Regression | 같은 맥락이므로 간소 | 전체 이전 AC 회귀 검증 |
