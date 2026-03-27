# Harness Design — ZZEM Agentic Sprint System v4

> "Harness Design for Long-Running Agentic Applications" (Anthropic Engineering) 기반 재설계.
> 모든 harness 컴포넌트는 "모델이 자체 처리할 수 없는 것"에 대한 가설이다. 모델이 발전하면 가설을 재검증한다.

## 1. Core Architecture: Planner-Generator-Evaluator

GAN에서 영감받은 3-agent 분리 패턴. **생성과 평가의 분리**가 품질의 기반이다.

```
Planner ──spec──► Generator ──code──► Evaluator
                      ▲                    │
                      └──── feedback ──────┘
```

| Role | Agent | Phase | 핵심 책임 |
|------|-------|-------|----------|
| Planner | Sprint Lead | Phase 2 (Spec) | PRD → deliverable-focused 명세 |
| Generator | BE/FE Engineer | Phase 4 (Build) | 명세 → 구현 |
| Evaluator | Evaluator | Phase 4 (Build) | 구현 → 능동적 품질 평가 |
| Orchestrator | Sprint Lead | 전 Phase | 파이프라인 조율, 머지, PR |

### 왜 분리하는가?

에이전트가 자기 결과물을 평가하면 **관대해진다**: 문제를 발견하고도 "별거 아니다"라고 합리화한다.
외부 평가자가 같은 코드를 보면 문제를 정확히 지적한다.
이 단일 변경이 전체 품질을 극적으로 향상시킨다.

## 2. Key Patterns

### 2.1 Sprint Contract

구현 시작 전, Generator와 Evaluator가 "done"의 의미에 합의한다.

- 각 기능 그룹별 testable success criteria 정의
- Evaluator가 검증 방법을 사전 확인
- 모호한 AC를 구체적 검증 기준으로 변환
- 파일 아티팩트: `contracts/group-{N}.md`

### 2.2 Feature-by-Feature Iteration

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

### 2.3 Active Evaluation

정적 검사(tsc, lint, jest)는 **평가가 아니라 빌드 체크**다.

진정한 평가:
- **Logic Tracing**: 코드 실행 흐름을 직접 추적
- **Edge Case Probing**: "이 입력이면?", "이 상태에서는?"
- **Skepticism**: 버그가 있다고 가정하고 증명을 찾는다
- **Evidence-Based**: 모든 판정에 코드 위치와 근거를 명시

### 2.4 File-Based Handoff

에이전트 간 상태 전달은 구조화된 파일 아티팩트로:

```
sprints/{sprint-id}/
├── api-contract.yaml       # Planner → Generator (SSOT)
├── tasks/{project}/*.md    # Planner → Generator (태스크 명세)
├── contracts/group-{N}.md  # Planner → Generator + Evaluator (합의)
├── evaluations/group-{N}.md # Evaluator → Generator (피드백)
└── prototypes/app/         # Design → Generator (시각적 참조)
```

### 2.5 Deliverable-Focused Specification

Planner는 **What**을 명세하고, **How**는 Generator가 결정한다.

- Over-specification은 오류 cascade를 유발
- 구현 세부사항 사전 지정 금지
- AC는 testable 형태로 작성
- Implementation Hints는 기존 패턴 참조만

## 3. Harness Simplification (v3 → v4)

Opus 4.6 기준으로 불필요해진 scaffolding 제거.

| v3 (Agent Teams) | v4 (Harness Design) | 근거 |
|---|---|---|
| Self-QA (tsc + lint + jest) | Build Check (tsc only) | Self-evaluation 안티패턴. 평가는 Evaluator 전담 |
| 30분 타임아웃 | 제거 | Opus 4.6은 장시간 태스크를 안정적으로 수행 |
| 3회 self-QA 실패 → FAILED | 제거 | Build check는 pass/fail, Evaluator가 품질 판단 |
| 새 패턴 도입 금지 | 기존 패턴 우선 | 엔지니어 판단을 더 신뢰 |
| 전체 태스크 일괄 디스패치 | 그룹 단위 반복 | Feature-by-feature iteration |
| QA: static check + AC checklist | Active Evaluation | Logic tracing, edge case probing |
| QA Engineer (정적 검증) | Evaluator (능동적 평가) | Skepticism-first, evidence-based |
| Phase 2: Plan | Phase 2: Spec (Planner) | Deliverable-focused, no implementation details |

### 제거하지 않는 것 (여전히 load-bearing)

| 컴포넌트 | 유지 이유 |
|---------|----------|
| Worktree 격리 | 병렬 작업 시 파일 충돌 방지 — 모델 능력과 무관 |
| Sprint Contract | 구현 전 합의가 품질의 기반 — 새로 추가 |
| 순차 머지 | Git 충돌 최소화 — 구조적 제약 |
| PR 전 사용자 확인 | 외부 영향 작업의 안전장치 |
| API contract SSOT | BE/FE 간 일관성 보장 |

## 4. Evaluator Calibration

### Grading Criteria

| 기준 | 가중치 | 설명 |
|------|--------|------|
| Correctness | 높음 | 비즈니스 로직이 AC와 정확히 일치하는가 |
| Completeness | 높음 | 모든 요구사항이 구현되었는가 (stub 없이) |
| Edge Cases | 중간 | 경계 조건과 에러 상태가 처리되는가 |
| Integration | 중간 | API contract과 실제 구현이 일관되는가 |
| Code Quality | 낮음 | 기존 패턴 준수 (모델이 기본적으로 잘 하는 영역) |

> Code Quality 가중치가 낮은 이유: Claude는 기본적으로 코드 품질이 높다.
> Correctness와 Completeness에 집중하는 것이 품질 향상에 더 효과적.

### Skepticism Prompting

Evaluator에게 제공하는 캘리브레이션:

```
당신은 코드 리뷰어가 아니라 버그 헌터다.
- 구현이 완벽해 보여도 의심하라
- "이건 동작할 것 같은데..."라고 느끼면 실제로 trace하라
- 문제를 발견한 후 "별거 아닐 수도"라고 자신을 설득하지 마라
- Happy path가 아닌 edge case에서 시작하라
```

## 5. Iteration Protocol

전체 파이프라인 흐름:

```
Phase 1: Init ──────────────── Sprint Lead solo
Phase 2: Spec ──────────────── Sprint Lead as Planner
Phase 3: Prototype ─────────── Sprint Lead + Design Engineer
Phase 4: Build ─────────────── Iterative Loop
  │
  ├─ For each group:
  │   ├─ 4.1 Contract  ─── Sprint Lead drafts, Evaluator reviews
  │   ├─ 4.2 Implement ─── Engineers build in worktrees
  │   ├─ 4.3 Merge     ─── Sprint Lead merges to sprint branch
  │   ├─ 4.4 Evaluate  ─── Evaluator actively assesses
  │   └─ 4.5 Fix/Accept ── Loop or proceed
  │
Phase 5: PR ────────────────── Sprint Lead solo
```
