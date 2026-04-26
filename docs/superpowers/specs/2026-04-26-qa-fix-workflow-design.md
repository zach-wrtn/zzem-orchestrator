# QA-Fix Workflow Design

**Date:** 2026-04-26
**Status:** Draft (pending user review)
**Branch:** `chore/add-qa-workflow`

---

## 1. Purpose

스프린트 종료 후 기능 QA에서 발견된 Jira 이슈 티켓을 처리·개선하는 워크플로우를 추가한다. 기존 Planner-Generator-Evaluator 시스템 위에서 동작하며, 별도 에이전트 없이 기존 Sprint Lead / BE Engineer / FE Engineer / Evaluator 팀을 재사용한다.

## 2. Scope

### In Scope
- Jira에서 fetch한 QA 이슈 티켓을 in-scope/deferred/needs-info/duplicate로 트리어지
- 그룹 단위로 fix → Evaluator PASS → Jira 코멘트 + transition
- P0/P1 fix는 KB 후보로 자동 추출, Retro에서 사용자 승인 후 머지
- 회귀 evidence(Maestro) 자동 첨부 (가능한 경우)

### Out of Scope (YAGNI)
- Jira 외 트래커 어댑터 (현재 Jira로 단일화)
- Design Engineer를 통한 UI redesign — fix-grade 변경만 다룸
- 자동 priority 재설정 (Reporter 권한)
- Cross-sprint 의존성 그래프 (그룹 단위로 충분)

## 3. Two Entry Paths

워크플로우는 두 가지 진입점을 가지며, 동일한 5-stage 코어 루프를 공유한다.

### Path A — Per-sprint QA-Fix (Phase 7 확장)

```bash
/sprint <sprint-id> --phase=qa-fix --jql="project=ZZEM AND fixVersion=<sprint-id>"
```

- 기존 sprint 디렉토리/브랜치 안에서 실행
- 그 sprint의 컨텍스트(태스크/계약/패턴)를 그대로 재사용
- Phase 6 Retro 직후 또는 별도 시점 어느 쪽이든 가능
- 산출물 위치: `sprints/<sprint-id>/qa-fix/`

### Path B — Integration QA-Fix sprint (신규 sprint type)

```bash
/sprint qa-<yyyy-mm-dd> --type=qa-fix --jql="<자유 JQL>" --base-branches=<be>,<fe>
```

- 새 sprint 디렉토리를 init하되 **Phase 1~3 (Init/Spec/Prototype) 스킵**
- 여러 sprint를 가로지르는 통합 fix용
- 산출물 위치: 새 sprint 루트 (`sprints/<new-id>/qa-fix/`)

### Common (코어)

- Jira JQL이 입력 SSOT
- 모든 산출물은 `qa-fix/` 서브디렉토리에 격리
- 동일한 5-stage 코어 루프

## 4. Directory Layout

```
sprints/<sprint-id>/qa-fix/
├── jira-snapshot.yaml          # JQL + 결과 (재현성)
├── triage.md                   # Sprint Lead 분류 + 사용자 승인 기록
├── groups/
│   ├── group-1.yaml            # ticket-id 리스트 + 그룹 목적
│   └── group-N.yaml
├── contracts/
│   └── group-N.md              # 합의된 Done Criteria
├── evaluations/
│   └── group-N.md              # Evaluator 산출물
├── jira-comments/
│   ├── <TICKET-ID>.md          # 코멘트 본문 (로컬 SSOT)
│   └── <TICKET-ID>.posted      # 게시+transition 완료 marker (빈 파일)
├── kb-candidates/
│   └── <TICKET-ID>.yaml        # P0/P1 KB 후보
├── unresolved.md               # 2회 fix 후에도 FAIL한 티켓
└── retro.md                    # Health Score + KB 머지 결정 + Deferred Index
```

## 5. Five-Stage Core Loop

### Stage 1: Fetch & Triage

1. Sprint Lead가 Jira MCP (`mcp__wrtn-mcp__jira_search_issues`)로 JQL 실행 → `jira-snapshot.yaml` 저장 (재현성 보존)
2. Sprint Lead가 각 티켓을 자동 분류:
   - **in-scope** — 이번 라운드에 fix
   - **deferred** — 처리 안 함, deferred index에 적재
   - **needs-info** — Reporter에게 코멘트로 자동 질의 (`mcp__wrtn-mcp__jira_add_comment`)
   - **duplicate** — 마스터 티켓에 링크 + close
3. `triage.md` 생성 → **사용자 승인 게이트** (in-scope 리스트 확정)

### Stage 2: Grouping

in-scope 티켓을 그룹으로 묶음. 그룹 기준:
- 같은 화면/모듈 (UI 충돌 회피)
- 같은 BE 엔드포인트 (계약 충돌 회피)
- 같은 root cause 의심군 (한 번의 fix로 다수 해결 가능)

산출: `groups/group-N.yaml` — ticket-id 리스트 + 그룹 목적.

### Stage 3: Contract (그룹 단위)

기존 Phase 4.1 재사용:
- 그룹의 모든 티켓에 대한 Done Criteria + Verification Method 합의
- Evaluator 리뷰 (최대 3 round)
- 산출: `contracts/group-N.md`

### Stage 4: Implement + Evaluate (그룹 단위)

기존 Phase 4.2~4.5 재사용:
- 4.2 Implement: BE/FE 병렬 구현 (worktree)
- 4.3 Merge: sprint 브랜치에 `--no-ff`
- 4.4 Evaluate: Active Evaluation
- 4.5 Fix Loop (최대 2회)

### Stage 5: Close (티켓 단위)

Evaluator PASS된 각 티켓에 대해 순서대로 (local-first):

1. **회귀 evidence 추가** (가능한 경우) — Maestro flow 추가
2. **코멘트 본문 로컬 작성** — `jira-comments/<TICKET-ID>.md` (표준 템플릿 — 섹션 6). 이 파일이 SSOT.
3. **KB 후보 추출** — P0/P1만, `kb-candidates/<TICKET-ID>.yaml` (섹션 7)
4. **Jira 코멘트 게시** — 로컬 파일 내용을 `mcp__wrtn-mcp__jira_add_comment`로 전송
5. **Jira transition** — 코멘트 게시 성공 시에만 `mcp__wrtn-mcp__jira_transition_issue`로 "Ready for QA"
6. **Posted marker 기록** — `jira-comments/<TICKET-ID>.posted` 빈 파일 생성 (transition까지 성공한 티켓 표식)

**순서 강제 이유:**
- 로컬 SSOT 우선 — Jira API 실패 시에도 콘텐츠는 보존, 동일 입력으로 재시도 가능
- 코멘트 게시 실패 시 transition 차단 (Jira transition은 되돌리기 어려움)
- `.posted` marker는 idempotency 판정 기준 (섹션 12)

## 6. Jira Comment Template

QA 재검증 신뢰성은 코멘트 품질이 좌우한다. 매 fix마다 동일 포맷으로 강제.

```markdown
## ✅ Fix Ready for QA — <SPRINT-ID> / group-<N>

**Root Cause**
<한 단락. 왜 이 버그가 발생했는지. 패턴 위반/누락이 있다면 명시.>

**Fix Summary**
<한 단락. 무엇을 어떻게 바꿨는지. 사용자 관점 변화.>

**Verification Steps**
1. <Reproduce 단계 — 원본 Steps to Reproduce 그대로 + fix 후 기대 결과>
2. ...
3. ...

**Evidence**
- PR: <BE PR url> / <FE PR url>
- Changed files: <핵심 파일 N개 링크>
- Regression test: <Maestro flow file path>     ← 회귀 추가 가능한 경우
- Screenshot: <before/after>                    ← UI/copy 케이스
- N/A — <회귀 자동화가 비현실적인 사유>          ← evidence 생략 시 사유 필수

**Related**
- Sprint: <sprint-id>
- Group: <group-id> (함께 fix된 다른 티켓: <TICKET-IDs>)
- KB Pattern Candidate: <yes/no — yes면 후보 파일 경로>
```

### Field Rules

| 필드 | 규칙 |
|------|------|
| Root Cause | 1문단 필수. "Unknown" 금지. |
| Fix Summary | 1문단 필수. 코드 diff 그대로 붙여넣기 금지 (요약). |
| Verification Steps | 최소 1단계. 원본 repro와 1:1 대응. |
| Evidence | 최소 1개 — PR 링크 항상 필수. 회귀/스크린샷 없으면 사유 필수. |
| Related | sprint-id, group-id 자동 채움. |

### Transition Policy

- 모든 evidence 충족 → **Ready for QA**
- evidence 일부만 (사유 명시) → **Ready for QA** + 코멘트 머리에 ⚠️ 마커
- Evaluator FAIL → **transition 없음**, `unresolved.md`로 이동

## 7. KB Feedback Loop

**원칙:** fix 시점 후보 누적 (P0/P1만) → Retro에서 사용자 승인 일괄 머지.

### KB 후보 형식 (`kb-candidates/<TICKET-ID>.yaml`)

```yaml
ticket: ZZEM-123
priority: P0
candidate_type: pattern_gap | pattern_violation | new_pattern
related_existing_pattern: <KB ID 또는 "none">
hypothesis: |
  이 버그는 어떤 패턴의 부재/위반인가? 한 단락.
proposed_pattern:
  category: <foundation | component | pattern>
  title: <후보 제목>
  rule: <한 문장 — 무엇을 항상/절대 해야 하는가>
  rationale: <왜 — 이 버그 + 다른 가능 케이스>
  source_evidence:
    - sprint: <sprint-id>
    - ticket: ZZEM-123
    - fix_pr: <url>
status: pending  # pending | approved | rejected | duplicate
```

### Candidate Types

| 타입 | 의미 | 예시 |
|------|------|------|
| `pattern_gap` | 기존 KB에 없는 영역 — 새 패턴 필요 | "Empty state copy 가이드 없음" |
| `pattern_violation` | 기존 패턴이 있는데 위반 | "Modal pattern은 backdrop dismiss 필요한데 미적용" |
| `new_pattern` | gap의 하위지만 명확한 신규 패턴 | "Nickname sort: created_at desc tiebreaker" |

### Retro Stage

`retro.md`:
- **Health Score** — PASS / FAIL / DEFERRED 카운트
- **Pattern Digest** — 처리한 모든 fix의 카테고리 분포 (P2/P3 포함, 트렌드 추적)
- **KB Candidates Review** — 사용자 승인 게이트
  - 각 후보를 표로 제시 → approve / reject / merge-into-existing
  - approved 후보는 `zzem-kb` 표준 포맷으로 자동 변환
  - 사용자 최종 확인 후 `zzem-kb:write`로 머지
- **Deferred Index** — deferred + needs-info + unresolved 티켓 모음
- **Next Round Suggestion** — deferred 중 다음 라운드 후보

### Noise Guards

- **P2/P3은 KB 후보 추출 스킵** — Pattern Digest 통계에만 포함
- **같은 패턴에서 `pattern_violation` 3회+ 발생** → "Pattern reinforcement needed" 알림
- **후보 5개 초과** → 사용자에게 "한 라운드 너무 많음, top-N만 머지하시겠습니까?" 게이트

## 8. Agent Team Mapping

기존 팀 그대로 재사용 — **신규 에이전트 없음**.

| Agent | QA-Fix 워크플로우에서의 역할 |
|-------|------------------------------|
| Sprint Lead | Triage 분류, Grouping, KB 후보 추출, Jira 코멘트/transition 게시, Retro |
| BE Engineer | 그룹별 backend fix (worktree) |
| FE Engineer | 그룹별 app fix (worktree) |
| Evaluator | 그룹 Contract 리뷰, 4.4 Active Evaluation, 회귀 케이스 충분성 판정 |
| Design Engineer | **사용 안 함** — fix-grade가 prototype-grade가 아님 |

### Task Subject Naming

| Stage | Subject 패턴 |
|-------|-------------|
| Triage | `qa-triage/<sprint-id>` |
| Contract | `qa-contract/<sprint-id>/group-<N>` |
| Implement | `qa-fix/backend/<sprint-id>/group-<N>` / `qa-fix/app/...` |
| Evaluate | `qa-eval/<sprint-id>/group-<N>` |
| Close | `qa-close/<sprint-id>/<TICKET-ID>` |

## 9. Phase Gates

기존 게이트 패턴(ARCHITECTURE.md)을 따른다.

| Gate | 핵심 조건 |
|------|----------|
| Fetch → Triage | `jira-snapshot.yaml` 존재, JQL 결과 ≥ 1 |
| Triage → Group | `triage.md`에 사용자 승인 마커, in-scope ≥ 1 |
| Group → Contract | `groups/*.yaml` 모두 ticket-id 비어있지 않음 |
| Contract → Implement | 그룹별 contract 합의 완료 (Evaluator approved) |
| Implement → Close | 그룹 PASS 또는 fix loop 2회 소진 (FAIL은 unresolved로) |
| Close → Retro | 모든 in-scope 티켓이 closed/unresolved 중 하나로 분류됨 |
| Retro → Done | `retro.md` 생성, KB 후보 사용자 결정 완료 |

## 10. Budget Pressure (그룹 단위)

기존 Build Loop 정책 동일 적용:
- 🟢 **Normal** — 정상 진행
- 🟡 **Caution** (그룹 fix loop 1회 진입) — minor 티켓을 deferred로 이월하자고 제안
- 🔴 **Urgent** (그룹 fix loop 2회 진입) — 사용자에게 그룹 분할 또는 scope 축소 제안

## 11. Failure Modes

| 실패 모드 | 처리 |
|----------|------|
| Evaluator FAIL이 fix loop 2회 후에도 안 풀림 | 해당 티켓을 그룹에서 분리, `unresolved.md`에 적재. Jira는 손대지 않음 (인간 개입 필요). |
| Reporter가 needs-info에 응답 없음 | `triage.md`에 timeout 표시, 다음 라운드까지 대기. |
| JQL 결과 0건 | Sprint Lead 즉시 종료, "처리할 이슈 없음" 리포트. |
| Jira 코멘트 게시 실패 | transition 차단, 재시도. 2회 실패 시 사용자에게 보고. |

## 12. Validation Strategy

워크플로우 자체에 대한 검증:

1. **Dry-run 모드** — `--dry-run` 플래그. Jira 호출은 read-only, 트랜지션/코멘트 게시 안 함, 모든 산출물만 생성. 신규 워크플로우 검증용.
2. **Idempotency** — 같은 JQL로 재실행 시 이미 closed 티켓은 자동 스킵 (`jira-comments/<TICKET-ID>.posted` marker 존재 여부로 판정). `.md`만 있고 `.posted`가 없으면 게시 재시도.
3. **Rollback 정책** — Jira transition은 되돌리기 어려우므로, Stage 5는 항상 "코멘트 게시 → transition" 순서. 코멘트 실패 시 transition 차단.
4. **First-run validation** — 첫 도입은 작은 JQL (P0 1~2건)로 시작 권장.

## 13. Sprint Completion Manifest

워크플로우 종료 시 다음 산출물이 모두 존재해야 함:

```
qa-fix/
├── jira-snapshot.yaml          ✓ 항상
├── triage.md                   ✓ 항상 (사용자 승인 마커 포함)
├── groups/group-N.yaml         ✓ in-scope 그룹 수만큼
├── contracts/group-N.md        ✓ 그룹 수만큼
├── evaluations/group-N.md      ✓ 그룹 수만큼
├── jira-comments/<TICKET>.md   ✓ closed 티켓 수만큼 (로컬 SSOT)
├── jira-comments/<TICKET>.posted ✓ 게시+transition 완료한 티켓 수만큼
├── kb-candidates/<TICKET>.yaml ✓ P0/P1 closed 티켓 수만큼
├── unresolved.md               ✓ FAIL 티켓이 1개 이상이면
└── retro.md                    ✓ 항상
```

## 14. Open Questions — Resolved 2026-04-26

- **`--type=qa-fix` sprint init:** Extend existing `phase-init.md` with a conditional branch on `sprint-config.yaml.type`. No separate phase file.
- **`zzem-kb:write-pattern` interface:** Category enum is `correctness | completeness | integration | edge_case | code_quality | design_proto | design_spec`. KB candidate template (`qa-fix-kb-candidate-template.yaml`) uses this exact enum.
- **Maestro flow auto-generation:** Best-effort. FE Engineer adds a flow file when feasible; otherwise Stage 5 evidence cites N/A with explicit reason. No infrastructure change.

---

**참조:**
- `ARCHITECTURE.md` — 기존 6-Phase Pipeline 및 Agent Team
- `MANUAL.md` — Phase별 운영 매뉴얼
- `docs/prds/ugc-platform-integration-qa-2.md` — 기존 통합 QA 사례 (heavy 6-phase 방식)
- `~/.claude/projects/-Users-zachryu-dev-work-zzem-orchestrator/memory/reference_knowledge_base.md` — zzem-kb 스킬 인터페이스
