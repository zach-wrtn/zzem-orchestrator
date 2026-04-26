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
├── kb-candidates/<TICKET-ID>.yaml # Stage 5 (P0/P1 only)
├── unresolved.md               # FAILED tickets
└── retro.md                    # Retro
```

## Task Subject Naming

기존 `phase-build.md` 컨벤션과 정합. Sprint Lead가 각 Stage의 subagent 태스크를 디스패치할 때 사용:

| Stage | Subject 패턴 | Owner |
|-------|-------------|-------|
| Stage 1 Triage | `qa-triage/<sprint-id>` | Sprint Lead (self) |
| Stage 3 Contract | `qa-contract/<sprint-id>/group-<N>` | Sprint Lead → Evaluator review |
| Stage 4 Implement | `qa-fix/backend/<sprint-id>/group-<N>` | BE Engineer |
| Stage 4 Implement | `qa-fix/app/<sprint-id>/group-<N>` | FE Engineer |
| Stage 4 Evaluate | `qa-eval/<sprint-id>/group-<N>` | Evaluator |
| Stage 5 Close | `qa-close/<sprint-id>/<TICKET-ID>` | Sprint Lead (self) |

## 5-Stage Core Loop

### Stage 1: Fetch & Triage

1. Sprint Lead가 Jira fetch:
   ```
   mcp__wrtn-mcp__jira_search_issues:
     jql: <CLI 인자 또는 sprint-config.qa_fix.jql>
     fields: [summary, priority, issuetype, status, reporter, assignee, labels, components, fixVersions, created, description]
   ```

2. **Idempotency check**: 결과 ticket 중 `qa-fix/jira-comments/<key>.posted` marker 존재 = 이미 close됨. 자동 제외.

3. `qa-fix/jira-snapshot.yaml` 작성 (템플릿: `sprint-orchestrator/templates/qa-fix-jira-snapshot-template.yaml`).

   **Ticket `type` enum mapping:** The snapshot's `type` field uses a normalized enum (`Bug | UX | Perf | Copy | Other`) — not the raw Jira `issuetype.name`. Map as follows: Bug → `Bug`; Story/Task containing UI/visual concerns → `UX`; performance/load issues → `Perf`; copy/text/typo → `Copy`; everything else → `Other`. The triage and group templates use this same normalized enum.

4. **Auto-classification** — 각 티켓을 4개 버킷으로 분류:
   - **in-scope**: priority ∈ {P0, P1, P2}, status open-like, summary 명확, 동일 sprint scope 관련
   - **deferred**: priority = P3 OR scope outside this round
   - **needs-info**: description 내 repro steps 부재, 또는 핵심 정보(빌드 번호/디바이스/유저 ID) 누락
   - **duplicate**: 같은 root cause로 보이는 다른 open 티켓 발견

   **분류 휴리스틱**은 결정적이지 않다 — Sprint Lead의 판단을 명시적으로 적시. 사용자가 triage.md에서 promote/demote 가능.

5. `qa-fix/triage.md` 작성 (템플릿: `sprint-orchestrator/templates/qa-fix-triage-template.md`).

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

8. **사용자 승인 게이트**: triage.md를 사용자에게 제시. `[x] **Approved by user** — proceed to Stage 2 (Grouping)` 마커 + 타임스탬프가 채워질 때까지 대기. 사용자가 in-scope 리스트를 수정 가능 (promote/demote).

   **Approval marker semantics:** Sprint Lead detects approval by grep-ing for `[x] **Approved by user**` in `triage.md`. Once detected, the Sprint Lead fills `Approved at:` with current ISO 8601 timestamp before proceeding to Stage 2 (the user marks the checkbox; the Sprint Lead stamps the time). If the user wants to promote/demote tickets, they edit the lists directly in `triage.md` before checking the box.

### Stage 2: Grouping

승인된 in-scope 티켓을 그룹으로 묶는다.

**그룹화 기준** (우선순위 순):
1. 같은 root cause 의심 — 한 fix로 다수 해결 가능
2. 같은 BE 엔드포인트 — 계약 충돌 회피
3. 같은 화면/모듈 — UI 충돌 회피

각 그룹: 1~5개 티켓. 그룹 수가 너무 많으면(>5) 사용자에게 우선순위 그룹 N개만 진행 제안.

각 그룹마다 `qa-fix/groups/group-<N>.yaml` 작성 (템플릿: `sprint-orchestrator/templates/qa-fix-group-template.yaml`).

**Gate**: 모든 in-scope 티켓이 정확히 한 그룹에 할당되어야 함. 미할당 티켓은 deferred로 이동.

### Stage 3: Contract (그룹 단위)

**기존 Phase 4.1 재사용**. `phase-build.md` Section 4.1을 따른다.

차이점:
- Done Criteria가 "AC 충족"이 아니라 "각 ticket의 Verification Steps 통과 + Root Cause 확인"
- Verification Method에 각 티켓의 원본 repro steps를 명시
- KB 패턴 자동 주입은 동일하게 적용

저장: `qa-fix/contracts/group-<N>.md` (Phase 4.1 템플릿 그대로 사용 — `sprint-orchestrator/templates/sprint-contract-template.md`).

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
   - 템플릿: `sprint-orchestrator/templates/qa-fix-comment-template.md`
   - **Field rules**:
     - Root Cause: 1문단, "Unknown" 금지
     - Fix Summary: 1문단, diff 그대로 붙여넣기 금지
     - Verification Steps: 최소 1단계, 원본 repro와 1:1 대응
     - Evidence: PR 링크 항상 필수, 회귀/스크린샷 없으면 "N/A — <사유>" 명시
   - Evidence 일부 미충족 시 헤더에 ⚠️ 마커 추가

3. **KB 후보 추출** (priority ∈ {P0, P1}만):
   - 파일: `qa-fix/kb-candidates/<TICKET-ID>.yaml`
   - 템플릿: `sprint-orchestrator/templates/qa-fix-kb-candidate-template.yaml`
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

   **HTML comment stripping:** The local SSOT `<TICKET-ID>.md` template contains an HTML comment block (e.g., `<!-- PARTIAL EVIDENCE: ... -->`) that is for the Sprint Lead's reference only — it MUST NOT be posted to Jira. Before calling `mcp__wrtn-mcp__jira_add_comment`, strip all `<!-- ... -->` blocks (including multi-line ones) from the body. Sprint Lead is responsible for this transformation.

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
| Jira transition 실패 (코멘트는 성공) | `<TICKET-ID>.md` 보존, marker 미생성. 사용자 보고 + 다음 실행 시 자동 재시도. |

## Budget Pressure

기존 Build Loop 정책 동일 (`phase-build.md` Section "Budget Pressure Protocol"):
- 🟢 Normal — 정상 진행
- 🟡 Caution (그룹 fix loop 1회) — minor 티켓 deferred 이월 제안
- 🔴 Urgent (그룹 fix loop 2회) — 사용자에게 그룹 분할/scope 축소 제안

## Retro

모든 그룹 close 후:

1. `qa-fix/retro.md` 작성 (템플릿: `sprint-orchestrator/templates/qa-fix-retro-template.md`).

2. **Pattern Digest 자동 산출**: 처리한 모든 fix(P2/P3 포함)의 category 분포. 같은 패턴이 3회+ violated되면 "Reinforcement needed" 알림 자동 추가.

3. **KB Candidate Review** — 사용자 승인 게이트:
   - 각 후보를 표로 제시 → approve / reject / merge-into-existing
   - 승인 수가 5개 초과면 "top-N만 머지" 게이트 추가
   - 승인된 후보는 `zzem-kb:write-pattern` 호출 (각 후보의 `proposed_pattern` 필드를 그대로 입력으로 사용 — 인터페이스 정합)

   **Status transitions from Retro decisions:**
   - User selects `approve` → candidate's `status:` becomes `approved`. Sprint Lead invokes `zzem-kb:write-pattern` (flattening `proposed_pattern.*`).
   - User selects `reject` → candidate's `status:` becomes `rejected`. `review_notes:` records why.
   - User selects `merge-into:<existing-id>` → candidate's `status:` becomes `duplicate`, `related_existing_pattern:` is updated to the merge target. No `zzem-kb:write-pattern` call.
   - All decisions persist the candidate file (rejected/duplicate are kept as audit trail).

4. **Deferred Index**: deferred + needs-info + unresolved 티켓 목록.

5. **Next Round Suggestion**: deferred + 신규 P0/P1 티켓 JQL 자동 생성.

## Gate → Done

- [ ] `triage.md`에 사용자 승인 마커 존재
- [ ] 모든 in-scope 티켓이 closed(`.posted` 존재) 또는 unresolved 중 하나로 분류됨
- [ ] `retro.md` 생성 완료, KB 후보 사용자 결정 기록됨
- [ ] (dry-run이 아닐 때) 모든 closed 티켓에 대해 `<TICKET-ID>.md` + `<TICKET-ID>.posted` 둘 다 존재

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
