# Agent Teams 간 연결 및 Context 공유 (v4)

> Sprint 파이프라인에서 4명의 Teammate가 어떻게 소통하고, 어떤 Context를 공유하는지 도식화한 문서.
> v4 (Harness Design): Planner-Generator-Evaluator 패턴 기반.

---

## 1. 전체 커뮤니케이션 맵

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Sprint Lead (메인 에이전트)                        │
│                                                                         │
│  ● 전체 오케스트레이션     ● 태스크 분배/모니터링     ● 머지 관리          │
│  ● 사용자 게이트 제어      ● Evaluator ISSUES 시 fix 재할당              │
│  ● Sprint Contract 작성   ● 그룹 단위 반복 루프 조율                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  공유 Context (파일 기반 SSOT)                                           │
│  ┌───────────────────────────────────────────────────────────┐          │
│  │  PRD.md ─→ api-contract.yaml ─→ tasks/*.md               │          │
│  │              │                      │                     │          │
│  │              │            ┌─────────┼──────────┐          │          │
│  │              │            ▼         ▼          ▼          │          │
│  │              │        backend/   app/    contracts/        │          │
│  │              │                              group-{N}.md  │          │
│  └───────────────────────────────────────────────────────────┘          │
│                                                                         │
└──────┬──────────────┬──────────────┬──────────────┬─────────────────────┘
       │              │              │              │
  TaskCreate     TaskCreate     TaskCreate     TaskCreate
  SendMessage    SendMessage    SendMessage    SendMessage
       │              │              │              │
       ▼              ▼              ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│  Design    │ │    BE      │ │    FE      │ │ Evaluator  │
│  Engineer  │ │  Engineer  │ │  Engineer  │ │            │
│            │ │            │ │            │ │            │
│ Phase 3    │ │ Phase 4    │ │ Phase 4    │ │ Phase 4    │
│ (먼저 실행) │ │ (병렬)     │ │ (병렬)     │ │ (머지 후)   │
└──────┬─────┘ └──────┬─────┘ └──────┬─────┘ └──────┬─────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
   HTML 프로토타입   worktree 커밋   worktree 커밋   Evaluation
   + Screen Spec                                    Report
```

---

## 2. Context 공유 경로 (데이터 흐름)

```
                         ┌──────────────┐
                         │   PRD.md     │
                         └──────┬───────┘
                                │
                    Sprint Lead (Phase 2: Spec)
                                │
                 ┌──────────────┼──────────────┐
                 ▼              ▼              ▼
          api-contract     tasks/*.md     evaluation/
            .yaml        (app + backend)  criteria.md
                 │              │              │
    ┌────────────┼──────────────┼──────────────┤
    │            │              │              │
    │     ┌──────────────────────────┐        │
    │     │  각 task.md 파일이 포함:  │        │
    │     │  • Specification         │        │
    │     │  • Screens/Components    │        │
    │     │  • Business Rules        │        │
    │     │  • Acceptance Criteria   │        │
    │     └──────────────────────────┘        │
    │            │              │              │
    ▼            ▼              ▼              ▼
┌────────┐ ┌────────┐   ┌────────┐    ┌────────────┐
│Design  │ │  BE    │   │  FE    │    │ Evaluator  │
│Engineer│ │Engineer│   │Engineer│    │            │
│        │ │        │   │        │    │            │
│ 읽는것: │ │ 읽는것: │   │ 읽는것: │    │ 읽는것:     │
│• task  │ │• task  │   │• task  │    │• contracts/│
│  .md   │ │  .md   │   │  .md   │    │  group-N   │
│• design│ │• api-  │   │• api-  │    │• 머지된 코드│
│  tokens│ │  contract│ │  contract│  │• evaluation│
│        │ │• repo  │   │• HTML  │    │  /criteria │
│ 쓰는것: │ │  skills│   │  prototype│  │            │
│• HTML  │ │        │   │• repo  │    │ 쓰는것:     │
│  proto │ │ 쓰는것: │   │  skills│    │• evaluation│
│• approv│ │• 구현  │   │        │    │  /group-N  │
│  status│ │  코드  │   │ 쓰는것: │    │  .md       │
│        │ │        │   │• 구현  │    │            │
│        │ │        │   │  코드  │    │            │
└───┬────┘ └───┬────┘   └───┬────┘    └───┬────────┘
    │          │            │             │
    ▼          ▼            ▼             ▼
 prototypes/   .worktrees/    .worktrees/   evaluations/
 app/{id}/     backend_{id}   app_{id}      group-{N}.md
 prototype.html
```

---

## 3. 에이전트 간 소통 방식

| 소통 경로 | 방식 | 전달 내용 |
|-----------|------|----------|
| **Sprint Lead → 각 Agent** | `TaskCreate` + `SendMessage` | 태스크 할당, 컨텍스트 전달, fix 요청 |
| **각 Agent → Sprint Lead** | `TaskUpdate` + `SendMessage` | 완료 보고, 질문, 실패 보고 |
| **Sprint Lead ↔ Evaluator** | Sprint Contract (`contracts/group-{N}.md`) | Done Criteria 합의 + 평가 결과 |
| **Design → FE** (간접) | **파일 기반** (`prototypes/app/{id}/`) | Screen Spec + HTML 프로토타입 + 스크린샷을 FE가 참조 |
| **BE ↔ FE** (간접) | **파일 기반** (`api-contract.yaml`) | API 스키마가 양측의 공통 계약 |
| **BE/FE → Evaluator** (간접) | **파일 기반** (sprint 브랜치 코드) | 머지된 코드를 Evaluator가 능동 평가 |
| **Evaluator → BE/FE** (간접) | Sprint Lead 경유 (`SendMessage`) | ISSUES/FAIL 시 Sprint Lead가 fix 재할당 |

---

## 4. 핵심 포인트

### 4.1 직접 소통은 없다 — 모든 것이 Sprint Lead 경유

에이전트 간 직접 메시지는 없다. Sprint Lead가 허브 역할:
- Evaluator ISSUES → Sprint Lead가 원 엔지니어에게 fix 재할당
- 프로토타입 수정 필요 → Sprint Lead가 Design Engineer에게 revise 할당

### 4.2 Context 공유는 파일 기반 (SSOT)

```
api-contract.yaml          ← BE/FE/Evaluator 모두 참조하는 단일 진실의 원천
task.md                    ← 각 에이전트가 자기 태스크만 읽음
contracts/group-{N}.md     ← Sprint Lead가 작성, Evaluator가 리뷰/합의, 평가 기준
prototypes/app/{id}/       ← Design이 HTML 프로토타입을 쓰고, FE가 읽음 (시각적 참조)
evaluations/group-{N}.md  ← Evaluator가 쓰고, Sprint Lead/Engineer가 읽음
sprint 브랜치 코드          ← 엔지니어가 쓰고, Evaluator가 읽음
```

### 4.3 시간적 의존성 (실행 순서)

```
Phase 3: Design Engineer (태스크 Spec → HTML 프로토타입 + 사용자 승인)
                │
                ▼ approved 프로토타입이 task.md에 Prototype Reference로 추가
Phase 4: 그룹 단위 반복 루프
                │
                ├─ 4.1 Sprint Contract 합의 (Sprint Lead ↔ Evaluator)
                ├─ 4.2 BE + FE 병렬 구현
                ├─ 4.3 Sprint Lead가 sprint 브랜치에 머지
                ├─ 4.4 Evaluator 능동 평가 (Logic Tracing + Edge Case Probing)
                └─ 4.5 ISSUES 시 fix loop → PASS 시 다음 그룹
```

### 4.4 Worktree 격리로 충돌 방지

각 엔지니어는 독립 worktree에서 작업하므로 동일 리포에서 BE/FE가 동시 작업해도 충돌이 없고, Sprint Lead가 번호 순서대로 순차 머지한다. Evaluator는 sprint 브랜치에서 직접 검증하므로 worktree가 불필요하다.
