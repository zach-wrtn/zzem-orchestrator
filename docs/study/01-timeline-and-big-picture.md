# 회차 1 — 타임라인 + 시스템 큰 그림

> "어떻게 19일 만에 6-Phase 파이프라인 + Knowledge Base + QA-Fix 까지 정착했는가"

**범위**: 2026-04-08 (inception) ~ 2026-04-27 (현재). 본 회차 의 목적은 두 가지 — (1) 현재 시스템의 30,000 ft 큰 그림을 이해, (2) 어떤 결정들이 모양을 결정했는지 (inflection points) 식별. 세부 메커니즘 (KB 작동 방식 / prototype pipeline 의 pass 들 / self-improving 의 rubric 승격) 은 회차 2~5 에서 다룸.

---

## TL;DR (5 문장 요약)

1. 시스템의 **6-Phase 골격은 inception 시점부터 완성된 형태로 이식**되었다 — Anthropic 의 "Harness Design for Long-Running Agentic Applications" 패턴을 그대로 채택.
2. 5 가지 **inflection point** (심볼링크화, role-config 일반화, KB standalone repo, Pass 6 anti-slop, QA-Fix orchestration) 가 시스템 모양을 결정.
3. 모든 inflection 의 trigger 는 **운영 마찰** (스프린트 실행 중 발견된 bug / 비효율) → **plan 작성** → **다음 스프린트에서 dogfood** 의 사이클.
4. 학술 / 엔지니어링 reference (Hermes Agent / Reflexion / Voyager / AWM / DSPy MIPRO) 는 inception 부터 의도적으로 직조되어 system prompt 가 아닌 skill `.md` 에 패턴화되어 있음.
5. 4 월 25 일 하루에 14 개 plan 이 동시에 land 한 "batch day" 가 v2 pipeline 의 정점 — 이 날 이후 시스템이 안정 단계 진입.

---

## 1. 시스템의 큰 그림 (현재 — 2026-04-27)

```
                  Sprint Lead (Main Agent — Planner + Orchestrator)
                                   │
            ┌──────────────────────┼──────────────────────┐
            ↓                      ↓                      ↓
       BE Engineer          FE Engineer          Design Engineer       Evaluator
       (Generator)          (Generator)          (Generator)           (Independent)
            │                      │                      │                   │
            └──── 병렬 worktree ────┘                      │                   │
                                                          │                   │
                                                  HTML Prototype          Active Eval
                                                                         (Read-only)

  Phases:  1 Init → 2 Spec → 3 Prototype → 4 Build (×N groups) → 5 PR → 6 Retro
                                                                            │
                                                                 (옵션) Phase QA-Fix ─→ KB 누적
```

핵심 자산:
- **`.claude/skills/sprint/SKILL.md` + `phase-*.md`** — 실행 프로토콜 (skill-native, system prompt 외부)
- **`.claude/teammates/*.md`** — 4 역할의 행동 정의
- **`sprint-orchestrator/sprints/{sprint-id}/`** — 스프린트 인스턴스 (PRD / contracts / evaluations / prototypes / retrospective / REPORT)
- **`zach-wrtn/knowledge-base` (standalone repo)** — 누적되는 patterns / rubrics / reflections (learning axis) + product PRD / events (products axis)
- **`sprint-gallery/` (Astro)** — 프로토타입 + foundations / components / patterns 의 브라우징 UI (`/system/`)

---

## 2. 진화 타임라인 (4 시기)

### 시기 A — Inception (2026-04-08 ~ 09)

- **2026-04-08**: ARCHITECTURE.md / MANUAL.md / phase-*.md 일괄 생성. 6-Phase 골격이 day 1 부터 fully specified — 점진적 발견이 아니라 "Harness Design" 패턴의 **이식**.
- **2026-04-08 hermes-enhancement plan** 이 5 가지 패턴 (Budget Pressure, Frozen Snapshot, Self-Improving Nudge, PTC 2-Phase, Cross-Session KB) 을 동시 도입. 이 5 패턴은 후속 회차의 모든 진화의 토대.
- **2026-04-09**: ai-webtoon 첫 스프린트 시작 (메모리 기록의 "v4 reset" 시점).

**학습 포인트**: skill-native (`.md` 파일 = 행동) 설계 덕에 외부 런타임 / 별도 서버가 없음. 모든 행동이 git 에 기록됨.

### 시기 B — 기반 견고화 (2026-04-13 ~ 21)

| 날짜 | 도입 | 영향 |
|------|------|------|
| 04-13 | Sprint Monitor (hook + JSONL + dashboard) | 관찰 가능성 — 첫 run loop 가 시각화 |
| 04-13 | **Submodule → Symlink 이전** (Inflection #1) | 스프린트 중 stale 코드 문제 해결. teammate 가 upstream 을 실시간 봄 |
| 04-15 | **Orchestrator Generalization** (Inflection #2) | ZZEM-specific hardcoded path → role-based config (`backend/`, `app/`, `tokens/`). git worktree 로 isolation. 비-ZZEM 프로젝트에 이식 가능 |
| 04-15 | Sprint Gallery 첫 도입 | 프로토타입 시각 archive — 다음 스프린트의 reference 자료가 됨 |
| 04-18 | **KB → standalone repo `zach-wrtn/knowledge-base`** (Inflection #3) | 파일 기반 KB → git-backed 영속 저장 + JSON Schema 검증 + skill 게이트 (`zzem-kb:*`). 처음으로 cross-session memory 가 진짜로 작동 |
| 04-19 | KB Phase 1.1 hotfix — `zzem-kb:promote-rubric` | retro §6.7a 가 pattern → contract clause 로 escalation. retrospective 가 actionable 해짐 |
| 04-21 | **KB two-axis 재구성** | `learning/` (자기개선) + `products/` (제품 PRD/events) 분리. KB 가 self-improvement 도구에서 product context 관리도구로 확장 |

### 시기 C — Pipeline v2 시대 (2026-04-23 ~ 25)

- **04-23 Design System v2**: 단일 `component-patterns.md` → 3 Astro Zod MDX 컬렉션 (foundations / components / patterns) + `/system/` 시각 렌더러. **Frontmatter 가 SSOT** — 산문 본문은 보조. 이 변화로 디자인 시스템이 **agent-consumable structured data** 로 격상.
- **04-24 Prototype Pipeline Upgrade** (Inflection #4): Pass 6 anti-slop audit (10 체크) + Assumption Preview (`*.intent.md`) + verify-prototype Playwright 스모크 테스트 + Asset Layer 4-phase 구조. **프로토타입이 "AI slop" 위험을 통과해야만 저장됨.**
- **04-25 — The Batch Day**: 하루에 14 개 plan land. 핵심:
  - 7 archetype enum + persona 룰 (`feed | detail | onboarding | form | modal | empty_state | nav_list`)
  - Variants mode (Conservative / Expressive / Minimal 평행 생성)
  - Curated Exemplars (다음 스프린트 DE 의 Frozen Snapshot 에 자동 인라인)
  - DE archetype 자가 재분류 프로토콜
  - Persona 예외 clauses (form instant_save, modal picker, detail blocked variant, empty_state PRD copy 충돌)
  - DE eval harness (frozen baseline + ANTHROPIC_API_KEY workflow)
  - verify-prototype CLICK_SELECTORS 확장
- **04-25 첫 라이브 dogfood** — `ugc-platform-integration-qa-2` 스프린트가 v2 pipeline 의 first user. 23 prototypes 에서 Pass 6 99.1% / persona 4/4 91% 측정.

### 시기 D — QA-Fix 시대 (2026-04-26 ~ 27)

- **04-26 Phase QA-Fix** (Inflection #5): 사후 Jira 처리가 "post-sprint afterthought" → **first-class orchestrated phase**. 5-stage core loop (Fetch & Triage → Grouping → Contract → Implement+Eval → Close) 이 Build Loop 인프라 재사용. P0/P1 fix 만 KB 후보 추출 → `zzem-kb:write-pattern` 자동 머지.
- **04-27 (오늘)**: ARCHITECTURE.md / MANUAL.md / SKILL.md 에 QA-Fix 흐름 명문화 + audit sweep 으로 stale ref 정리 (`scripts/setup.sh`, `design-tokens/`, archetype enum 6→7, DESIGN.md fallback path).

---

## 3. 5 Inflection Points (왜 그렇게 결정했는가)

| # | 시점 | 결정 | Trigger | 시스템 변화 |
|---|------|------|---------|-----------|
| 1 | 04-13 | submodule → symlink | 스프린트 중 upstream stale 코드 트랩 | teammate 가 실시간 upstream 을 봄. DE 프로토타입 워크플로우가 비로소 viable |
| 2 | 04-15 | role-config + git worktree | 멀티-프로젝트 일반화 + 병렬 스프린트 격리 필요 | system 이 비-ZZEM 으로 이식 가능. 스프린트별 worktree (HEAD 공유 없음) |
| 3 | 04-18 | KB 를 standalone git repo + skill gate | cross-session pattern 재사용 욕구 + 파일 기반 proto 가 안 끔 | patterns / rubrics / reflections 가 영속 / 공유 / 검색 가능. retro §6.7a 가 KB 로 escalation |
| 4 | 04-24 | Pass 6 anti-slop + Assumption Preview + verify-prototype 도입 | ugc-platform 시리즈 dogfood 에서 design variance 너무 큼 | Phase 3 가 unvetted HTML → 검증된 quality contract 형태로 이전. 프로토타입이 testable |
| 5 | 04-26 | Phase QA-Fix 를 core loop 으로 흡수 | 운영 QA 에서 carryover 누적 + KB pattern mining 욕구 | QA 가 orchestrated / KB-connected. 이슈 → 패턴 → contract clause 의 자동 흐름 완성 |

**공통 패턴**: 모든 inflection 이 "스프린트 중 발견된 운영 마찰 → plan 으로 명문화 → 다음 스프린트에서 dogfood → 정착" 의 사이클. 이 패턴 자체가 시스템의 self-improving 메커니즘 (회차 4 에서 깊이 다룸).

---

## 4. 학술 / 엔지니어링 reference 의 적용 위치

| 출처 | 적용 위치 |
|------|-----------|
| **Hermes Agent (Nous Research)** — IterationBudget, frozen snapshot, PTC, self-improving skills | Phase 4 Build Loop 의 Budget Pressure, Phase 3 의 Frozen Snapshot, Phase 6 의 KB nudge |
| **Reflexion (Shinn 2023)** | Phase 6 §6.7d 의 1-page reflection (자연어 회고) |
| **Voyager (Wang 2023) / AWM (Wang 2024)** | Skill Library 보류 항목 (회차 5 — gating criteria 미달) |
| **ExpeL (Zhao 2024)** | Cross-task insight 추출 (회차 5 — 스프린트 5+ 누적 후 검토) |
| **DSPy MIPRO / OPRO** | Prompt 자동 최적화 — Prototype 한정 도입 검토 (회차 5) |
| **Anthropic "Harness Design"** | 6-Phase 파이프라인의 골격 |
| **Anthropic Claude Code Skills + Memory tool** | skill-native `.md` 행동 정의, auto-memory `~/.claude/projects/` |

핵심 — **system prompt 가 아닌 skill 의 `.md` 안에 모든 학술 패턴을 직조**. 외부 런타임 / 별도 서비스 없이 git + Claude Code 로 작동.

---

## 5. 더 읽을 자료 (이 회차 의 사료들)

깊이 들어가고 싶을 때:

- **시기 A**: `docs/superpowers/plans/2026-04-08-hermes-enhancement.md` — 5 패턴 도입 계획서 (가장 중요한 1 차 사료)
- **시기 B**:
  - `docs/superpowers/plans/2026-04-13-submodule-to-symlink-migration.md`
  - `docs/superpowers/plans/2026-04-15-orchestrator-generalization.md`
  - `docs/superpowers/plans/2026-04-18-knowledge-base-platform-phase1.md` + `specs/2026-04-18-knowledge-base-platform-phase1-design.md`
- **시기 C**:
  - `docs/superpowers/plans/2026-04-23-design-system-v2.md` + 동명 spec
  - `docs/superpowers/plans/2026-04-24-prototype-pipeline-upgrade.md` (Pass 6 시초)
  - `docs/superpowers/plans/2026-04-25-curated-exemplars.md` / `2026-04-25-screen-archetype-persona.md` / `2026-04-25-variants-by-default.md` 등 batch day plan 들
- **시기 D**: `docs/superpowers/plans/2026-04-26-qa-fix-workflow.md` + `specs/2026-04-26-qa-fix-workflow-design.md`
- **현재 상태 SSOT**: `ARCHITECTURE.md`, `MANUAL.md`, `.claude/skills/sprint/SKILL.md`
- **운영 결과**: `sprint-orchestrator/sprints/{ai-webtoon|free-tab-diversification|ugc-platform-001|ugc-platform-002|ugc-platform-003}/REPORT.md` — 각 스프린트의 retrospective 가 다음 inflection 의 trigger

---

## 6. 다음 회차 예고 — Knowledge Base 진화

회차 2 에서는 KB 의 진화를 단독으로 깊이 다룸:

- 파일 기반 (`sprint-orchestrator/knowledge-base/`) → standalone repo 로 이전한 동기 (Phase 1 design)
- two-axis 재구성 (`learning/` + `products/`) 의 trade-off
- `zzem-kb:*` 8 스킬의 역할 분담 (read / write-pattern / update-pattern / promote-rubric / write-reflection / sync / sync-prds-from-notion / sync-active-prds)
- Phase 별 KB 라이프사이클 (Phase 2 search → Phase 4.1 자동 주입 → Phase 4.4 rubric load → Phase 6 write-back)
- frequency / last_seen 기반 자동 archive 룰
- Notion 동기화의 두 단계 (notion-prds.yaml snapshot + active-prds 본문 미러)

준비되면 **"회차 2 진행해 줘"** 로 트리거 — `02-knowledge-base-evolution.md` 가 이어서 작성됨.
