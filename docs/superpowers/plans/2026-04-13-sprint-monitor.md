# Sprint Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hook 기반 자동 이벤트 수집 + 터미널 실시간 대시보드 + Phase 전환 시 자동 status 출력을 구현한다.

**Architecture:** Claude Code Hook(SubagentStart/Stop, TaskCreated/Completed)이 이벤트를 JSONL에 자동 기록하고, bash 스크립트가 이를 파싱하여 터미널 대시보드를 렌더링한다. Sprint skill의 각 Phase Gate에 status 자동 출력 규칙을 추가한다.

**Tech Stack:** Bash, jq, Claude Code Hooks

**Spec:** `docs/superpowers/specs/2026-04-13-sprint-monitor-design.md`

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `scripts/hook-handler.sh` | Hook 이벤트 → events.jsonl 기록 |
| Create | `scripts/sprint-monitor.sh` | 터미널 대시보드 (2초 갱신) |
| Modify | `.claude/settings.local.json` | 4개 Hook 등록 |
| Modify | `.claude/skills/sprint/phase-init.md:33-41` | Gate 통과 시 status 출력 추가 |
| Modify | `.claude/skills/sprint/phase-spec.md:72-81` | Gate 통과 시 status 출력 추가 |
| Modify | `.claude/skills/sprint/phase-prototype.md:443-452` | Gate 통과 시 status 출력 추가 |
| Modify | `.claude/skills/sprint/phase-build.md:362-378` | Group 완료 + Gate 시 status 출력 추가 |
| Modify | `.claude/skills/sprint/phase-pr.md:47-54` | Gate 통과 시 status 출력 추가 |
| Modify | `.claude/skills/sprint/phase-modes.md:210-211` | Phase 전환 자동 출력 문서화 |

---

### Task 1: hook-handler.sh 생성

**Files:**
- Create: `scripts/hook-handler.sh`

- [ ] **Step 1: hook-handler.sh 작성**

`scripts/hook-handler.sh` 파일 생성:

```bash
#!/bin/bash
set -euo pipefail

ORCHESTRATOR_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SPRINTS_DIR="$ORCHESTRATOR_DIR/sprint-orchestrator/sprints"

INPUT=$(cat)

EVENT_NAME=$(echo "$INPUT" | jq -r '.hook_event_name // empty')
[ -z "$EVENT_NAME" ] && exit 0

ACTIVE_SPRINT=""
if [ -d "$SPRINTS_DIR" ]; then
  for dir in $(ls -rd "$SPRINTS_DIR"/*/  2>/dev/null); do
    if [ -f "$dir/sprint-config.yaml" ] && [ ! -f "$dir/retrospective/REPORT.md" ]; then
      ACTIVE_SPRINT="$dir"
      break
    fi
  done
fi

[ -z "$ACTIVE_SPRINT" ] && exit 0

LOGS_DIR="$ACTIVE_SPRINT/logs"
mkdir -p "$LOGS_DIR"
EVENTS_FILE="$LOGS_DIR/events.jsonl"

TS=$(date -u +"%Y-%m-%dT%H:%M:%S+00:00")

case "$EVENT_NAME" in
  SubagentStart)
    AGENT_ID=$(echo "$INPUT" | jq -r '.agent_id // "unknown"')
    AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // "unknown"')
    echo "{\"ts\":\"$TS\",\"event\":\"subagent_start\",\"agent_id\":\"$AGENT_ID\",\"agent_type\":\"$AGENT_TYPE\"}" >> "$EVENTS_FILE"
    ;;
  SubagentStop)
    AGENT_ID=$(echo "$INPUT" | jq -r '.agent_id // "unknown"')
    AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // "unknown"')
    echo "{\"ts\":\"$TS\",\"event\":\"subagent_stop\",\"agent_id\":\"$AGENT_ID\",\"agent_type\":\"$AGENT_TYPE\"}" >> "$EVENTS_FILE"
    ;;
  TaskCreated)
    TASK_ID=$(echo "$INPUT" | jq -r '.task_id // "unknown"')
    SUBJECT=$(echo "$INPUT" | jq -r '.task_subject // ""')
    TEAMMATE=$(echo "$INPUT" | jq -r '.teammate_name // "unknown"')
    echo "{\"ts\":\"$TS\",\"event\":\"task_created\",\"task_id\":\"$TASK_ID\",\"subject\":\"$SUBJECT\",\"teammate\":\"$TEAMMATE\"}" >> "$EVENTS_FILE"
    ;;
  TaskCompleted)
    TASK_ID=$(echo "$INPUT" | jq -r '.task_id // "unknown"')
    SUBJECT=$(echo "$INPUT" | jq -r '.task_subject // ""')
    TEAMMATE=$(echo "$INPUT" | jq -r '.teammate_name // "unknown"')
    echo "{\"ts\":\"$TS\",\"event\":\"task_completed\",\"task_id\":\"$TASK_ID\",\"subject\":\"$SUBJECT\",\"teammate\":\"$TEAMMATE\"}" >> "$EVENTS_FILE"
    ;;
esac

exit 0
```

- [ ] **Step 2: 실행 권한 부여**

```bash
chmod +x scripts/hook-handler.sh
```

- [ ] **Step 3: 스크립트 동작 확인 (수동 테스트)**

stdin으로 테스트 이벤트를 주입하여 JSONL 기록 확인:

```bash
mkdir -p sprint-orchestrator/sprints/test-sprint/logs
touch sprint-orchestrator/sprints/test-sprint/sprint-config.yaml

echo '{"hook_event_name":"SubagentStart","agent_id":"test-123","agent_type":"be-engineer"}' | ./scripts/hook-handler.sh

cat sprint-orchestrator/sprints/test-sprint/logs/events.jsonl
```

Expected: `{"ts":"...","event":"subagent_start","agent_id":"test-123","agent_type":"be-engineer"}` 한 줄 출력.

```bash
rm -rf sprint-orchestrator/sprints/test-sprint
```

- [ ] **Step 4: 커밋**

```bash
git add scripts/hook-handler.sh
git commit -m "feat: add hook-handler.sh for automatic sprint event collection"
```

---

### Task 2: sprint-monitor.sh 생성

**Files:**
- Create: `scripts/sprint-monitor.sh`

- [ ] **Step 1: sprint-monitor.sh 작성**

`scripts/sprint-monitor.sh` 파일 생성:

```bash
#!/bin/bash
set -euo pipefail

SPRINT_ID="${1:-}"
if [ -z "$SPRINT_ID" ]; then
  echo "Usage: ./scripts/sprint-monitor.sh <sprint-id>"
  exit 1
fi

ORCHESTRATOR_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SPRINT_DIR="$ORCHESTRATOR_DIR/sprint-orchestrator/sprints/$SPRINT_ID"

if [ ! -d "$SPRINT_DIR" ]; then
  echo "Sprint not found: $SPRINT_DIR"
  exit 1
fi

LOGS_DIR="$SPRINT_DIR/logs"

get_agent_status() {
  local agent="$1"
  local events_file="$LOGS_DIR/events.jsonl"
  local agent_log="$LOGS_DIR/${agent}.jsonl"

  local hook_status="NOT STARTED"
  local hook_elapsed=""

  # Check events.jsonl for agent lifecycle
  if [ -f "$events_file" ]; then
    local last_start last_stop
    last_start=$(grep "\"agent_type\":\"$agent\"" "$events_file" | grep '"subagent_start"' | tail -1 | jq -r '.ts // empty' 2>/dev/null)
    last_stop=$(grep "\"agent_type\":\"$agent\"" "$events_file" | grep '"subagent_stop"' | tail -1 | jq -r '.ts // empty' 2>/dev/null)

    if [ -n "$last_start" ]; then
      if [ -z "$last_stop" ] || [[ "$last_start" > "$last_stop" ]]; then
        hook_status="ACTIVE"
        local start_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${last_start%%+*}" +%s 2>/dev/null || echo "0")
        local now_epoch=$(date +%s)
        local diff=$(( (now_epoch - start_epoch) / 60 ))
        hook_elapsed="${diff}m ago"
      else
        hook_status="IDLE"
      fi
    fi
  fi

  # Check agent-specific JSONL for phase detail
  local phase_detail=""
  local phase_status=""
  local task_name=""
  if [ -f "$agent_log" ]; then
    local last_line
    last_line=$(tail -1 "$agent_log" 2>/dev/null)
    if [ -n "$last_line" ]; then
      local phase=$(echo "$last_line" | jq -r '.phase // empty' 2>/dev/null)
      task_name=$(echo "$last_line" | jq -r '.task // "—"' 2>/dev/null)
      phase_detail=$(echo "$last_line" | jq -r '.message // empty' 2>/dev/null)
      local log_ts=$(echo "$last_line" | jq -r '.ts // empty' 2>/dev/null)

      case "$phase" in
        started|context_loaded) phase_status="LOADING" ;;
        worktree_created|implementing|html_generating|evaluating|fixing) phase_status="ACTIVE" ;;
        build_check) phase_status="BUILDING" ;;
        build_failed) phase_status="BUILD FAIL" ;;
        html_complete) phase_status="SAVING" ;;
        completed) phase_status="IDLE" ;;
        error) phase_status="ERROR" ;;
      esac

      if [ -n "$log_ts" ] && [ -z "$hook_elapsed" ]; then
        local log_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${log_ts%%+*}" +%s 2>/dev/null || echo "0")
        local now_epoch=$(date +%s)
        local diff=$(( (now_epoch - log_epoch) / 60 ))
        hook_elapsed="${diff}m ago"
      fi
    fi
  fi

  # Merge: hook status takes precedence for active/idle, phase detail adds context
  local display_status="${phase_status:-$hook_status}"
  [ -z "$hook_elapsed" ] && hook_elapsed="—"
  [ -z "$task_name" ] && task_name="—"
  [ -z "$phase_detail" ] && phase_detail="—"

  printf "  %-18s %-24s %-12s %-9s %s\n" "$agent" "$task_name" "$display_status" "$hook_elapsed" "$phase_detail"
}

get_group_status() {
  local contracts_dir="$SPRINT_DIR/contracts"
  local evaluations_dir="$SPRINT_DIR/evaluations"

  if [ ! -d "$contracts_dir" ] && [ ! -d "$evaluations_dir" ]; then
    echo "  (no groups yet)"
    return
  fi

  printf "  %-7s %-10s %-15s %-15s %s\n" "Group" "Contract" "Backend" "App" "Evaluation"
  printf "  %-7s %-10s %-15s %-15s %s\n" "─────" "────────" "────────────" "────────────" "──────────"

  for contract in "$contracts_dir"/group-*.md 2>/dev/null; do
    [ ! -f "$contract" ] && continue
    local group=$(basename "$contract" .md | sed 's/group-//')
    local contract_status="draft"
    grep -q "agreed" "$contract" 2>/dev/null && contract_status="agreed"

    local eval_status="—"
    local eval_file="$evaluations_dir/group-${group}.md"
    if [ -f "$eval_file" ]; then
      if grep -q "PASS" "$eval_file" 2>/dev/null; then
        eval_status="PASS"
      elif grep -q "FAIL" "$eval_file" 2>/dev/null; then
        eval_status="FAIL"
      else
        eval_status="pending"
      fi
    fi

    printf "  %-7s %-10s %-15s %-15s %s\n" "$group" "$contract_status" "—" "—" "$eval_status"
  done
}

get_recent_events() {
  local events_file="$LOGS_DIR/events.jsonl"
  if [ ! -f "$events_file" ]; then
    echo "  (no events yet)"
    return
  fi

  tail -5 "$events_file" | tac | while IFS= read -r line; do
    local ts=$(echo "$line" | jq -r '.ts // "—"' 2>/dev/null)
    local event=$(echo "$line" | jq -r '.event // "—"' 2>/dev/null)
    local agent=$(echo "$line" | jq -r '.agent_type // .teammate // "—"' 2>/dev/null)
    local subject=$(echo "$line" | jq -r '.subject // "—"' 2>/dev/null)
    local time_part="${ts:11:8}"
    printf "  %-10s %-18s %-20s %s\n" "$time_part" "$agent" "$event" "$subject"
  done
}

get_checkpoints() {
  local cp_dir="$SPRINT_DIR/checkpoints"
  if [ ! -d "$cp_dir" ]; then
    echo "  (no checkpoints yet)"
    return
  fi

  for f in phase-2-summary.md phase-3-summary.md; do
    if [ -f "$cp_dir/$f" ]; then
      printf "  %-30s ✓\n" "$f"
    else
      printf "  %-30s —\n" "$f"
    fi
  done

  for f in "$cp_dir"/group-*-summary.md 2>/dev/null; do
    [ ! -f "$f" ] && continue
    printf "  %-30s ✓\n" "$(basename "$f")"
  done
}

render_dashboard() {
  clear
  echo "═══════════════════════════════════════════════════════"
  echo "  Sprint: $SPRINT_ID"
  echo "  Monitor: $(date '+%H:%M:%S') (refreshing every 2s)"
  echo "═══════════════════════════════════════════════════════"
  echo ""

  echo "  ─── Agent Activity ───────────────────────────────────"
  printf "  %-18s %-24s %-12s %-9s %s\n" "Agent" "Task" "Phase" "Elapsed" "Detail"
  printf "  %-18s %-24s %-12s %-9s %s\n" "────────────────" "──────────────────────" "──────────" "───────" "──────────────────────"
  get_agent_status "be-engineer"
  get_agent_status "fe-engineer"
  get_agent_status "design-engineer"
  get_agent_status "evaluator"
  echo ""

  echo "  ─── Groups ───────────────────────────────────────────"
  get_group_status
  echo ""

  echo "  ─── Checkpoints ──────────────────────────────────────"
  get_checkpoints
  echo ""

  echo "  ─── Recent Events (Hook) ─────────────────────────────"
  get_recent_events
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  Ctrl+C to exit"
  echo "═══════════════════════════════════════════════════════"
}

trap 'echo ""; echo "Monitor stopped."; exit 0' INT

while true; do
  render_dashboard
  sleep 2
done
```

- [ ] **Step 2: 실행 권한 부여**

```bash
chmod +x scripts/sprint-monitor.sh
```

- [ ] **Step 3: 동작 확인 (테스트 데이터)**

테스트용 스프린트 디렉토리와 이벤트 데이터 생성:

```bash
mkdir -p sprint-orchestrator/sprints/test-monitor/{logs,contracts,evaluations,checkpoints}
touch sprint-orchestrator/sprints/test-monitor/sprint-config.yaml

cat > sprint-orchestrator/sprints/test-monitor/logs/events.jsonl << 'EOF'
{"ts":"2026-04-13T14:30:00+00:00","event":"subagent_start","agent_id":"abc123","agent_type":"be-engineer"}
{"ts":"2026-04-13T14:30:05+00:00","event":"task_created","task_id":"1","subject":"impl/backend/001","teammate":"be-engineer"}
{"ts":"2026-04-13T14:35:00+00:00","event":"task_completed","task_id":"1","subject":"impl/backend/001","teammate":"be-engineer"}
EOF

./scripts/sprint-monitor.sh test-monitor &
MONITOR_PID=$!
sleep 3
kill $MONITOR_PID 2>/dev/null

rm -rf sprint-orchestrator/sprints/test-monitor
```

Expected: 대시보드가 렌더링되고 be-engineer가 ACTIVE로 표시됨.

- [ ] **Step 4: 커밋**

```bash
git add scripts/sprint-monitor.sh
git commit -m "feat: add sprint-monitor.sh for real-time terminal dashboard"
```

---

### Task 3: settings.local.json에 Hook 등록

**Files:**
- Modify: `.claude/settings.local.json`

- [ ] **Step 1: hooks 섹션 추가**

`.claude/settings.local.json`에 `hooks` 필드를 추가한다. 기존 `env`와 `permissions` 필드는 그대로 유지.

기존 파일의 첫 번째 `{` 다음에 hooks 섹션을 삽입한다:

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/hook-handler.sh",
            "timeout": 3
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/hook-handler.sh",
            "timeout": 3
          }
        ]
      }
    ],
    "TaskCreated": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/hook-handler.sh",
            "timeout": 3
          }
        ]
      }
    ],
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/hook-handler.sh",
            "timeout": 3
          }
        ]
      }
    ]
  },
  "env": {
    ...existing...
  },
  "permissions": {
    ...existing...
  }
}
```

**주의:** `env`와 `permissions`의 기존 내용은 변경하지 않는다. `hooks` 필드만 최상위에 추가.

- [ ] **Step 2: JSON 유효성 확인**

```bash
cat .claude/settings.local.json | jq . > /dev/null
```

Expected: 에러 없이 종료 (exit 0).

- [ ] **Step 3: 커밋**

settings.local.json은 global gitignore에 의해 추적되지 않으므로 커밋하지 않는다. 로컬 설정으로만 유지.

---

### Task 4: Phase Gate에 자동 status 출력 규칙 추가

**Files:**
- Modify: `.claude/skills/sprint/phase-init.md:33-41`
- Modify: `.claude/skills/sprint/phase-spec.md:72-81`
- Modify: `.claude/skills/sprint/phase-prototype.md:443-452`
- Modify: `.claude/skills/sprint/phase-build.md:362-378`
- Modify: `.claude/skills/sprint/phase-pr.md:47-54`

- [ ] **Step 1: phase-init.md — Gate → Phase 2 섹션에 status 출력 추가**

`phase-init.md`의 Output 섹션(line 33-41) 앞에 규칙을 추가:

기존:
```markdown
## Output
```
Sprint initialized: {sprint-id}
  Directory: sprint-orchestrator/sprints/{sprint-id}/
  PRD: {prd-file}
  Base branches: backend → {base}, app → {base}

→ Proceeding to Phase 2: Spec
```
```

변경 후:
```markdown
## Output

Gate 통과 시:
1. **Sprint Status 출력** — `--status` 대시보드를 출력하여 현재 진행 상태를 표시한다.
2. 다음 Phase 진입.

```
Sprint initialized: {sprint-id}
  Directory: sprint-orchestrator/sprints/{sprint-id}/
  PRD: {prd-file}
  Base branches: backend → {base}, app → {base}

[Sprint Status Dashboard]

→ Proceeding to Phase 2: Spec
```
```

- [ ] **Step 2: phase-spec.md — Gate → Phase 3 섹션에 status 출력 추가**

`phase-spec.md`의 Output 섹션(line 72-81) 변경:

기존:
```markdown
## Output
```
Sprint Spec: {sprint-id}
  API Contract: {N} endpoints
  Tasks: Backend {N} + App {N}
  Evaluation Criteria: defined

→ Proceeding to Phase 3: Prototype
→ Proceeding to Phase 4: Build (no UI tasks — skipping prototype)
```
```

변경 후:
```markdown
## Output

Gate 통과 시:
1. Checkpoint 파일 생성 (`checkpoints/phase-2-summary.md`).
2. **Sprint Status 출력** — `--status` 대시보드를 출력하여 현재 진행 상태를 표시한다.
3. 다음 Phase 진입.

```
Sprint Spec: {sprint-id}
  API Contract: {N} endpoints
  Tasks: Backend {N} + App {N}
  Evaluation Criteria: defined

[Sprint Status Dashboard]

→ Proceeding to Phase 3: Prototype
→ Proceeding to Phase 4: Build (no UI tasks — skipping prototype)
```
```

- [ ] **Step 3: phase-prototype.md — Gate → Phase 4 섹션에 status 출력 추가**

`phase-prototype.md`의 Output 섹션(line 443-452) 변경:

기존:
```markdown
## Output
```
Sprint Prototype: {sprint-id}
  Generated: {N} screens (HTML)
  Approved: {N}, Pending: {N}, Rejected: {N}
  PRD Amendments: {N} applied, {N} deferred, {N} dismissed
  PRD Refinement: {N} new, {N} refined — {accept | partial | review-only}

→ Proceeding to Phase 4: Build
```
```

변경 후:
```markdown
## Output

Gate 통과 시:
1. Checkpoint 파일 생성 (`checkpoints/phase-3-summary.md`).
2. **Sprint Status 출력** — `--status` 대시보드를 출력하여 현재 진행 상태를 표시한다.
3. 다음 Phase 진입.

```
Sprint Prototype: {sprint-id}
  Generated: {N} screens (HTML)
  Approved: {N}, Pending: {N}, Rejected: {N}
  PRD Amendments: {N} applied, {N} deferred, {N} dismissed
  PRD Refinement: {N} new, {N} refined — {accept | partial | review-only}

[Sprint Status Dashboard]

→ Proceeding to Phase 4: Build
```
```

- [ ] **Step 4: phase-build.md — Group 완료 + Gate → Phase 5에 status 출력 추가**

`phase-build.md`의 Output 섹션(line 362-378) 변경:

기존:
```markdown
## Output
```
Sprint Build: {sprint-id}

  [Group 001] ACCEPTED
    impl/backend/001-profile-api        merged → eval PASS
    impl/app/001-profile-screen         merged → eval PASS

  [Group 002] EVALUATING
    impl/backend/002-follow-api         merged
    impl/app/002-follow-ui              merged
    eval: pending...

  Results: 1/3 groups accepted, 1/3 evaluating

→ Proceeding to Phase 5: PR (all groups accepted)
```
```

변경 후:
```markdown
## Group 완료 시 행동

각 Group의 Evaluator PASS/FAIL 판정 후:
1. Group summary checkpoint 생성 (`checkpoints/group-{N}-summary.md`).
2. **Sprint Status 출력** — 그룹 진행률, 에이전트 상태, 병목 감지를 표시한다.
3. 다음 Group 진입 또는 Phase 5 전환.

## Output

Gate 통과 시:
1. 모든 그룹 checkpoint 확인.
2. **Sprint Status 출력** — 최종 빌드 결과를 표시한다.
3. Phase 5 진입.

```
Sprint Build: {sprint-id}

  [Group 001] ACCEPTED
    impl/backend/001-profile-api        merged → eval PASS
    impl/app/001-profile-screen         merged → eval PASS

  [Group 002] EVALUATING
    impl/backend/002-follow-api         merged
    impl/app/002-follow-ui              merged
    eval: pending...

  Results: 1/3 groups accepted, 1/3 evaluating

[Sprint Status Dashboard]

→ Proceeding to Phase 5: PR (all groups accepted)
```
```

- [ ] **Step 5: phase-pr.md — Gate → Phase 6에 status 출력 추가**

`phase-pr.md`의 Output 섹션(line 47-54) 변경:

기존:
```markdown
## Output
```
Sprint PR: {sprint-id}
  wrtn-backend:       {url} (zzem/{sprint-id} → {base})
  app-core-packages:  {url} (zzem/{sprint-id} → {base})

Sprint pipeline complete!
→ Proceeding to Phase 6: Retrospective
```
```

변경 후:
```markdown
## Output

Gate 통과 시:
1. **Sprint Status 출력** — PR 생성 결과를 포함한 전체 상태를 표시한다.
2. Phase 6 진입.

```
Sprint PR: {sprint-id}
  wrtn-backend:       {url} (zzem/{sprint-id} → {base})
  app-core-packages:  {url} (zzem/{sprint-id} → {base})

[Sprint Status Dashboard]

Sprint pipeline complete!
→ Proceeding to Phase 6: Retrospective
```
```

- [ ] **Step 6: 커밋**

```bash
git add .claude/skills/sprint/phase-init.md \
       .claude/skills/sprint/phase-spec.md \
       .claude/skills/sprint/phase-prototype.md \
       .claude/skills/sprint/phase-build.md \
       .claude/skills/sprint/phase-pr.md
git commit -m "feat: add automatic status output at every Phase gate transition"
```

---

### Task 5: phase-modes.md에 자동 출력 문서화

**Files:**
- Modify: `.claude/skills/sprint/phase-modes.md:210-211`

- [ ] **Step 1: --status Mode 설명에 자동 출력 규칙 추가**

`phase-modes.md`의 `## --status Mode` 섹션(line 210-211) 변경:

기존:
```markdown
## --status Mode (anytime, read-only)
```

변경 후:
```markdown
## --status Mode (자동 + 수동)

### 자동 출력

모든 Phase Gate 통과 시 `--status` 대시보드가 자동으로 출력된다. Build Phase에서는 각 Group 완료 시에도 출력된다. 별도 호출 불필요.

### 별도 터미널 모니터링

실시간 모니터링이 필요한 경우 별도 터미널에서 sprint-monitor.sh를 실행한다:

```bash
./scripts/sprint-monitor.sh {sprint-id}
```

2초 간격으로 Agent Activity, Group 상태, Checkpoint, Hook Event Log를 갱신한다. `Ctrl+C`로 종료.

### 수동 호출

여전히 `--status` 플래그로 수동 호출 가능:

```bash
/sprint {sprint-id} --status
```

### Hook 기반 이벤트 수집

`scripts/hook-handler.sh`가 Claude Code Hook을 통해 다음 이벤트를 자동 기록한다:

| Hook Event | 기록 내용 |
|------------|----------|
| `SubagentStart` | teammate 활성화 (agent_id, agent_type) |
| `SubagentStop` | teammate 종료 (agent_id, agent_type) |
| `TaskCreated` | 태스크 할당 (task_id, subject, teammate) |
| `TaskCompleted` | 태스크 완료 (task_id, subject, teammate) |

이벤트는 `logs/events.jsonl`에 기록되며, 기존 에이전트 수동 로깅(`logs/{agent}.jsonl`)과 병행한다. Hook 이벤트는 teammate 라이프사이클을, 수동 로깅은 구현 phase 상세를 담당한다.

### 정보 수집
```

- [ ] **Step 2: 자동 모니터링 섹션 업데이트**

`phase-modes.md` 하단의 자동 모니터링 섹션(line 322-327) 변경:

기존:
```markdown
### 자동 모니터링 (`/loop` 연계)

빌드 중 실시간 모니터링:
```
/loop 3m /sprint {sprint-id} --status
```
```

변경 후:
```markdown
### 자동 모니터링

Phase 전환 시 자동 출력 + 별도 터미널 모니터:

```bash
# 별도 터미널에서 실시간 모니터링 (권장)
./scripts/sprint-monitor.sh {sprint-id}

# 또는 기존 /loop 방식
/loop 3m /sprint {sprint-id} --status
```
```

- [ ] **Step 3: 커밋**

```bash
git add .claude/skills/sprint/phase-modes.md
git commit -m "docs: document auto status output and sprint-monitor.sh in phase-modes"
```

---

### Task 6: README.md에 모니터링 가이드 추가

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Sprint Commands 섹션 뒤에 모니터링 섹션 추가**

`README.md`의 `## Sprint Commands` 섹션(line 39-52) 뒤, `## Directory Layout` 섹션(line 54) 앞에 추가:

```markdown
## Monitoring

```bash
# 별도 터미널에서 실시간 대시보드
./scripts/sprint-monitor.sh <sprint-id>

# Phase 전환 시 자동으로 status 출력됨 (별도 설정 불필요)
```
```

- [ ] **Step 2: 커밋**

```bash
git add README.md
git commit -m "docs: add monitoring section to README"
```
