# Agentic Sprint System — ZZEM

> ZZEM 앱(MemeApp + meme-api)의 자동화 스프린트 시스템. PRD → 코드 → PR 파이프라인.

---

## Reading Guide

이 시스템을 이해하기 위한 문서 읽기 순서:

| 순서 | 문서 | 소요 | 목적 |
|------|------|------|------|
| 1 | **이 문서** | 3분 | 시스템 개요, 파이프라인, 디렉토리 구조 파악 |
| 2 | [System Architecture](system-architecture.md) | 15분 | 설계 원칙, 팀 구성, 실행 모델, Evaluator 캘리브레이션 |
| 3 | [Agent Communication Map](agent-communication-map.md) | 5분 | 에이전트 간 데이터 흐름, Context 공유 경로 |
| 4 | [Branch Strategy](branch-strategy.md) | 5분 | Git 브랜칭, worktree 격리, 머지 순서 (필요 시) |
| 5 | [Prototype Production Guide](prototype-production-guide.md) | 10분 | HTML 프로토타입 제작·리뷰·PRD 추출 메뉴얼 (필요 시) |

> **운영 레퍼런스**: `.claude/skills/sprint/SKILL.md`는 `/sprint` 명령 실행 시 참조하는 운영 명세로, 위 설계 문서와는 별개.

---

## Version History

| Version | Architecture | Key Change |
|---------|-------------|------------|
| v1 | Shell Scripts | 6개 개별 스크립트 |
| v2 | Shell + Skills | 6개 개별 스킬 (`/sprint-init`, `/sprint-plan`, ...) |
| v3 | Agent Teams | 통합 `/sprint` + 4 Teammates (BE/FE/Design/QA) |
| **v4** | **Harness Design** | **Planner-Generator-Evaluator + Iterative Loop** |

---

## Pipeline

```
Phase 1: Init ──────────────── Sprint Lead solo
Phase 2: Spec ──────────────── Sprint Lead as Planner
Phase 3: Prototype ─────────── Sprint Lead + Design Engineer
  ├─ 3.1~3.3 생성 + 리뷰 (approve / revise / reject)
  ├─ 3.4 PRD Amendment Extraction (revision 피드백 → 갭 역추출)
  ├─ 3.5 PRD Refinement (승인된 프로토타입 → 요구사항 추출)
  └─ 3.6 Gate
Phase 4: Build ─────────────── Iterative Loop per feature group
  ├─ 4.1 Contract  ─── Sprint Lead + Evaluator
  ├─ 4.2 Implement ─── BE/FE Engineers (parallel)
  ├─ 4.3 Merge     ─── Sprint Lead
  ├─ 4.4 Evaluate  ─── Evaluator (active)
  └─ 4.5 Fix/Accept
Phase 5: PR ────────────────── Sprint Lead solo
Phase 6: Retrospective ─────── Sprint Lead solo
  ├─ All AC fulfilled → Sprint complete
  ├─ Few deferred → --continue
  └─ Many deferred → --follow-up
```

---

## Invocation

```
/sprint <sprint-id>                              # Full pipeline (Phase 1~6)
/sprint <sprint-id> --phase=X                    # Single phase
/sprint <sprint-id> --continue                   # 이월 항목 이어서 진행
/sprint <new-id> --follow-up=<prev-id>           # 후속 스프린트
/sprint <sprint-id> --status                     # Dashboard
```

---

## Directory Structure

```
zzem-orchestrator/
├── .claude/
│   ├── skills/sprint/SKILL.md          # /sprint 운영 명세
│   └── teammates/                      # Agent 정의 (4명)
├── app-core-packages/                  # Git submodule (wrtn-tech/app-core-packages)
├── wrtn-backend/                       # Git submodule (wrtn-tech/wrtn-backend)
├── wds-tokens/                         # Git submodule (pepper/wds-tokens)
├── sprint-orchestrator/
│   ├── prototypes/
│   │   └── index.html                  # 통합 프로토타입 뷰어
│   ├── templates/                      # 아티팩트 템플릿
│   └── sprints/{sprint-id}/
│       ├── PRD.md
│       ├── sprint-config.yaml
│       ├── api-contract.yaml
│       ├── tasks/{backend,app}/*.md
│       ├── contracts/group-{N}.md
│       ├── evaluations/group-{N}.md
│       ├── prototypes/
│       │   ├── app/{task-id}/prototype.html
│       │   ├── approval-status.yaml
│       │   ├── prd-amendment.md        # Phase 3.4 산출물
│       │   └── refined-prd.md          # Phase 3.5 산출물
│       ├── retrospective/
│       ├── REPORT.md
│       └── logs/
└── docs/
    ├── prds/                           # PRD 원본
    └── designs/                        # ← 지금 읽고 있는 곳
```
