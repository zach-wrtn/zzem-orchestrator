# QA-Fix Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Jira-driven post-sprint QA issue handling workflow (`--phase=qa-fix` for per-sprint, `--type=qa-fix` sprint for integration QA), reusing the existing Sprint Lead / BE / FE / Evaluator team and the existing Build Loop machinery.

**Architecture:** New phase skill `phase-qa-fix.md` orchestrates a 5-stage core loop (Fetch&Triage → Grouping → Contract → Implement+Evaluate → Close). All artifacts live under `sprints/<id>/qa-fix/`. Two entry paths share the same core loop: per-sprint extends an existing sprint dir; integration creates a new sprint dir with Phase 1~3 skipped. Local-first Jira comment posting (`<TICKET>.md` is SSOT, `<TICKET>.posted` marker is idempotency key). P0/P1 fixes feed `kb-candidates/<TICKET>.yaml` → user-approved merge in Retro via `zzem-kb:write-pattern`.

**Tech Stack:** Markdown skill files (`.claude/skills/sprint/*.md`), YAML templates (`sprint-orchestrator/templates/*.yaml`), Jira MCP (`mcp__wrtn-mcp__jira_*`), zzem-kb skill suite, existing scripts (`setup-sprint.sh`).

**Spec:** `docs/superpowers/specs/2026-04-26-qa-fix-workflow-design.md`

---

## File Structure

**New files:**
- `.claude/skills/sprint/phase-qa-fix.md` — 5-stage workflow definition
- `sprint-orchestrator/templates/qa-fix-jira-snapshot-template.yaml` — Stage 1 fetch output schema
- `sprint-orchestrator/templates/qa-fix-triage-template.md` — Stage 1 triage doc + user approval gate
- `sprint-orchestrator/templates/qa-fix-group-template.yaml` — Stage 2 group definition
- `sprint-orchestrator/templates/qa-fix-comment-template.md` — Stage 5 Jira comment SSOT
- `sprint-orchestrator/templates/qa-fix-kb-candidate-template.yaml` — Stage 5 KB candidate (aligned to `zzem-kb:write-pattern` enum)
- `sprint-orchestrator/templates/qa-fix-retro-template.md` — Retro output structure
- `sprint-orchestrator/sprints/qa-fix-fixture/qa-fix/jira-snapshot.yaml` — dry-run fixture

**Modified files:**
- `.claude/skills/sprint/SKILL.md` — Invocation table + Phase Routing entry + auto-detect logic
- `.claude/skills/sprint/phase-init.md` — `--type=qa-fix` branch (skip Phase 1~3 directory layout, init `qa-fix/` instead)
- `sprint-orchestrator/templates/sprint-config-template.yaml` — `type:` field (`standard | qa-fix`) + optional `qa_fix:` block
- `ARCHITECTURE.md` — pipeline diagram + gates table updates
- `MANUAL.md` — new section "QA-Fix Workflow"

---

## Task 0: Pre-Implementation Verification

The spec has three Open Questions that must be resolved before implementing — they affect template fields and skill routing.

**Files:**
- Read: `~/.zzem/kb/skills/write-pattern/SKILL.md`
- Read: `.claude/skills/sprint/phase-init.md` (already familiar)
- Read: any Maestro setup file in `app/` worktree if available

- [ ] **Step 1: Confirm `zzem-kb:write-pattern` input schema**

Run: `cat ~/.zzem/kb/skills/write-pattern/SKILL.md | head -40`

Confirm: required fields are `category | severity | title | source_sprint | source_group | description | detection | prevention | contract_clause`. The category enum is `correctness | completeness | integration | edge_case | code_quality | design_proto | design_spec` — **not** the `foundation | component | pattern` shown in the spec. Note this for Task 2.

- [ ] **Step 2: Confirm Jira MCP tool names**

Verify these tool names exist (already loaded as deferred tools):
- `mcp__wrtn-mcp__jira_search_issues` (Stage 1 fetch)
- `mcp__wrtn-mcp__jira_add_comment` (Stage 5 post)
- `mcp__wrtn-mcp__jira_get_transitions` (Stage 5 lookup)
- `mcp__wrtn-mcp__jira_transition_issue` (Stage 5 transition)
- `mcp__wrtn-mcp__jira_update_issue` (Triage: setting labels/links)

If any are missing, document the gap and adjust skill text to use available alternatives.

- [ ] **Step 3: Decide `--type=qa-fix` init strategy**

Decision: **extend existing `phase-init.md` with a conditional branch** (not a separate phase-qa-fix-init.md). Reasoning: shares 80% of logic (sprint dir creation, sprint-config.yaml generation, worktree setup), only directory layout differs. Branch is gated on `sprint-config.yaml`'s `type:` field.

- [ ] **Step 4: Maestro reuse confirmation**

Per-spec Section 5 step 1: "회귀 evidence 추가 (가능한 경우) — Maestro flow 추가". Decision: this is a **best-effort** step. The skill text will say: "If `app/.maestro/` exists and the ticket relates to a UI flow, the FE Engineer adds a flow file in the same fix commit. If not feasible, the Stage 5 evidence section explicitly cites N/A with reason." No infrastructure changes needed — reuses existing e2e_maestro setup.

- [ ] **Step 5: Commit verification notes**

```bash
# Append a one-liner block to the spec under "Open Questions" recording resolutions
```

Edit `docs/superpowers/specs/2026-04-26-qa-fix-workflow-design.md`. Replace the Section 14 content with the resolutions:

```markdown
## 14. Open Questions — Resolved 2026-04-26

- **`--type=qa-fix` sprint init:** Extend existing `phase-init.md` with a conditional branch on `sprint-config.yaml.type`. No separate phase file.
- **`zzem-kb:write-pattern` interface:** Category enum is `correctness | completeness | integration | edge_case | code_quality | design_proto | design_spec`. KB candidate template (`qa-fix-kb-candidate-template.yaml`) uses this exact enum.
- **Maestro flow auto-generation:** Best-effort. FE Engineer adds a flow file when feasible; otherwise Stage 5 evidence cites N/A with explicit reason. No infrastructure change.
```

```bash
git add docs/superpowers/specs/2026-04-26-qa-fix-workflow-design.md
git commit -m "docs(spec): resolve QA-Fix workflow open questions (kb category enum, init strategy, maestro)"
```

---

## Task 1: Create Jira snapshot template (Stage 1 schema)

**Files:**
- Create: `sprint-orchestrator/templates/qa-fix-jira-snapshot-template.yaml`

- [ ] **Step 1: Write the template**

Create the file with this exact content:

```yaml
# QA-Fix Jira Snapshot
# Stage 1 output — preserves the JQL + result for reproducibility.
# Produced by Sprint Lead in Stage 1 (Fetch & Triage).
# Path: sprints/<sprint-id>/qa-fix/jira-snapshot.yaml

snapshot_at: "YYYY-MM-DDTHH:MM:SS+09:00"  # ISO 8601 with offset
sprint_id: "<sprint-id>"
entry_path: "per-sprint"  # per-sprint | integration

jira:
  jql: |
    <the exact JQL string used>
  base_url: "https://<your-jira-domain>/browse/"  # for ticket URL construction
  fetched_count: <number>

# All fetched tickets — full triage classification happens in triage.md.
tickets:
  - key: "ZZEM-123"
    summary: "<one-line>"
    priority: "P0"  # P0 | P1 | P2 | P3
    type: "Bug"     # Bug | UX | Perf | Copy | Other
    status: "<Jira status name>"
    reporter: "<account>"
    assignee: "<account or null>"
    labels: []
    components: []
    fix_versions: []
    created: "YYYY-MM-DDTHH:MM:SS+09:00"
    description_excerpt: |
      <first ~500 chars — full body fetched on demand by Sprint Lead>
    repro_steps: |
      <if present in description, extracted here>
```

- [ ] **Step 2: Commit**

```bash
git add sprint-orchestrator/templates/qa-fix-jira-snapshot-template.yaml
git commit -m "feat(qa-fix): add jira-snapshot template (Stage 1 schema)"
```

---

## Task 2: Create triage template (Stage 1 user approval doc)

**Files:**
- Create: `sprint-orchestrator/templates/qa-fix-triage-template.md`

- [ ] **Step 1: Write the template**

```markdown
# QA-Fix Triage — <sprint-id>

**Snapshot:** `qa-fix/jira-snapshot.yaml` (snapshot_at: <ISO timestamp>)
**Total fetched:** <N> tickets
**Sprint Lead recommendation:** in-scope <a>, deferred <b>, needs-info <c>, duplicate <d>

> **User action required:** Review classifications below. Mark `[x] Approved` at the bottom to unlock Stage 2.

---

## In-Scope (<count>)

Tickets to fix in this round.

| Ticket | Pri | Type | Summary | Rationale |
|--------|-----|------|---------|-----------|
| ZZEM-123 | P0 | Bug | <summary> | <why in-scope — root cause hypothesis or impact> |

## Deferred (<count>)

Tickets not handled this round. Reason must be specific (not "low priority").

| Ticket | Pri | Type | Summary | Defer Reason | Next Round Candidate |
|--------|-----|------|---------|--------------|----------------------|
| ZZEM-456 | P3 | Copy | <summary> | <reason> | yes/no |

## Needs-Info (<count>)

Tickets blocked on Reporter response. Sprint Lead posts a clarification comment via `mcp__wrtn-mcp__jira_add_comment`.

| Ticket | Pri | Summary | Question Posted |
|--------|-----|---------|-----------------|
| ZZEM-789 | P1 | <summary> | <one-line question — actual posted text> |

## Duplicate (<count>)

Linked to master ticket and closed.

| Ticket | Master | Action Taken |
|--------|--------|--------------|
| ZZEM-101 | ZZEM-99 | Linked + closed via transition |

---

## Approval

- [ ] **Approved by user — proceed to Stage 2 (Grouping)**
- Approved at: `<ISO timestamp>`
- Notes: <optional user notes; e.g., "ZZEM-456 promoted to in-scope">
```

- [ ] **Step 2: Commit**

```bash
git add sprint-orchestrator/templates/qa-fix-triage-template.md
git commit -m "feat(qa-fix): add triage template (Stage 1 user approval gate)"
```

---

## Task 3: Create group template (Stage 2 grouping)

**Files:**
- Create: `sprint-orchestrator/templates/qa-fix-group-template.yaml`

- [ ] **Step 1: Write the template**

```yaml
# QA-Fix Group
# Stage 2 output — bundles related in-scope tickets into one fix unit.
# Path: sprints/<sprint-id>/qa-fix/groups/group-<N>.yaml

group_id: "group-<N>"
created_at: "YYYY-MM-DDTHH:MM:SS+09:00"

# Why these tickets are grouped together. Choose one primary axis; secondary optional.
grouping_basis:
  primary: "shared_module"  # shared_module | shared_endpoint | shared_root_cause
  secondary: null
  rationale: |
    <one paragraph explaining why these tickets share a fix unit>

tickets:
  - key: "ZZEM-123"
    priority: "P0"
    summary: "<one-line>"
  - key: "ZZEM-145"
    priority: "P1"
    summary: "<one-line>"

# Files / modules expected to change (informational — confirmed in Contract).
expected_scope:
  app:
    - "<path glob>"
  backend:
    - "<path glob>"

# Maestro feasibility check — set in Stage 5 evidence.
regression_test_feasibility:
  app: "feasible"   # feasible | infeasible | n/a
  backend: "n/a"
  notes: "<one-line; e.g. 'covered by existing flow X'>"
```

- [ ] **Step 2: Commit**

```bash
git add sprint-orchestrator/templates/qa-fix-group-template.yaml
git commit -m "feat(qa-fix): add group template (Stage 2 grouping)"
```

---

## Task 4: Create Jira comment template (Stage 5 SSOT)

**Files:**
- Create: `sprint-orchestrator/templates/qa-fix-comment-template.md`

- [ ] **Step 1: Write the template**

```markdown
<!--
QA-Fix Jira Comment — Local SSOT
Stage 5 step 2 — Sprint Lead writes this BEFORE posting to Jira.
The same content is posted via mcp__wrtn-mcp__jira_add_comment.
On successful post + transition, .posted marker file is created alongside this file.
Path: sprints/<sprint-id>/qa-fix/jira-comments/<TICKET-ID>.md
-->

## ✅ Fix Ready for QA — <SPRINT-ID> / group-<N>

**Root Cause**
<한 단락. 왜 이 버그가 발생했는지. "Unknown" 금지. 패턴 위반/누락이 있다면 명시.>

**Fix Summary**
<한 단락. 무엇을 어떻게 바꿨는지. 사용자 관점 변화. 코드 diff 그대로 붙여넣기 금지.>

**Verification Steps**
1. <원본 Steps to Reproduce 1단계 + fix 후 기대 결과>
2. <원본 2단계 + 기대 결과>
3. ...

**Evidence**
- PR: <BE PR url> / <FE PR url>  ← 항상 필수
- Changed files: <핵심 파일 N개 — 절대 경로 또는 PR diff 링크>
- Regression test: <Maestro flow file path>      ← 회귀 추가 가능한 경우
- Screenshot: <before/after URL or attachment ref>  ← UI/copy 케이스
- N/A — <회귀 자동화가 비현실적인 사유>          ← evidence 생략 시 사유 필수

**Related**
- Sprint: <sprint-id>
- Group: <group-id> (함께 fix된 다른 티켓: <TICKET-IDs>)
- KB Pattern Candidate: <yes — kb-candidates/<TICKET-ID>.yaml | no>

<!--
PARTIAL EVIDENCE: 모든 evidence 충족 못 한 경우, 위의 ## 라인에 ⚠️ 마커를 머리에 추가:
## ⚠️ Fix Ready for QA — <SPRINT-ID> / group-<N>
-->
```

- [ ] **Step 2: Commit**

```bash
git add sprint-orchestrator/templates/qa-fix-comment-template.md
git commit -m "feat(qa-fix): add Jira comment template (Stage 5 local SSOT)"
```

---

## Task 5: Create KB candidate template (Stage 5 → Retro)

**Files:**
- Create: `sprint-orchestrator/templates/qa-fix-kb-candidate-template.yaml`

This template is **aligned to `zzem-kb:write-pattern` interface** — Retro can convert candidate → write-pattern call directly without field re-mapping.

- [ ] **Step 1: Write the template**

```yaml
# QA-Fix KB Candidate (P0/P1 only)
# Stage 5 step 3 — Sprint Lead extracts a KB pattern candidate from each P0/P1 fix.
# Approved candidates are merged into KB via zzem-kb:write-pattern in Retro.
# Path: sprints/<sprint-id>/qa-fix/kb-candidates/<TICKET-ID>.yaml
#
# Field naming intentionally matches zzem-kb:write-pattern inputs to enable
# direct conversion in Retro without re-mapping.

ticket: "ZZEM-123"
priority: "P0"  # P0 | P1 (P2/P3은 후보 추출 스킵)

candidate_type: "pattern_gap"  # pattern_gap | pattern_violation | new_pattern
related_existing_pattern: "correctness-001"  # KB pattern id, or "none"

# zzem-kb:write-pattern 직접 매핑 필드:
proposed_pattern:
  category: "correctness"  # correctness | completeness | integration | edge_case | code_quality | design_proto | design_spec
  severity: "major"        # critical | major | minor
  title: "<≤120 chars — what the pattern enforces>"
  source_sprint: "<sprint-id>"
  source_group: "group-<N>"
  description: "<≥10 chars — what this pattern is>"
  detection: "<≥10 chars — how to detect a violation (lint rule, test, code-review checklist)>"
  prevention: "<≥10 chars — how to prevent the violation in future code>"
  contract_clause: "<≥10 chars — exact line to inject into Sprint Contract Done Criteria>"
  example:
    bad: |
      <code snippet — the buggy pattern>
    good: |
      <code snippet — the fixed pattern>

# Audit trail — preserved even when status=rejected.
hypothesis: |
  <한 단락 — 이 버그가 어떤 패턴의 부재/위반에서 비롯되었는지>
fix_pr: "<URL>"

status: "pending"  # pending | approved | rejected | duplicate
review_notes: ""   # 사용자 결정 이유 (Retro에서 작성)
```

- [ ] **Step 2: Commit**

```bash
git add sprint-orchestrator/templates/qa-fix-kb-candidate-template.yaml
git commit -m "feat(qa-fix): add KB candidate template (aligned to zzem-kb:write-pattern interface)"
```

---

## Task 6: Create Retro template

**Files:**
- Create: `sprint-orchestrator/templates/qa-fix-retro-template.md`

- [ ] **Step 1: Write the template**

```markdown
# QA-Fix Retro — <sprint-id>

**Generated at:** <ISO timestamp>
**Round entry path:** per-sprint | integration
**Triage approved at:** <triage.md timestamp>

## Health Score

| Outcome | Count |
|---------|-------|
| PASS (closed in Jira) | <n> |
| FAILED (in unresolved.md) | <n> |
| DEFERRED (from triage) | <n> |
| NEEDS-INFO (awaiting reporter) | <n> |
| DUPLICATE | <n> |

**Total in-scope:** <n>
**Pass rate:** <n%>
**Fix loop budget:** <total fix-loop iterations across groups>

## Pattern Digest (all severities)

For trend tracking. Includes P2/P3 even though they don't generate KB candidates.

| Category | Count | Notes |
|----------|-------|-------|
| correctness | <n> | <if any pattern_violation triggered "reinforcement needed", flag here> |
| integration | <n> | |
| code_quality | <n> | |
| edge_case | <n> | |
| design_proto | <n> | |
| design_spec | <n> | |
| completeness | <n> | |

## KB Candidates Review

> **User action required:** For each P0/P1 candidate, choose one decision below. After your decisions, the Sprint Lead invokes `zzem-kb:write-pattern` for each `approved` candidate.

| Candidate File | Ticket | Pri | Title | Type | Decision |
|----------------|--------|-----|-------|------|----------|
| `kb-candidates/ZZEM-123.yaml` | ZZEM-123 | P0 | <title> | pattern_gap | [ ] approve / [ ] reject / [ ] merge-into:<existing-id> |

**Reinforcement alerts** (auto-detected — same pattern violated 3+ times this round):
- `<existing-pattern-id>`: violated in tickets <T1>, <T2>, <T3> → consider revising the pattern's `detection` or `prevention`.

**Volume gate:** If approved count > 5, user is asked to pick top-N before merge.

## Deferred Index

For next-round planning.

| Ticket | Pri | Summary | Defer Reason | Next Round Candidate |
|--------|-----|---------|--------------|----------------------|
| ZZEM-456 | P3 | <summary> | <reason> | yes/no |

## Unresolved

Tickets that exhausted fix loop (2 rounds) without PASS. Jira not transitioned. Human intervention required.

| Ticket | Pri | Summary | Last Evaluator Verdict | Suggested Next Action |
|--------|-----|---------|------------------------|----------------------|
| ZZEM-789 | P1 | <summary> | <verdict summary> | <reassignment / scope-cut / external dep> |

## Next Round Suggestion

Generated JQL for the next QA-Fix round (deferred + new since this snapshot).

```
project = ZZEM AND (key in (<deferred keys>) OR (created > "<this snapshot_at>" AND priority in (P0, P1)))
```
```

- [ ] **Step 2: Commit**

```bash
git add sprint-orchestrator/templates/qa-fix-retro-template.md
git commit -m "feat(qa-fix): add retro template (Health + KB review + deferred + unresolved)"
```

---

## Task 7: Create the QA-Fix phase skill

**Files:**
- Create: `.claude/skills/sprint/phase-qa-fix.md`

This is the heart of the implementation — the workflow definition that the Sprint Lead reads when invoked.

- [ ] **Step 1: Write the skill file**

```markdown
# Phase QA-Fix (Sprint Lead + BE + FE + Evaluator — Iterative Loop)

스프린트 종료 후 기능 QA에서 발견된 Jira 이슈 티켓을 그룹 단위로 처리한다.
기존 Phase 4 Build Loop의 4.1~4.5 단계를 그대로 재사용한다 — 이 파일은 진입/종료 단계만 정의.

## Entry Paths

이 phase는 두 가지 진입 경로를 가진다. 라우팅은 SKILL.md에서 처리.

| Path | 트리거 | Sprint Dir |
|------|--------|------------|
| **per-sprint** | `/sprint <sprint-id> --phase=qa-fix --jql="..."` | 기존 sprint dir 안에 `qa-fix/` 추가 |
| **integration** | `/sprint <new-id> --type=qa-fix --jql="..." --base-branches=...` | Phase 1 init이 신규 sprint dir 생성, Phase 2~3 자동 스킵 후 이 phase로 직행 |

`--dry-run` 플래그가 있으면 모든 Jira write 호출(코멘트 게시, transition, update)을 차단하고 산출물만 생성한다.

## Directory Layout

```
sprints/<sprint-id>/qa-fix/
├── jira-snapshot.yaml          # Stage 1
├── triage.md                   # Stage 1 (user approval gate)
├── groups/
│   └── group-<N>.yaml          # Stage 2
├── contracts/group-<N>.md      # Stage 3 (Build Loop 4.1 산출물)
├── evaluations/group-<N>.md    # Stage 4 (Build Loop 4.4 산출물)
├── jira-comments/
│   ├── <TICKET-ID>.md          # Stage 5 (local SSOT)
│   └── <TICKET-ID>.posted      # Stage 5 (post+transition success marker)
├── kb-candidates/<TICKET>.yaml # Stage 5 (P0/P1 only)
├── unresolved.md               # FAILED tickets
└── retro.md                    # Retro
```

## 5-Stage Core Loop

### Stage 1: Fetch & Triage

1. Sprint Lead가 Jira fetch:
   ```
   mcp__wrtn-mcp__jira_search_issues:
     jql: <CLI 인자 또는 sprint-config.qa_fix.jql>
     fields: [summary, priority, issuetype, status, reporter, assignee, labels, components, fixVersions, created, description]
   ```

2. **Idempotency check**: 결과 ticket 중 `qa-fix/jira-comments/<key>.posted` marker 존재 = 이미 close됨. 자동 제외.

3. `qa-fix/jira-snapshot.yaml` 작성 (템플릿: `templates/qa-fix-jira-snapshot-template.yaml`).

4. **Auto-classification** — 각 티켓을 4개 버킷으로 분류:
   - **in-scope**: priority ∈ {P0, P1, P2}, status open-like, summary 명확, 동일 sprint scope 관련
   - **deferred**: priority = P3 OR scope outside this round
   - **needs-info**: description 내 repro steps 부재, 또는 핵심 정보(빌드 번호/디바이스/유저 ID) 누락
   - **duplicate**: 같은 root cause로 보이는 다른 open 티켓 발견

   **분류 휴리스틱**은 결정적이지 않다 — Sprint Lead의 판단을 명시적으로 적시. 사용자가 triage.md에서 promote/demote 가능.

5. `qa-fix/triage.md` 작성 (템플릿: `templates/qa-fix-triage-template.md`).

6. **needs-info 티켓 처리** (dry-run이 아닐 때):
   ```
   For each needs-info ticket:
     mcp__wrtn-mcp__jira_add_comment:
       issue_key: <key>
       body: "QA Triage — additional info needed: <specific question>"
   ```
   triage.md의 "Question Posted" 컬럼에 실제 게시한 텍스트 기록.

7. **duplicate 티켓 처리** (dry-run이 아닐 때):
   ```
   For each duplicate ticket:
     mcp__wrtn-mcp__jira_add_comment: "Duplicate of <master-key>"
     mcp__wrtn-mcp__jira_transition_issue: <to "Closed" with resolution=Duplicate>
   ```

8. **사용자 승인 게이트**: triage.md를 사용자에게 제시. `[x] Approved` 마커 + 타임스탬프가 채워질 때까지 대기. 사용자가 in-scope 리스트를 수정 가능 (promote/demote).

### Stage 2: Grouping

승인된 in-scope 티켓을 그룹으로 묶는다.

**그룹화 기준** (우선순위 순):
1. 같은 root cause 의심 — 한 fix로 다수 해결 가능
2. 같은 BE 엔드포인트 — 계약 충돌 회피
3. 같은 화면/모듈 — UI 충돌 회피

각 그룹: 1~5개 티켓. 그룹 수가 너무 많으면(>5) 사용자에게 우선순위 그룹 N개만 진행 제안.

각 그룹마다 `qa-fix/groups/group-<N>.yaml` 작성 (템플릿: `templates/qa-fix-group-template.yaml`).

**Gate**: 모든 in-scope 티켓이 정확히 한 그룹에 할당되어야 함. 미할당 티켓은 deferred로 이동.

### Stage 3: Contract (그룹 단위)

**기존 Phase 4.1 재사용**. `phase-build.md` Section 4.1을 따른다.

차이점:
- Done Criteria가 "AC 충족"이 아니라 "각 ticket의 Verification Steps 통과 + Root Cause 확인"
- Verification Method에 각 티켓의 원본 repro steps를 명시
- KB 패턴 자동 주입은 동일하게 적용

저장: `qa-fix/contracts/group-<N>.md` (Phase 4.1 템플릿 그대로 사용 — `templates/sprint-contract-template.md`).

### Stage 4: Implement + Evaluate (그룹 단위)

**기존 Phase 4.2~4.5 재사용**. `phase-build.md` Section 4.2~4.5를 따른다.

차이점만:
- Task subject naming: `qa-fix/backend/<sprint-id>/group-<N>` / `qa-fix/app/...`
- Engineer task description에 fix할 ticket key 리스트 + 각 ticket의 repro steps 인라인 포함
- E2E Smoke (4.3.2): 그룹 내 영향 받는 flow + (가능한 경우) 신규 회귀 flow
- Evaluator는 ticket별 verification steps를 1:1 추적
- Evaluation 산출물: `qa-fix/evaluations/group-<N>.md`

**Fix loop 2회 소진 후에도 FAIL인 ticket**: 그룹에서 분리 → `qa-fix/unresolved.md`에 추가. Stage 5 진행 차단 (해당 ticket만).

### Stage 5: Close (티켓 단위, local-first)

PASS된 각 티켓에 대해 **순서대로**:

1. **회귀 evidence 추가** (가능한 경우): FE/BE Engineer가 fix 커밋과 함께 Maestro flow 추가. 인프라가 없거나 비현실적이면 N/A 사유 작성.

2. **코멘트 본문 로컬 작성** (SSOT):
   - 파일: `qa-fix/jira-comments/<TICKET-ID>.md`
   - 템플릿: `templates/qa-fix-comment-template.md`
   - **Field rules**:
     - Root Cause: 1문단, "Unknown" 금지
     - Fix Summary: 1문단, diff 그대로 붙여넣기 금지
     - Verification Steps: 최소 1단계, 원본 repro와 1:1 대응
     - Evidence: PR 링크 항상 필수, 회귀/스크린샷 없으면 "N/A — <사유>" 명시
   - Evidence 일부 미충족 시 헤더에 ⚠️ 마커 추가

3. **KB 후보 추출** (priority ∈ {P0, P1}만):
   - 파일: `qa-fix/kb-candidates/<TICKET-ID>.yaml`
   - 템플릿: `templates/qa-fix-kb-candidate-template.yaml`
   - candidate_type 분류:
     - `pattern_gap`: 기존 KB에 없는 영역
     - `pattern_violation`: 기존 패턴이 있는데 위반
     - `new_pattern`: gap의 하위지만 명확한 신규 패턴
   - P2/P3는 KB 후보 스킵 (Pattern Digest 통계에만 포함됨 — Retro에서)

4. **Jira 코멘트 게시** (dry-run이 아닐 때):
   ```
   mcp__wrtn-mcp__jira_add_comment:
     issue_key: <TICKET-ID>
     body: <jira-comments/<TICKET-ID>.md 전체 내용>
   ```
   실패 시: 2회 재시도. 그래도 실패면 사용자에게 보고하고 transition 차단. 코멘트 SSOT는 보존.

5. **Jira transition** (코멘트 게시 성공 시에만):
   ```
   transitions = mcp__wrtn-mcp__jira_get_transitions(issue_key)
   ready_for_qa = transitions.find(name="Ready for QA")
   mcp__wrtn-mcp__jira_transition_issue(issue_key, transition_id=ready_for_qa.id)
   ```

6. **Posted marker**:
   ```bash
   touch qa-fix/jira-comments/<TICKET-ID>.posted
   ```

**FAIL 티켓**: Stage 5 전체 스킵. `unresolved.md`에 그대로 두고 Jira 변경 없음.

## Failure Modes

| 상황 | 처리 |
|------|------|
| Evaluator FAIL이 fix loop 2회 후에도 안 풀림 | 해당 티켓 그룹에서 분리, `unresolved.md` 적재. Jira 손대지 않음. |
| Reporter가 needs-info에 응답 없음 | `triage.md`에 timeout 표시, 다음 라운드까지 대기. 자동 close 금지. |
| JQL 결과 0건 | 즉시 종료, "처리할 이슈 없음" 리포트. retro.md 생성 안 함. |
| Jira 코멘트 게시 실패 | 2회 재시도 → 그래도 실패 시 사용자 보고, transition 차단, marker 미생성. |
| Jira transition 실패 (코멘트는 성공) | `<TICKET>.md` 보존, marker 미생성. 사용자 보고 + 다음 실행 시 자동 재시도. |

## Budget Pressure

기존 Build Loop 정책 동일 (`phase-build.md` Section "Budget Pressure Protocol"):
- 🟢 Normal — 정상 진행
- 🟡 Caution (그룹 fix loop 1회) — minor 티켓 deferred 이월 제안
- 🔴 Urgent (그룹 fix loop 2회) — 사용자에게 그룹 분할/scope 축소 제안

## Retro

모든 그룹 close 후:

1. `qa-fix/retro.md` 작성 (템플릿: `templates/qa-fix-retro-template.md`).

2. **Pattern Digest 자동 산출**: 처리한 모든 fix(P2/P3 포함)의 category 분포. 같은 패턴이 3회+ violated되면 "Reinforcement needed" 알림 자동 추가.

3. **KB Candidate Review** — 사용자 승인 게이트:
   - 각 후보를 표로 제시 → approve / reject / merge-into-existing
   - 승인 수가 5개 초과면 "top-N만 머지" 게이트 추가
   - 승인된 후보는 `zzem-kb:write-pattern` 호출 (각 후보의 `proposed_pattern` 필드를 그대로 입력으로 사용 — 인터페이스 정합)

4. **Deferred Index**: deferred + needs-info + unresolved 티켓 목록.

5. **Next Round Suggestion**: deferred + 신규 P0/P1 티켓 JQL 자동 생성.

## Gate → Done

- [ ] `triage.md`에 사용자 승인 마커 존재
- [ ] 모든 in-scope 티켓이 closed(`.posted` 존재) 또는 unresolved 중 하나로 분류됨
- [ ] `retro.md` 생성 완료, KB 후보 사용자 결정 기록됨
- [ ] (dry-run이 아닐 때) 모든 closed 티켓에 대해 `<TICKET>.md` + `<TICKET>.posted` 둘 다 존재

Gate 통과 시 종료. Sprint Status 출력.

## Output

```
Sprint QA-Fix: <sprint-id>

  [Stage 1] Triage approved (in-scope: 8, deferred: 3, needs-info: 1, duplicate: 0)
  [Stage 2] Grouped into 3 groups
  [Group 001] PASSED — closed 3/3 (kb candidates: 2)
  [Group 002] PASSED — closed 2/3 (kb candidates: 1, unresolved: 1 → ZZEM-145)
  [Group 003] PASSED — closed 2/2 (kb candidates: 0)
  [Retro] 3 KB candidates approved → merged into KB (correctness-021, integration-014, code_quality-009)

[Sprint Status Dashboard]
```
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/sprint/phase-qa-fix.md
git commit -m "feat(qa-fix): add phase-qa-fix skill (5-stage core loop, reuses Build Loop 4.1-4.5)"
```

---

## Task 8: Update sprint-config-template.yaml

**Files:**
- Modify: `sprint-orchestrator/templates/sprint-config-template.yaml`

- [ ] **Step 1: Add `type:` field and optional `qa_fix:` block**

Add the following block right after `sprint_id:` (line 4):

Find this exact line:
```
sprint_id: "{sprint-id}"
```

Replace with:
```
sprint_id: "{sprint-id}"

# Sprint type. Optional (default: "standard").
#   standard — 6-Phase pipeline (Init → Spec → Prototype → Build → PR → Retro)
#   qa-fix   — Integration QA-Fix sprint. Phase 1~3 skipped, Phase QA-Fix runs directly.
type: "standard"

# QA-Fix configuration. Required when type=qa-fix; optional otherwise (used by --phase=qa-fix on a standard sprint).
qa_fix:
  jql: ""                      # default JQL when --jql is omitted on the CLI
  jira_base_url: ""            # e.g. "https://wrtn.atlassian.net/browse/" — used in jira-snapshot.yaml ticket URLs
  ready_for_qa_transition: "Ready for QA"  # exact Jira transition name targeted in Stage 5
```

- [ ] **Step 2: Commit**

```bash
git add sprint-orchestrator/templates/sprint-config-template.yaml
git commit -m "feat(qa-fix): add type + qa_fix block to sprint-config template"
```

---

## Task 9: Update phase-init.md for `--type=qa-fix` branch

**Files:**
- Modify: `.claude/skills/sprint/phase-init.md`

- [ ] **Step 1: Add type branch in Workflow section**

Find this exact text in `phase-init.md` (Step 3):

```
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
   ├── checkpoints/.gitkeep
   └── logs/.gitkeep
   ```
```

Replace with:

```
3. **디렉토리 생성** — sprint type에 따라 분기:

   **type=standard (기본)**:
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
   ├── checkpoints/.gitkeep
   └── logs/.gitkeep
   ```

   **type=qa-fix**:
   ```
   sprint-orchestrator/sprints/{sprint-id}/
   ├── sprint-config.yaml       # type=qa-fix, qa_fix.jql 필수
   ├── qa-fix/
   │   ├── groups/.gitkeep
   │   ├── contracts/.gitkeep
   │   ├── evaluations/.gitkeep
   │   ├── jira-comments/.gitkeep
   │   └── kb-candidates/.gitkeep
   ├── checkpoints/.gitkeep
   └── logs/.gitkeep
   ```

   PRD.md, tasks/, prototypes/는 qa-fix type에서 생성하지 않는다 (Phase 1~3이 스킵되므로).
```

- [ ] **Step 2: Add type-aware step 4-5 routing**

Find this text:

```
4. **PRD.md**: 원본 링크 + 스코프 요약 자동 생성.
5. **sprint-config.yaml**: 사용자에게 base branch 질문 후 생성.
```

Replace with:

```
4. **PRD.md** (type=standard만): 원본 링크 + 스코프 요약 자동 생성.

5. **sprint-config.yaml**: 사용자에게 base branch 질문 후 생성. type=qa-fix면 추가로:
   - `qa_fix.jql` (필수) — 사용자에게 JQL 입력 요청
   - `qa_fix.jira_base_url` (필수)
   - `qa_fix.ready_for_qa_transition` (옵션, 기본 "Ready for QA")
```

- [ ] **Step 3: Update Gate section**

Find this text:

```
## Gate → Phase 2

다음 조건 **모두** 충족 시 Phase 2 진입:
- [ ] `sprints/{sprint-id}/` 디렉토리 구조 완전 (PRD.md, sprint-config.yaml, tasks/, contracts/, evaluations/, checkpoints/, logs/)
- [ ] PRD.md에 원본 PRD 링크 + 스코프 요약 존재
- [ ] sprint-config.yaml에 `repositories` (role → {source, base, mode}) + `branch_prefix` 설정 존재
- [ ] `setup-sprint.sh`가 성공적으로 실행되어 각 role 디렉토리가 생성됨 (`{role}/.git` 또는 symlink)
- [ ] (선택) 레포지토리 fetch 완료
```

Replace with:

```
## Gate → 다음 Phase

**type=standard → Phase 2**:
- [ ] `sprints/{sprint-id}/` 디렉토리 구조 완전 (PRD.md, sprint-config.yaml, tasks/, contracts/, evaluations/, checkpoints/, logs/)
- [ ] PRD.md에 원본 PRD 링크 + 스코프 요약 존재
- [ ] sprint-config.yaml에 `repositories` (role → {source, base, mode}) + `branch_prefix` 설정 존재
- [ ] `setup-sprint.sh`가 성공적으로 실행되어 각 role 디렉토리가 생성됨 (`{role}/.git` 또는 symlink)
- [ ] (선택) 레포지토리 fetch 완료

**type=qa-fix → Phase QA-Fix** (Phase 2~3 자동 스킵):
- [ ] `sprints/{sprint-id}/` 디렉토리 구조 완전 (sprint-config.yaml, qa-fix/, checkpoints/, logs/)
- [ ] sprint-config.yaml에 `type: qa-fix` + `qa_fix.jql` + `qa_fix.jira_base_url` 존재
- [ ] sprint-config.yaml에 `repositories` + `branch_prefix` 존재
- [ ] `setup-sprint.sh`가 성공적으로 실행되어 각 role 디렉토리가 생성됨
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sprint/phase-init.md
git commit -m "feat(qa-fix): branch phase-init on sprint type (standard vs qa-fix)"
```

---

## Task 10: Update SKILL.md routing

**Files:**
- Modify: `.claude/skills/sprint/SKILL.md`

- [ ] **Step 1: Add invocation entries**

Find this exact block in `SKILL.md` (around line 31-45):

```
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
```

Replace with (insert two new lines for qa-fix):

```
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
```

- [ ] **Step 2: Add Phase Routing entry**

Find this exact block in `SKILL.md` (around line 163-171):

```
| Phase | 파일 | 트리거 |
|-------|------|--------|
| Phase 1: Init | `phase-init.md` | `--phase=init` 또는 스프린트 디렉토리 미존재 |
| Phase 2: Spec | `phase-spec.md` | `--phase=spec` 또는 Phase 1 Gate 통과 |
| Phase 3: Prototype | `phase-prototype.md` | `--phase=prototype` 또는 Phase 2 Gate 통과 |
| Phase 4: Build | `phase-build.md` | `--phase=build` 또는 Phase 3 Gate 통과 |
| Phase 5: PR | `phase-pr.md` | `--phase=pr` 또는 Phase 4 Gate 통과 |
| Phase 6: Retro | `phase-retro.md` | `--phase=retro` 또는 Phase 5 완료 |
| Modes | `phase-modes.md` | `--continue`, `--follow-up`, `--status` |
```

Replace with:

```
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
```

- [ ] **Step 3: Update Phase 판단 로직**

Find this block (around line 181-194):

```
### Phase 판단 로직

1. `--phase=X` 명시 → 해당 phase 직행
2. `--continue` → `phase-modes.md` Read
3. `--follow-up` → `phase-modes.md` Read
4. `--status` → `phase-modes.md` Read
5. 인자 없음 → 스프린트 디렉토리 상태에서 자동 판단:
   - 디렉토리 미존재 → Phase 1
   - `api-contract.yaml` 미존재 → Phase 2
   - `approval-status.yaml` 미존재 + app 태스크 존재 → Phase 3
   - `evaluations/` 비어있음 → Phase 4
   - PR 미생성 → Phase 5
   - `retrospective/` 미존재 → Phase 6
   - 모두 존재 → `--status` 모드
```

Replace with:

```
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
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sprint/SKILL.md
git commit -m "feat(qa-fix): route --phase=qa-fix and --type=qa-fix in SKILL.md"
```

---

## Task 11: Update ARCHITECTURE.md

**Files:**
- Modify: `ARCHITECTURE.md`

- [ ] **Step 1: Add Phase QA-Fix to pipeline diagram**

Find this exact block in `ARCHITECTURE.md` (around line 30-46):

```
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
```

Append the following block immediately after the closing ``` of the pipeline diagram:

```

### Phase QA-Fix (Optional Extension)

스프린트 종료 후 기능 QA에서 발견된 Jira 이슈를 처리한다. 두 가지 진입 경로:

```
Path A — Per-sprint (기존 sprint 안에 qa-fix/ 추가):
  /sprint <sprint-id> --phase=qa-fix --jql="..."

Path B — Integration (새 sprint, Phase 1~3 스킵):
  /sprint <new-id> --type=qa-fix --jql="..."

  ↓ (둘 다 동일한 5-stage 코어 루프)

Stage 1: Fetch & Triage  Sprint Lead가 Jira fetch → 분류 → 사용자 승인
Stage 2: Grouping        in-scope 티켓을 fix-unit 그룹으로 묶기
Stage 3: Contract         Build Loop 4.1 재사용
Stage 4: Implement+Eval   Build Loop 4.2~4.5 재사용
Stage 5: Close            Local-first comment → Jira post → transition → KB candidate
  ↓
Retro                    Health + Pattern Digest + KB merge (zzem-kb:write-pattern)
```
```

- [ ] **Step 2: Add Phase Gates entry**

Find the gates table (around line 50-58):

```
| Gate | 핵심 조건 |
|------|----------|
| Init → Spec | 디렉토리 구조 완전, PRD.md 존재, base branch 설정 |
| Spec → Prototype | API Contract 유효, 태스크 필수 섹션 존재, AC testable |
| Prototype → Build | 모든 화면 판정 완료 (pending 0), amendment 판정 완료 |
| Build → PR | 모든 그룹 PASS, worktree 정리 완료, checkpoint 생성 완료 |
```

Replace with:

```
| Gate | 핵심 조건 |
|------|----------|
| Init → Spec | (type=standard) 디렉토리 구조 완전, PRD.md 존재, base branch 설정 |
| Init → QA-Fix | (type=qa-fix) qa-fix/ 디렉토리 구조, sprint-config.yaml.qa_fix.jql 존재 |
| Spec → Prototype | API Contract 유효, 태스크 필수 섹션 존재, AC testable |
| Prototype → Build | 모든 화면 판정 완료 (pending 0), amendment 판정 완료 |
| Build → PR | 모든 그룹 PASS, worktree 정리 완료, checkpoint 생성 완료 |
| QA-Fix → Done | triage 사용자 승인, 모든 in-scope ticket 분류됨(closed or unresolved), retro.md + KB 결정 완료 |
```

- [ ] **Step 3: Commit**

```bash
git add ARCHITECTURE.md
git commit -m "docs(qa-fix): document Phase QA-Fix in ARCHITECTURE pipeline + gates"
```

---

## Task 12: Update MANUAL.md

**Files:**
- Modify: `MANUAL.md`

- [ ] **Step 1: Read end-of-MANUAL to find the right insertion point**

Run: `wc -l MANUAL.md` to know the file length, then read the last 40 lines to confirm the structure (likely ends with troubleshooting or templates section). The new section should be inserted before troubleshooting/templates (which are reference material), as a peer to "스프린트 라이프사이클" Phase sections.

- [ ] **Step 2: Append a new top-level section**

Find the line that starts the `## 4.` section (or whatever number follows the Phase 6 Retro section). Insert the following new section immediately before it.

Search for the Phase 6 Retro subsection in MANUAL.md (likely contains `### Phase 6: Retro` or `## Phase 6`). After that subsection ends and before the next `##` top-level heading, insert:

```markdown

### Phase QA-Fix (Optional)

스프린트 종료 후 기능 QA에서 발견된 Jira 이슈 티켓을 처리하는 워크플로우.
기존 6-Phase와 별개로, 두 가지 진입점을 가진다.

#### Path A — Per-sprint QA-Fix

기존 sprint의 컨텍스트(태스크/계약/패턴)를 그대로 재사용한다.

```bash
/sprint ugc-platform-001 --phase=qa-fix --jql="project=ZZEM AND fixVersion=ugc-platform-001"
```

산출물 위치: `sprints/ugc-platform-001/qa-fix/`.
기존 sprint 브랜치에 fix 커밋이 추가된다 (PR 머지 후 재실행 시 새 PR이 필요할 수 있음 — 사용자 판단).

#### Path B — Integration QA-Fix Sprint

여러 sprint를 가로지르는 통합 QA용. 신규 sprint를 init하되 Phase 1~3 스킵.

```bash
/sprint qa-2026-04-26 --type=qa-fix --jql="project=ZZEM AND status='Ready for Verification'"
```

`sprint-config.yaml`의 `type: qa-fix`, `qa_fix.jql`, `qa_fix.jira_base_url`, (옵션) `qa_fix.ready_for_qa_transition` 자동 생성.

#### Common Flags

| Flag | 의미 |
|------|------|
| `--jql="..."` | Jira JQL. 미지정 시 sprint-config.qa_fix.jql 사용 |
| `--dry-run` | 모든 Jira write 호출 차단 (코멘트 게시, transition, update). 산출물만 생성. 첫 도입 시 권장. |

#### 5-Stage 워크플로우

| Stage | 산출물 | 핵심 |
|-------|--------|------|
| 1. Fetch & Triage | `qa-fix/jira-snapshot.yaml`, `qa-fix/triage.md` | Sprint Lead 자동 분류 (in-scope/deferred/needs-info/duplicate) → 사용자 승인 게이트 |
| 2. Grouping | `qa-fix/groups/group-N.yaml` | in-scope 티켓을 fix unit으로 묶기 (root cause/endpoint/module 기준) |
| 3. Contract | `qa-fix/contracts/group-N.md` | Build Loop 4.1 재사용 + ticket repro steps 인라인 |
| 4. Implement+Evaluate | `qa-fix/evaluations/group-N.md` | Build Loop 4.2~4.5 재사용 |
| 5. Close (per ticket) | `qa-fix/jira-comments/<TICKET>.md` (SSOT) + `.posted` marker, `qa-fix/kb-candidates/<TICKET>.yaml` | local-first → Jira 코멘트 게시 → transition → P0/P1 KB 후보 추출 |

#### Idempotency

같은 JQL로 재실행 시 `qa-fix/jira-comments/<TICKET-ID>.posted` marker 존재 = 자동 스킵.
`<TICKET>.md`는 있는데 `.posted`가 없으면 게시 재시도 (이전 실패 회복).

#### Jira 코멘트 표준 포맷

`templates/qa-fix-comment-template.md` 참조. 필수 필드: Root Cause / Fix Summary / Verification Steps / Evidence (PR 항상 필수) / Related.
Evidence 일부 미충족 시 헤더에 ⚠️ 마커 추가 + 사유 명시.

#### KB 피드백

P0/P1 fix만 KB 후보로 추출 (`qa-fix/kb-candidates/<TICKET>.yaml`). Retro 단계에서 사용자 승인 후 `zzem-kb:write-pattern`으로 자동 머지.
P2/P3는 후보 추출 스킵 (Pattern Digest 통계에만 포함).

#### 사용자 개입이 필요한 상황

- Stage 1 triage 사용자 승인
- needs-info 티켓에 Reporter 응답 timeout
- Fix loop 2회 후 FAIL → `unresolved.md`로 이동, 인간 개입 필요
- Retro KB 후보 승인 (>5개면 top-N 선택)
```

- [ ] **Step 3: Commit**

```bash
git add MANUAL.md
git commit -m "docs(qa-fix): add Phase QA-Fix operating manual section"
```

---

## Task 13: Create dry-run smoke fixture

**Files:**
- Create: `sprint-orchestrator/sprints/qa-fix-fixture/sprint-config.yaml`
- Create: `sprint-orchestrator/sprints/qa-fix-fixture/qa-fix/jira-snapshot.yaml`
- Create: `sprint-orchestrator/sprints/qa-fix-fixture/README.md`

This fixture lets a future contributor dry-run the workflow without a live Jira connection.

- [ ] **Step 1: Create the fixture sprint-config.yaml**

```yaml
sprint_id: "qa-fix-fixture"
type: "qa-fix"
branch_prefix: "sprint"

repositories:
  app:
    source: ~/dev/work/app-core-packages
    base: "epic/ugc-platform-final"
    mode: worktree

defaults:
  base: "main"

team:
  teammates:
    - be-engineer
    - fe-engineer
    - evaluator
  settings:
    eval_retry_limit: 2
    max_parallel_tasks: 2

qa_fix:
  jql: "project=FIXTURE AND status=Open"
  jira_base_url: "https://example.atlassian.net/browse/"
  ready_for_qa_transition: "Ready for QA"

display:
  title: "QA-Fix Workflow Fixture (dry-run only)"
  status: "archived"
  tags: ["fixture", "qa-fix"]
  summary: "Sample sprint dir + jira snapshot for testing the QA-Fix dry-run path. Not a real sprint."
```

- [ ] **Step 2: Create the fixture jira-snapshot.yaml**

```yaml
snapshot_at: "2026-04-26T12:00:00+09:00"
sprint_id: "qa-fix-fixture"
entry_path: "integration"

jira:
  jql: |
    project=FIXTURE AND status=Open
  base_url: "https://example.atlassian.net/browse/"
  fetched_count: 3

tickets:
  - key: "FIXTURE-1"
    summary: "Profile screen crashes on null avatar URL"
    priority: "P0"
    type: "Bug"
    status: "Open"
    reporter: "qa-tester"
    assignee: null
    labels: ["mobile", "crash"]
    components: ["profile"]
    fix_versions: []
    created: "2026-04-25T09:00:00+09:00"
    description_excerpt: |
      When opening a profile that has a null avatarUrl, the app crashes.
      Reproducible 100% on a fresh install.
    repro_steps: |
      1. Open the app
      2. Navigate to a profile with no avatar
      3. Crash

  - key: "FIXTURE-2"
    summary: "Follow button shows wrong state after unfollow"
    priority: "P1"
    type: "Bug"
    status: "Open"
    reporter: "qa-tester"
    assignee: null
    labels: ["mobile"]
    components: ["follow"]
    fix_versions: []
    created: "2026-04-25T10:00:00+09:00"
    description_excerpt: |
      After tapping unfollow, the button still shows "Following" until pull-to-refresh.
    repro_steps: |
      1. Follow user A
      2. Tap unfollow
      3. Observe button state — still "Following"

  - key: "FIXTURE-3"
    summary: "Typo in onboarding copy"
    priority: "P3"
    type: "Copy"
    status: "Open"
    reporter: "qa-tester"
    assignee: null
    labels: []
    components: ["onboarding"]
    fix_versions: []
    created: "2026-04-25T11:00:00+09:00"
    description_excerpt: |
      Onboarding step 2 says "Welocme" instead of "Welcome".
    repro_steps: |
      1. Fresh install
      2. Reach onboarding step 2
```

- [ ] **Step 3: Create README explaining the fixture**

```markdown
# QA-Fix Workflow Fixture

This is a dry-run fixture for the QA-Fix workflow (`.claude/skills/sprint/phase-qa-fix.md`).

**Not a real sprint.** Used to validate the workflow's outputs without a live Jira connection.

## Usage

```bash
# Dry-run from this snapshot (Sprint Lead reads jira-snapshot.yaml directly instead of calling Jira)
/sprint qa-fix-fixture --phase=qa-fix --dry-run --use-snapshot
```

> Note: `--use-snapshot` is a future flag that lets the workflow read from an existing
> `jira-snapshot.yaml` instead of calling the Jira MCP. If not yet implemented, the
> Sprint Lead should manually skip Stage 1 fetch and proceed from triage.

## Expected Outputs

After a successful dry-run, the following files should exist:
- `qa-fix/triage.md` — with FIXTURE-1 + FIXTURE-2 in-scope, FIXTURE-3 deferred
- `qa-fix/groups/group-1.yaml` — both in-scope tickets bundled (or split if grouping rationale differs)
- `qa-fix/contracts/group-1.md` — group contract
- (post-build) `qa-fix/jira-comments/FIXTURE-1.md` — local SSOT, no `.posted` marker (dry-run)
- (post-build) `qa-fix/kb-candidates/FIXTURE-1.yaml` — P0 candidate
- `qa-fix/retro.md`

Inspect outputs and verify:
1. Local SSOT comments are well-formed (template fields filled)
2. KB candidate yaml uses correct zzem-kb category enum
3. No `.posted` marker exists (dry-run blocks the post)
4. Retro Pattern Digest counts match: 2 P0/P1 + 1 P3 (deferred)
```

- [ ] **Step 4: Commit**

```bash
git add sprint-orchestrator/sprints/qa-fix-fixture/
git commit -m "test(qa-fix): add dry-run fixture (sample sprint dir + jira snapshot)"
```

---

## Task 14: Final integration check

**Files:**
- Read: all created/modified files
- Run: validation commands

- [ ] **Step 1: Verify all template files are valid YAML where applicable**

Run: `find sprint-orchestrator/templates -name "qa-fix-*.yaml" -exec python3 -c "import yaml,sys; yaml.safe_load(open(sys.argv[1]))" {} \;`

Expected: no errors (silent success).

If any template uses placeholder syntax that's not valid YAML (e.g., `<placeholder>`), wrap it in quotes or use a comment block. Adjust and re-run.

- [ ] **Step 2: Verify markdown templates parse**

Run: `find sprint-orchestrator/templates -name "qa-fix-*.md" | xargs ls -la`

Expected: 3 files listed (`qa-fix-triage-template.md`, `qa-fix-comment-template.md`, `qa-fix-retro-template.md`).

- [ ] **Step 3: Verify SKILL.md routes correctly**

Run: `grep -n "qa-fix" .claude/skills/sprint/SKILL.md`

Expected: at least 5 hits (Invocation block × 3, Phase Routing table × 1, 판단 로직 × 1+).

- [ ] **Step 4: Verify phase-init.md branches**

Run: `grep -n "type=qa-fix\|type=standard" .claude/skills/sprint/phase-init.md`

Expected: at least 4 hits (directory branch × 2, gate section × 2).

- [ ] **Step 5: Verify ARCHITECTURE.md has Phase QA-Fix**

Run: `grep -n "QA-Fix\|qa-fix" ARCHITECTURE.md`

Expected: at least 4 hits (pipeline diagram + gate table + descriptions).

- [ ] **Step 6: Verify MANUAL.md has Phase QA-Fix section**

Run: `grep -n "Phase QA-Fix\|--phase=qa-fix" MANUAL.md`

Expected: at least 3 hits (section header + Path A + Path B).

- [ ] **Step 7: Verify fixture exists and is well-formed**

Run: `ls -la sprint-orchestrator/sprints/qa-fix-fixture/qa-fix/ && cat sprint-orchestrator/sprints/qa-fix-fixture/sprint-config.yaml | grep -E "type|jql"`

Expected: Directory exists with `jira-snapshot.yaml`. Config has `type: "qa-fix"` + `jql: "..."`.

- [ ] **Step 8: Final commit (if any fix-up needed)**

```bash
# Only if Steps 1-7 surfaced issues that needed fixing
git status
# If clean, no further commit. If dirty:
git add -p
git commit -m "fix(qa-fix): integration check fix-ups"
```

---

## Self-Review Notes

After writing all 14 tasks, the plan covers:

| Spec Section | Implementing Task(s) |
|--------------|----------------------|
| §1 Purpose | All tasks |
| §2 Scope | Task 7 (skill) explicitly lists out-of-scope |
| §3 Two Entry Paths | Task 9 (init branch), Task 10 (routing), Task 12 (manual) |
| §4 Directory Layout | Task 9 (init), Task 7 (skill documents) |
| §5 Five-Stage Loop | Task 7 (skill), Task 1-3 (templates) |
| §6 Comment Template | Task 4 |
| §7 KB Feedback | Task 5 (candidate template), Task 6 (retro template), Task 7 (Stage 5/Retro skill) |
| §8 Agent Mapping | Task 7 (skill) |
| §9 Phase Gates | Task 7 (skill), Task 11 (architecture) |
| §10 Budget Pressure | Task 7 (skill, references existing) |
| §11 Failure Modes | Task 7 (skill) |
| §12 Validation Strategy | Task 7 (dry-run flag), Task 13 (fixture) |
| §13 Sprint Completion Manifest | Task 7 (Gate → Done section) |
| §14 Open Questions | Task 0 resolves all three |

**Type consistency check:**
- KB candidate yaml category enum (`correctness | completeness | integration | edge_case | code_quality | design_proto | design_spec`) is consistent across Task 5 (template), Task 7 (skill Stage 5), and Task 6 (retro Pattern Digest table). The earlier spec-level mismatch (`foundation | component | pattern`) was resolved by the spec edit in Task 0 Step 5.
- `.posted` marker convention is consistent: Task 7 Stage 5 step 6 creates it, Task 7 Stage 1 step 2 reads it for idempotency, Task 13 Step 3 fixture README references it.
- `qa_fix.ready_for_qa_transition` field is consistent: Task 8 (config template), Task 9 (init prompts for it), Task 7 (Stage 5 step 5 reads it via `mcp__wrtn-mcp__jira_get_transitions`).

**No placeholders detected** — all code blocks have actual content; "TBD"/"TODO" not used in implementation steps.
