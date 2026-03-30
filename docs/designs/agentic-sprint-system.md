# Agentic Sprint System — Design Overview

> ZZEM 앱(MemeApp + meme-api)의 자동화 스프린트 시스템. PRD → 코드 → PR 파이프라인.

## Version History

| Version | Architecture | Key Change |
|---------|-------------|------------|
| v1 | Shell Scripts | 6개 개별 스크립트 |
| v2 | Shell + Skills | 6개 개별 스킬 (`/sprint-init`, `/sprint-plan`, ...) |
| v3 | Agent Teams | 통합 `/sprint` + 4 Teammates (BE/FE/Design/QA) |
| **v4** | **Harness Design** | **Planner-Generator-Evaluator + Iterative Loop** |

## Current: v4 Harness Design

> Ref: [Harness Design for Long-Running Agentic Applications](https://www.anthropic.com/engineering/harness-design-long-running-apps) (Anthropic Engineering)

### Core Principles

1. **Planner-Generator-Evaluator 분리** — 생성과 평가를 분리. Self-evaluation은 신뢰할 수 없다.
2. **Sprint Contract** — 구현 전 Generator와 Evaluator가 "done" 기준에 합의.
3. **Feature-by-Feature Iteration** — 기능 그룹 단위 반복 루프.
4. **Active Evaluation** — 정적 검사가 아닌, 코드 로직 추적 및 엣지 케이스 탐색.
5. **Deliverable-Focused Spec** — 결과물 중심 명세. 구현 세부사항 사전 지정 금지.
6. **File-Based Handoff** — 에이전트 간 상태 전달은 구조화된 파일 아티팩트.
7. **Minimal Harness** — 모델이 자체 처리 가능한 부분은 scaffolding 제거.

### Architecture

```
Planner (Sprint Lead) ──spec──► Generator (BE/FE) ──code──► Evaluator
                                      ▲                         │
                                      └──── feedback ───────────┘
```

### Pipeline

```
Phase 1: Init ──────────────── Sprint Lead solo
Phase 2: Spec ──────────────── Sprint Lead as Planner
Phase 3: Prototype ─────────── Sprint Lead + Design Engineer
Phase 4: Build ─────────────── Iterative Loop per feature group
  │
  ├─ For each group:
  │   ├─ 4.1 Contract  ─── Sprint Lead + Evaluator
  │   ├─ 4.2 Implement ─── BE/FE Engineers (parallel)
  │   ├─ 4.3 Merge     ─── Sprint Lead
  │   ├─ 4.4 Evaluate  ─── Evaluator (active)
  │   └─ 4.5 Fix/Accept
  │
Phase 5: PR ────────────────── Sprint Lead solo
Phase 6: Retrospective ─────── Sprint Lead solo (Gap Analysis + Pattern Digest + Deferral Index)
  │
  ├─ All AC fulfilled ───────── Sprint complete
  ├─ Few deferred (small) ──── --continue (같은 브랜치에서 이어서)
  └─ Many deferred / new req ── --follow-up (새 스프린트, Delta PRD)
```

### Team

| Role | Agent | Archetype |
|------|-------|-----------|
| Sprint Lead | Main session | Planner + Orchestrator |
| BE Engineer | Teammate | Generator |
| FE Engineer | Teammate | Generator |
| Design Engineer | Teammate | Prototype |
| Evaluator | Teammate | Evaluator |

### Key Changes (v3 → v4)

| Aspect | v3 | v4 |
|--------|----|----|
| QA | Self-QA + static QA Engineer | Build Check + Active Evaluator |
| Dispatch | All tasks at once | Group-by-group iteration |
| Contract | None | Sprint Contract per group |
| Evaluation | tsc/lint/jest + AC checklist | Logic tracing + edge case probing |
| Timeout | 30 min per task | Removed (trust Opus 4.6) |
| Phase naming | Plan / Execute | Spec / Build |

## Detailed Designs

- [Harness Design](harness-design.md) — v4 설계 원칙 및 패턴 상세
- [Agent Teams Architecture](agent-teams-architecture.md) — 팀 구성, 실행 모델, 에러 처리
- [Branch Strategy](branch-strategy.md) — Git 브랜칭 + worktree 격리
- [Agent Communication Map](agent-communication-map.md) — 에이전트 간 소통 및 Context 공유

## Invocation

```
/sprint <sprint-id>                              # Full pipeline (Phase 1~6)
/sprint <sprint-id> --phase=X                    # Single phase (init/spec/prototype/build/pr/retro)
/sprint <sprint-id> --continue                   # 이월 항목 이어서 진행
/sprint <new-id> --follow-up=<prev-id>           # 후속 스프린트 (Delta PRD 기반)
/sprint <sprint-id> --status                     # Dashboard
```

## Directory Structure

```
zzem-orchestrator/
├── .claude/
│   ├── skills/sprint/SKILL.md          # Unified /sprint skill (v4)
│   ├── skills/_archived/               # v2 deprecated skills
│   └── teammates/
│       ├── be-engineer.md              # Generator
│       ├── fe-engineer.md              # Generator
│       ├── design-engineer.md          # Prototype
│       └── evaluator.md               # Evaluator (v4 신규)
├── sprint-orchestrator/
│   ├── templates/
│   │   ├── sprint-config-template.yaml
│   │   ├── sprint-contract-template.md # v4 신규
│   │   ├── evaluation-criteria.md      # v4 신규
│   │   ├── screen-spec-template.md     # Design Engineer Screen Spec
│   │   ├── html-prototype-template.html # HTML 프로토타입 스켈레톤
│   │   └── prd-template.md
│   └── sprints/{sprint-id}/
│       ├── PRD.md
│       ├── sprint-config.yaml
│       ├── api-contract.yaml
│       ├── tasks/{backend,app}/*.md
│       ├── contracts/group-{N}.md      # v4 신규
│       ├── evaluations/group-{N}.md    # v4 신규
│       ├── prototypes/
│       │   ├── context/context-engine.yaml  # Design Context Engine
│       │   └── app/                         # HTML 프로토타입/스크린샷
│       ├── retrospective/                   # Phase 6 산출물
│       │   ├── gap-analysis.yaml
│       │   ├── pattern-digest.yaml
│       │   └── deferred-items.yaml
│       ├── follow-up-context.yaml           # --follow-up 시 이전 스프린트 연결
│       └── logs/
└── docs/
    ├── prds/
    └── designs/
        ├── agentic-sprint-system.md    # This file
        ├── harness-design.md           # v4 신규
        ├── agent-teams-architecture.md
        └── branch-strategy.md
```
