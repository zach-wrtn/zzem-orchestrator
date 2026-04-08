# Sprint Modes: --continue, --follow-up, --status

---

## --continue Mode (같은 스프린트 이어서 진행)

이전에 완료된 스프린트에서 미충족 항목만 이어서 처리한다.

### Prerequisites

- `retrospective/` 디렉토리 존재 (Phase 6 완료 필수)
- `deferred-items.yaml`에 1건 이상 항목 존재
- sprint 브랜치가 유효한 상태

### Workflow

```
/sprint {sprint-id} --continue

1. retrospective/deferred-items.yaml 읽기
2. 이월 항목을 새 그룹으로 구성 (기존 마지막 그룹 번호 + 1부터)
3. 이월 항목의 원본 태스크 spec 읽기
4. Evaluator 피드백 + suggested_approach 반영하여 태스크 spec 갱신
5. Phase 4 (Build) 루프 재진입 — 새 그룹부터 시작
   ├─ 4.1 Contract (이전 실패 원인 + 보강된 검증 방법 포함)
   ├─ 4.2 Implement
   ├─ 4.3 Merge (기존 sprint 브랜치에 추가 머지)
   ├─ 4.4 Evaluate
   └─ 4.5 Fix/Accept
6. 완료 후: 기존 PR에 추가 커밋 push 또는 새 PR 생성 (사용자 선택)
7. Phase 6 재실행 (gap-analysis 갱신)
```

### Contract 보강

`--continue`의 Sprint Contract에는 이전 실패 컨텍스트를 포함한다:

```markdown
# Sprint Contract: Group {N} (Continuation)

## Prior Context
- Original group: group-{M}
- Prior attempts: {N}
- Root cause: {from deferred-items.yaml}
- Evaluator feedback: {핵심 피드백 요약}

## Revised Approach
- {suggested_approach from deferred-items.yaml}

## Done Criteria
- [ ] {보강된 기준 1}
- [ ] {보강된 기준 2}
- [ ] Regression: 이전 그룹 구현 사항 영향 없음

## Verification Method
- {이전 실패를 반복하지 않기 위한 구체적 검증 방법}
```

### Output
```
Sprint Continue: {sprint-id}
  Deferred items: {N}
  New groups: {N} (group-{M+1} ~ group-{M+K})

  Entering Phase 4: Build (continuation)
```

---

## --follow-up Mode (후속 스프린트)

이전 스프린트의 Retrospective 산출물을 기반으로 새 스프린트를 생성한다.

### Invocation

```
/sprint {new-sprint-id} --follow-up={prev-sprint-id}
```

### Prerequisites

- 이전 스프린트의 `retrospective/` 디렉토리 존재
- 이전 스프린트의 `deferred-items.yaml` 또는 사용자 추가 요구사항 존재

### Workflow

#### Phase 1: Init (확장)

기존 Init에 다음을 추가:

```
1. 이전 스프린트의 retrospective/ 읽기:
   - gap-analysis.yaml → 미충족 AC 목록
   - pattern-digest.yaml → 시스템 패턴 + 메트릭
   - deferred-items.yaml → 이월 항목
2. 이전 스프린트의 api-contract.yaml 복사 (기반으로 확장)
3. follow-up 메타데이터 기록
```

디렉토리에 추가:
```
sprints/{new-sprint-id}/
├── ... (기존 구조)
└── follow-up-context.yaml       # 이전 스프린트 연결 정보
```

```yaml
# follow-up-context.yaml
previous_sprint: "{prev-sprint-id}"
inherited_from:
  deferred_items: {N}
  api_contract: true
  patterns: {N}
previous_metrics:
  fulfillment_rate: {0.0~1.0}
  first_pass_rate: {0.0~1.0}
  avg_fix_cycles: {N.N}
```

#### Phase 2: Spec (확장)

기존 Spec에 다음을 추가:

1. **Delta PRD 생성**: 이전 PRD + 이월 항목 + 개선 사항을 통합한 PRD 생성.

```markdown
# Delta PRD: {new-sprint-id}

## 선행 스프린트
- Sprint: {prev-sprint-id}
- Coverage: {fulfilled}/{total_ac} AC fulfilled
- Gap Analysis: {prev-sprint}/retrospective/gap-analysis.yaml

## 이월 항목 (Deferred from {prev-sprint-id})
### AC-{N}: {AC 제목}
- 원인: {root_cause}
- 이전 접근: {prior attempts summary}
- 보강된 접근: {suggested_approach}
- 보강된 AC: {구체화된 acceptance criteria}

## 개선 항목 (Improvements)
{사용자에게 추가 요구사항 확인 — 없으면 이월 항목만으로 진행}

## Regression Guard
이전 스프린트에서 완료된 기능이 후속 작업에 의해 깨지지 않았는지 검증:
- [ ] AC-001 ~ AC-{M}: 이전 충족 항목 회귀 없음
```

2. **Evaluator 캘리브레이션 보강 (KB 자동 조회)**:

KB의 pattern 인덱스를 조회하여 evaluation criteria를 자동 보강한다.

```
1. knowledge-base/patterns/README.md 읽기
2. severity: critical 또는 (severity: major AND frequency >= 2) 패턴 필터
3. 필터된 패턴의 .yaml 파일 Read
4. 각 패턴의 detection + contract_clause를 evaluation/criteria.md에 추가:

## KB-Calibrated Checks (from {prev-sprint-id} + accumulated KB)
- Pattern: {title} (KB: {pattern-id}, freq: {N})
  Detection: {detection 필드 요약}
  Contract clause: {contract_clause}
```

기존 pattern-digest 기반 캘리브레이션은 유지하되, KB가 더 포괄적이므로 우선 적용:
- KB에 있고 pattern-digest에도 있는 패턴 → KB 버전 사용 (frequency 반영)
- pattern-digest에만 있는 패턴 → 기존대로 추가

3. **Regression AC 생성**: 이전 스프린트에서 fulfilled된 AC를 간소화한 regression 체크리스트 생성.

```yaml
# tasks/{project}/{task-id}.md의 AC 섹션에 추가
## Regression Guard
- [ ] {이전 AC-001}: {검증 방법 — 기존 기능 동작 확인}
- [ ] {이전 AC-002}: {검증 방법}
```

#### Phase 3~5: 기존과 동일

#### Phase 6: Retrospective (확장)

기존 Retrospective에 추가:
- 이전 스프린트 대비 개선 추이 기록
- 이월 항목 해소 여부 추적

```yaml
# gap-analysis.yaml에 추가
follow_up_tracking:
  previous_sprint: "{prev-sprint-id}"
  inherited_deferred: {N}
  resolved_in_this_sprint: {N}
  still_deferred: {N}
  trend:
    fulfillment_rate: "{prev} → {current}"
    first_pass_rate: "{prev} → {current}"
```

### Output
```
Sprint Follow-Up Init: {new-sprint-id}
  Based on: {prev-sprint-id}
  Inherited: {N} deferred items, {N} patterns
  API Contract: inherited + extended

→ Proceeding to Phase 2: Spec (Delta PRD)
```

---

## --status Mode (anytime, read-only)

### 정보 수집

1. **태스크 상태**: TaskList 또는 result 파일
2. **프로토타입 상태**: `approval-status.yaml`
3. **Sprint Contract 상태**: `contracts/` 디렉토리
4. **평가 상태**: `evaluations/` 디렉토리
5. **브랜치 상태**: sprint 브랜치 커밋 수
6. **PR 상태**: `gh pr list`
7. **Agent Activity**: `logs/*.jsonl` — 각 에이전트 JSONL 파일의 마지막 줄 파싱
8. **Retrospective 상태**: `retrospective/` 디렉토리 존재 여부 + gap-analysis 요약
9. **Checkpoint 상태**: `checkpoints/` 디렉토리 — 생성된 checkpoint 목록

### Log Parsing

`sprint-orchestrator/sprints/{sprint-id}/logs/` 디렉토리의 JSONL 파일을 파싱한다:

1. 각 에이전트 파일(`be-engineer.jsonl`, `fe-engineer.jsonl`, `design-engineer.jsonl`, `evaluator.jsonl`)의 **마지막 줄**을 읽는다.
2. JSON 파싱하여 `task`, `phase`, `message`, `ts` 추출.
3. `ts`로부터 경과 시간 계산.
4. `phase` → Display Status 매핑:

| phase | Display |
|-------|---------|
| `started`, `context_loaded` | LOADING |
| `worktree_created`, `implementing`, `html_generating`, `evaluating`, `fixing` | ACTIVE |
| `build_check` | BUILDING |
| `build_failed` | BUILD FAIL |
| `html_complete` | SAVING |
| `completed` | IDLE (마지막 로그가 completed이면 현재 대기 중) |
| `error` | ERROR |

5. 로그 파일이 없거나 비어있으면 **IDLE** 표시 (아직 활성화되지 않은 에이전트).

### Dashboard Output

```
═══════════════════════════════════════════════════════
  Sprint: {sprint-id}
  PRD: {prd-source}
  Architecture: Planner-Generator-Evaluator
═══════════════════════════════════════════════════════

  Build Progress: ████████░░░░ Group {N}/{M}

  Group   Contract   Backend         App             Evaluation
  ─────   ────────   ────────────    ────────────    ──────────
  001     agreed     COMPLETED       COMPLETED       PASS
  002     agreed     COMPLETED       RUNNING         pending
  003     draft      pending         pending         —

  ─── Agent Activity ───────────────────────────────────
  Agent              Task                    Phase        Elapsed   Detail
  ────────────────   ─────────────────────   ──────────   ───────   ──────────────────────
  BE Engineer        impl/backend/002-api    BUILDING     2m ago    tsc --noEmit
  FE Engineer        impl/app/002-ui         ACTIVE       5m ago    FollowerList 컴포넌트 생성
  Design Engineer    —                       IDLE         —         —
  Evaluator          —                       IDLE         —         —

  Prototypes:
    001-profile-screen    ProfileScreen     approved
    002-follow-ui         FollowerListScreen approved

  PRs:
    wrtn-backend:       not created
    app-core-packages:  not created

  ─── Checkpoints ────────────────────────────────────
  phase-2-summary.md    ✓
  phase-3-summary.md    ✓
  group-001-summary.md  ✓
  group-002-summary.md  —

  ─── Bottleneck Detection ────────────────────────────
  ⚠ FE Engineer ACTIVE for 15m+ on impl/app/002-ui (threshold: 10m)
  ⚠ Group 002 blocked: waiting for FE completion

═══════════════════════════════════════════════════════
  Next step: {context-aware suggestion}
═══════════════════════════════════════════════════════
```

### 병목 감지 규칙

| 조건 | 경고 |
|------|------|
| Agent ACTIVE 10분+ 경과 | `⚠ {Agent} ACTIVE for {N}m+ on {task}` |
| Agent BUILD FAIL 상태 | `🔴 {Agent} build failed on {task}` |
| Agent ERROR 상태 | `🔴 {Agent} error on {task}` |
| 그룹 내 한쪽만 완료, 다른 쪽 5분+ | `⚠ Group {N} blocked: waiting for {side}` |
| Fix loop 2회차 진입 | `⚠ Group {N} in fix loop round 2` |

### 진행률 계산

```
progress = (accepted_groups / total_groups) * 100
bar_filled = round(progress / 100 * 12)
```

### Next Step 로직

상태 기반 자동 추천:
- 모든 그룹 ACCEPTED → "Ready for Phase 5: PR"
- 현재 그룹 평가 중 → "Waiting for Evaluator on Group {N}"
- Fix loop 중 → "Fix loop round {R} for Group {N}"
- FAILED 그룹 존재 → "Group {N} FAILED — user decision required"
- 구현 진행 중 → "Engineers working on Group {N}"
- PR 생성 완료, retrospective 미실행 → "Ready for Phase 6: Retrospective"
- Retrospective 완료, deferred 존재 → "`--continue` or `--follow-up` recommended"
- Retrospective 완료, 전체 충족 → "Sprint complete. All AC fulfilled."

### 자동 모니터링 (`/loop` 연계)

빌드 중 실시간 모니터링:
```
/loop 3m /sprint {sprint-id} --status
```
