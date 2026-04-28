# recall:ask Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `recall:ask` v1 — an interactive interview-mode skill that lets the Sprint Lead query past sprint artifacts + ZZEM KB from a fresh Claude session, with two-stage hybrid retrieval and a state-file-backed session.

**Architecture:** Plugin-style skill at `plugins/recall/` containing (a) a SKILL.md instructional file Claude loads on `/recall:ask`, (b) bash helper scripts for stateful operations (session lifecycle, config resolution) so Claude doesn't reinvent these per turn, (c) example/schema for the `.recall.yaml` config layer enabling OSS portability, and (d) install scripts that symlink the skill into `~/.claude/skills/recall/`. Tests are bash unit tests for the helper scripts; the SKILL.md content is verified by manual smoke scenarios from the spec.

**Tech Stack:** Bash 3.2+, `yq` (YAML CLI — already installed on macOS via brew or fallback to `python3 -c`), `python3` for stable date math, GNU `find`. No additional npm/pnpm deps.

---

## File Structure

```
plugins/recall/
  skills/
    ask/
      SKILL.md                       # Main skill body — Claude reads this on /recall:ask
  config/
    recall.example.yaml              # Example config for OSS users (commented)
    recall.schema.json               # JSONSchema for .recall.yaml validation
  scripts/
    session.sh                       # State file lifecycle (read/write/active/reset/backup)
    load-config.sh                   # Config resolution (env → CWD → home → default)
    install.sh                       # Create ~/.claude/skills/recall symlink
    uninstall.sh                     # Remove symlink
  tests/
    test_session.sh                  # Bash unit tests for session.sh
    test_config.sh                   # Bash unit tests for load-config.sh
    smoke.md                         # 7 smoke scenarios from spec, manual run
  README.md                          # OSS-flavored plugin README
.recall.yaml                         # ZZEM-specific config (committed at repo root)
```

State + runtime files (not committed):
- `~/.recall/session.yaml` — session state
- `~/.recall/session.yaml.corrupt-<ts>` — corrupt-file backups
- `~/.claude/skills/recall/ask` — symlink → `<repo>/plugins/recall/skills/ask`

---

## Task 1: Scaffold plugin directory

**Files:**
- Create: `plugins/recall/.gitkeep`
- Create: `plugins/recall/skills/ask/.gitkeep`
- Create: `plugins/recall/config/.gitkeep`
- Create: `plugins/recall/scripts/.gitkeep`
- Create: `plugins/recall/tests/.gitkeep`

- [ ] **Step 1: Create directory tree**

```bash
cd /Users/zachryu/.superset/worktrees/zzem-orchestrator/chore/ask-knowledge
mkdir -p plugins/recall/skills/ask plugins/recall/config plugins/recall/scripts plugins/recall/tests
touch plugins/recall/skills/ask/.gitkeep plugins/recall/config/.gitkeep plugins/recall/scripts/.gitkeep plugins/recall/tests/.gitkeep
```

- [ ] **Step 2: Verify**

Run: `find plugins/recall -type d`
Expected:
```
plugins/recall
plugins/recall/skills
plugins/recall/skills/ask
plugins/recall/config
plugins/recall/scripts
plugins/recall/tests
```

- [ ] **Step 3: Commit**

```bash
git add plugins/recall
git commit -m "chore(recall): scaffold plugin directory structure"
```

---

## Task 2: session.sh — read/write primitives (TDD)

**Files:**
- Create: `plugins/recall/scripts/session.sh`
- Create: `plugins/recall/tests/test_session.sh`

- [ ] **Step 1: Write failing test for session_read / session_write**

Create `plugins/recall/tests/test_session.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
export RECALL_STATE_DIR="$TMPDIR"

source scripts/session.sh

fail() { echo "FAIL: $1" >&2; exit 1; }
pass() { echo "PASS: $1"; }

# Test 1: write then read round-trip
session_write "active: true
sprint_focus: test-sprint
turn_count: 1"
out=$(session_read)
echo "$out" | grep -q "sprint_focus: test-sprint" || fail "round-trip lost sprint_focus"
pass "session_write/session_read round-trip"

# Test 2: read returns empty when no file
rm -f "$RECALL_STATE_DIR/session.yaml"
out=$(session_read)
[[ -z "$out" ]] || fail "session_read should return empty for missing file, got: $out"
pass "session_read empty when no file"

echo "All session tests passed"
```

Run: `bash plugins/recall/tests/test_session.sh`
Expected: FAIL with "session.sh: No such file or directory" or `command not found: session_write`

- [ ] **Step 2: Implement session.sh primitives**

Create `plugins/recall/scripts/session.sh`:
```bash
# session.sh — state file lifecycle helpers for recall:ask
# Sourced by other scripts; do NOT execute directly.
#
# Public functions:
#   session_read              → echoes state YAML to stdout (empty if no file)
#   session_write <yaml>      → writes <yaml> to state file
#   session_path              → echoes resolved state file path
#   session_active            → exits 0 if active+fresh, 1 otherwise
#   session_reset             → deletes state file
#   session_backup_corrupt    → moves state file to .corrupt-<ts> backup
#
# Env:
#   RECALL_STATE_DIR  — override state dir (default: ~/.recall)
#   RECALL_IDLE_MIN   — idle timeout minutes (default: 30)
#   RECALL_STALE_DAYS — auto-reset stale session days (default: 7)

session_path() {
  local dir="${RECALL_STATE_DIR:-$HOME/.recall}"
  echo "$dir/session.yaml"
}

session_read() {
  local f
  f=$(session_path)
  [[ -f "$f" ]] || return 0
  cat "$f"
}

session_write() {
  local yaml="$1"
  local f dir
  f=$(session_path)
  dir=$(dirname "$f")
  mkdir -p "$dir"
  printf '%s\n' "$yaml" > "$f"
}
```

- [ ] **Step 3: Run tests, verify pass**

Run: `bash plugins/recall/tests/test_session.sh`
Expected:
```
PASS: session_write/session_read round-trip
PASS: session_read empty when no file
All session tests passed
```

- [ ] **Step 4: Commit**

```bash
git add plugins/recall/scripts/session.sh plugins/recall/tests/test_session.sh
git commit -m "feat(recall): session.sh read/write primitives + tests"
```

---

## Task 3: session.sh — active + idle timeout + stale (TDD)

**Files:**
- Modify: `plugins/recall/scripts/session.sh`
- Modify: `plugins/recall/tests/test_session.sh`

- [ ] **Step 1: Add failing tests for session_active**

Append to `plugins/recall/tests/test_session.sh` (before `echo "All session tests passed"`):
```bash
# Test 3: session_active true when fresh
now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
session_write "active: true
last_turn_at: $now
turn_count: 1"
session_active && pass "session_active true when fresh" || fail "session_active should be true for fresh session"

# Test 4: session_active false when idle (>30min)
old=$(python3 -c 'import datetime; print((datetime.datetime.utcnow()-datetime.timedelta(minutes=45)).strftime("%Y-%m-%dT%H:%M:%SZ"))')
session_write "active: true
last_turn_at: $old
turn_count: 1"
if session_active; then fail "session_active should be false when idle 45min"; fi
pass "session_active false when idle"

# Test 5: session_active false when stale (>7 days)
stale=$(python3 -c 'import datetime; print((datetime.datetime.utcnow()-datetime.timedelta(days=8)).strftime("%Y-%m-%dT%H:%M:%SZ"))')
session_write "active: true
last_turn_at: $stale
turn_count: 1"
if session_active; then fail "session_active should be false when stale 8d"; fi
pass "session_active false when stale"

# Test 6: session_active false when no file
rm -f "$RECALL_STATE_DIR/session.yaml"
if session_active; then fail "session_active should be false when no file"; fi
pass "session_active false when no file"
```

Run: `bash plugins/recall/tests/test_session.sh`
Expected: FAIL with `command not found: session_active`

- [ ] **Step 2: Implement session_active**

Append to `plugins/recall/scripts/session.sh`:
```bash
# Returns 0 if state file exists AND last_turn_at is within idle window AND not stale.
session_active() {
  local f yaml last
  f=$(session_path)
  [[ -f "$f" ]] || return 1
  yaml=$(cat "$f")
  last=$(printf '%s\n' "$yaml" | sed -n 's/^last_turn_at:[[:space:]]*//p' | head -1 | tr -d '"')
  [[ -n "$last" ]] || return 1
  local idle_min="${RECALL_IDLE_MIN:-30}"
  local stale_days="${RECALL_STALE_DAYS:-7}"
  python3 - "$last" "$idle_min" "$stale_days" <<'PY' || return 1
import datetime, sys
last_str, idle_min, stale_days = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
last = datetime.datetime.strptime(last_str, "%Y-%m-%dT%H:%M:%SZ")
now = datetime.datetime.utcnow()
delta = now - last
if delta > datetime.timedelta(days=stale_days): sys.exit(1)
if delta > datetime.timedelta(minutes=idle_min): sys.exit(1)
sys.exit(0)
PY
}
```

- [ ] **Step 3: Run tests, verify all pass**

Run: `bash plugins/recall/tests/test_session.sh`
Expected: 6 PASS lines, then `All session tests passed`

- [ ] **Step 4: Commit**

```bash
git add plugins/recall/scripts/session.sh plugins/recall/tests/test_session.sh
git commit -m "feat(recall): session_active with idle/stale checks"
```

---

## Task 4: session.sh — reset + corrupt backup (TDD)

**Files:**
- Modify: `plugins/recall/scripts/session.sh`
- Modify: `plugins/recall/tests/test_session.sh`

- [ ] **Step 1: Add failing tests**

Append to `plugins/recall/tests/test_session.sh` (before `echo "All session tests passed"`):
```bash
# Test 7: session_reset removes file
session_write "active: true"
session_reset
[[ ! -f "$RECALL_STATE_DIR/session.yaml" ]] || fail "session_reset should delete file"
pass "session_reset deletes state file"

# Test 8: session_reset on missing file is no-op (no error)
session_reset && pass "session_reset on missing file is silent" || fail "session_reset should not error when no file"

# Test 9: session_backup_corrupt moves to .corrupt-<ts>
session_write "this is not valid yaml: : :"
session_backup_corrupt
[[ ! -f "$RECALL_STATE_DIR/session.yaml" ]] || fail "session_backup_corrupt should move out of session.yaml"
backup=$(ls "$RECALL_STATE_DIR"/session.yaml.corrupt-* 2>/dev/null | head -1)
[[ -n "$backup" ]] || fail "session_backup_corrupt should create .corrupt-<ts> file"
pass "session_backup_corrupt moves to timestamped backup"
```

Run: `bash plugins/recall/tests/test_session.sh`
Expected: FAIL on `session_reset` (or `session_backup_corrupt`)

- [ ] **Step 2: Implement reset + backup**

Append to `plugins/recall/scripts/session.sh`:
```bash
session_reset() {
  local f
  f=$(session_path)
  rm -f "$f"
  return 0
}

session_backup_corrupt() {
  local f ts
  f=$(session_path)
  [[ -f "$f" ]] || return 0
  ts=$(date -u +%Y%m%dT%H%M%SZ)
  mv "$f" "${f}.corrupt-${ts}"
}
```

- [ ] **Step 3: Run all tests, verify all pass**

Run: `bash plugins/recall/tests/test_session.sh`
Expected: 9 PASS lines, then `All session tests passed`

- [ ] **Step 4: Commit**

```bash
git add plugins/recall/scripts/session.sh plugins/recall/tests/test_session.sh
git commit -m "feat(recall): session_reset + session_backup_corrupt"
```

---

## Task 5: load-config.sh — priority resolution (TDD)

**Files:**
- Create: `plugins/recall/scripts/load-config.sh`
- Create: `plugins/recall/tests/test_config.sh`

- [ ] **Step 1: Write failing test**

Create `plugins/recall/tests/test_config.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

source scripts/load-config.sh

fail() { echo "FAIL: $1" >&2; exit 1; }
pass() { echo "PASS: $1"; }

# Test 1: $RECALL_CONFIG explicit wins
echo "sources: {sprints: {path: /env/sprints}}" > "$TMPDIR/explicit.yaml"
echo "sources: {sprints: {path: /cwd/sprints}}" > "$TMPDIR/.recall.yaml"
RECALL_CONFIG="$TMPDIR/explicit.yaml" HOME="$TMPDIR/home" \
  out=$(cd "$TMPDIR" && load_config_path)
[[ "$out" == "$TMPDIR/explicit.yaml" ]] || fail "explicit RECALL_CONFIG should win, got: $out"
pass "explicit RECALL_CONFIG wins"

# Test 2: CWD .recall.yaml wins over home
mkdir -p "$TMPDIR/home"
echo "sources: {sprints: {path: /home/sprints}}" > "$TMPDIR/home/.recall.yaml"
unset RECALL_CONFIG
out=$(cd "$TMPDIR" && HOME="$TMPDIR/home" load_config_path)
[[ "$out" == "$TMPDIR/.recall.yaml" ]] || fail "CWD should win over home, got: $out"
pass "CWD .recall.yaml wins over home"

# Test 3: home fallback when no CWD
rm "$TMPDIR/.recall.yaml"
out=$(cd "$TMPDIR" && HOME="$TMPDIR/home" load_config_path)
[[ "$out" == "$TMPDIR/home/.recall.yaml" ]] || fail "home should be fallback, got: $out"
pass "home .recall.yaml is fallback"

# Test 4: empty when nothing found (caller falls back to defaults)
rm "$TMPDIR/home/.recall.yaml"
out=$(cd "$TMPDIR" && HOME="$TMPDIR/home" load_config_path)
[[ -z "$out" ]] || fail "should return empty when no config found, got: $out"
pass "empty when no config found"

echo "All config tests passed"
```

Run: `bash plugins/recall/tests/test_config.sh`
Expected: FAIL with `load-config.sh: No such file or directory`

- [ ] **Step 2: Implement load-config.sh**

Create `plugins/recall/scripts/load-config.sh`:
```bash
# load-config.sh — resolve .recall.yaml path by priority.
# Priority: $RECALL_CONFIG → ./.recall.yaml → ~/.recall.yaml → (empty: caller uses defaults)

load_config_path() {
  if [[ -n "${RECALL_CONFIG:-}" && -f "$RECALL_CONFIG" ]]; then
    echo "$RECALL_CONFIG"
    return 0
  fi
  if [[ -f "./.recall.yaml" ]]; then
    echo "$(pwd)/.recall.yaml"
    return 0
  fi
  if [[ -f "$HOME/.recall.yaml" ]]; then
    echo "$HOME/.recall.yaml"
    return 0
  fi
  echo ""
}
```

- [ ] **Step 3: Run tests, verify all pass**

Run: `bash plugins/recall/tests/test_config.sh`
Expected: 4 PASS lines, then `All config tests passed`

- [ ] **Step 4: Commit**

```bash
git add plugins/recall/scripts/load-config.sh plugins/recall/tests/test_config.sh
git commit -m "feat(recall): load-config.sh priority resolution + tests"
```

---

## Task 6: Config example + JSONSchema

**Files:**
- Create: `plugins/recall/config/recall.example.yaml`
- Create: `plugins/recall/config/recall.schema.json`

- [ ] **Step 1: Write recall.example.yaml**

Create `plugins/recall/config/recall.example.yaml`:
```yaml
# .recall.yaml — config for the `recall:ask` skill.
# Place at: $RECALL_CONFIG (env), ./.recall.yaml (CWD), or ~/.recall.yaml (home).
# Priority: env > CWD > home > built-in defaults.

sources:
  sprints:
    path: ./sprints                  # path to your sprint artifacts root
    artifact_layout:
      always_read: [PRD.md, retrospective]      # always full-read on Stage 2
      conditional_read: [evaluations, contracts, tasks]   # read if topic-relevant
      skip_by_default: [prototypes, logs, checkpoints]    # skip unless user asks

  kb:
    path: ~/recall-kb                # your knowledge-base root (optional)
    layout: zzem-kb                  # adapter: zzem-kb | none | <custom>
    domain_enum: []                  # KB reflections' `domain` field values, e.g.
                                     # [product-a, product-b, infra]

session:
  state_file: ~/.recall/session.yaml
  idle_timeout_minutes: 30
  stale_days: 7
```

- [ ] **Step 2: Write JSONSchema**

Create `plugins/recall/config/recall.schema.json`:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "recall.yaml",
  "type": "object",
  "required": ["sources"],
  "properties": {
    "sources": {
      "type": "object",
      "required": ["sprints"],
      "properties": {
        "sprints": {
          "type": "object",
          "required": ["path"],
          "properties": {
            "path": { "type": "string" },
            "artifact_layout": {
              "type": "object",
              "properties": {
                "always_read":      { "type": "array", "items": { "type": "string" } },
                "conditional_read": { "type": "array", "items": { "type": "string" } },
                "skip_by_default":  { "type": "array", "items": { "type": "string" } }
              }
            }
          }
        },
        "kb": {
          "type": "object",
          "properties": {
            "path":        { "type": "string" },
            "layout":      { "type": "string", "enum": ["zzem-kb", "none"] },
            "domain_enum": { "type": "array", "items": { "type": "string" } }
          }
        }
      }
    },
    "session": {
      "type": "object",
      "properties": {
        "state_file":           { "type": "string" },
        "idle_timeout_minutes": { "type": "integer", "minimum": 1 },
        "stale_days":           { "type": "integer", "minimum": 1 }
      }
    }
  }
}
```

- [ ] **Step 3: Verify example validates against schema**

Run:
```bash
python3 -c "
import json, yaml, jsonschema
with open('plugins/recall/config/recall.schema.json') as f: schema = json.load(f)
with open('plugins/recall/config/recall.example.yaml') as f: doc = yaml.safe_load(f)
jsonschema.validate(doc, schema)
print('OK: example validates')
"
```
Expected: `OK: example validates`

(If `jsonschema` or `yaml` not installed: `pip3 install jsonschema pyyaml` first.)

- [ ] **Step 4: Commit**

```bash
git add plugins/recall/config/
git commit -m "feat(recall): config example + JSONSchema"
```

---

## Task 7: ZZEM-specific .recall.yaml at repo root

**Files:**
- Create: `.recall.yaml`

- [ ] **Step 1: Write ZZEM config**

Create `/Users/zachryu/.superset/worktrees/zzem-orchestrator/chore/ask-knowledge/.recall.yaml`:
```yaml
# ZZEM orchestrator — recall:ask config
# Auto-resolved when CWD is the orchestrator repo root.

sources:
  sprints:
    path: ./sprint-orchestrator/sprints
    artifact_layout:
      always_read: [PRD.md, retrospective]
      conditional_read: [evaluations, contracts, tasks]
      skip_by_default: [prototypes, logs, checkpoints]

  kb:
    path: ~/.zzem/kb
    layout: zzem-kb
    domain_enum: [ai-webtoon, free-tab, ugc-platform, infra]

session:
  state_file: ~/.recall/session.yaml
  idle_timeout_minutes: 30
  stale_days: 7
```

- [ ] **Step 2: Verify it resolves**

Run:
```bash
cd /Users/zachryu/.superset/worktrees/zzem-orchestrator/chore/ask-knowledge
bash -c 'source plugins/recall/scripts/load-config.sh; load_config_path'
```
Expected: `/Users/zachryu/.superset/worktrees/zzem-orchestrator/chore/ask-knowledge/.recall.yaml`

- [ ] **Step 3: Verify it validates**

Run:
```bash
python3 -c "
import json, yaml, jsonschema
schema = json.load(open('plugins/recall/config/recall.schema.json'))
doc    = yaml.safe_load(open('.recall.yaml'))
jsonschema.validate(doc, schema)
print('OK: ZZEM .recall.yaml validates')
"
```
Expected: `OK: ZZEM .recall.yaml validates`

- [ ] **Step 4: Commit**

```bash
git add .recall.yaml
git commit -m "feat(recall): ZZEM-specific .recall.yaml at repo root"
```

---

## Task 8: SKILL.md — frontmatter + invocation surface

**Files:**
- Create: `plugins/recall/skills/ask/SKILL.md`

- [ ] **Step 1: Write SKILL.md frontmatter and intro**

Create `plugins/recall/skills/ask/SKILL.md`:
```markdown
---
name: recall:ask
description: Interactive recall over sprint artifacts and knowledge-base. Use when the user wants to query past sprint work / decisions / lessons from a fresh session ("recall qa-2 의 unblock toast 처리", "지금까지 nickname sort 손댄 sprint 다 알려줘"). Enters interview mode — successive `/recall:ask` calls within 30 minutes continue the same session.
---

# recall:ask

Interactive recall over sprint artifacts + KB. Enters a stateful interview mode the user can continue across multiple turns.

## Invocation

```
/recall:ask                   # enter mode, await question
/recall:ask <question>        # enter and run Stage 1 immediately
/recall:ask --reset           # end session (delete state file)
/recall:ask --status          # show active session metadata
```

## Inputs

- `<question>` (optional, free-text) — the user's natural-language question
- `--reset` — explicit session termination
- `--status` — read-only inspection of current session

## Preconditions

- A `.recall.yaml` config file is resolvable (env > CWD > home > defaults). For ZZEM, the repo-root `.recall.yaml` is auto-picked up when invoked from the orchestrator repo.
- Helper scripts at `<plugin>/scripts/session.sh` and `<plugin>/scripts/load-config.sh` are sourceable.
```

- [ ] **Step 2: Verify file exists and is readable**

Run: `head -20 plugins/recall/skills/ask/SKILL.md`
Expected: shows the frontmatter block.

- [ ] **Step 3: Commit**

```bash
git add plugins/recall/skills/ask/SKILL.md
git commit -m "feat(recall): SKILL.md frontmatter + invocation surface"
```

---

## Task 9: SKILL.md — entry flow + state file management

**Files:**
- Modify: `plugins/recall/skills/ask/SKILL.md`

- [ ] **Step 1: Append entry-flow section**

Append to `plugins/recall/skills/ask/SKILL.md`:
````markdown

## Entry Flow

When `/recall:ask` is invoked, follow exactly this sequence:

1. **Resolve config**

   Run via Bash:
   ```
   source <plugin>/scripts/load-config.sh && load_config_path
   ```
   If output is empty, use built-in defaults: `sources.sprints.path = ./sprints`, no KB, `session.state_file = ~/.recall/session.yaml`. Otherwise Read the resolved YAML path and parse.

2. **Inspect session state**

   Run via Bash:
   ```
   source <plugin>/scripts/session.sh && session_active && echo ACTIVE || echo INACTIVE
   ```

3. **Branch on flags**

   - `--reset`: run `session_reset`, reply `세션 종료됨.`, stop.
   - `--status` and ACTIVE: read state via `session_read`, echo `started_at / turn_count / sprint_focus / topic_focus / last_sources count`. Stop.
   - `--status` and INACTIVE: reply `활성 세션 없음.`, stop.

4. **Branch on session activity**

   - INACTIVE → start new session: write minimal state (`active: true`, `started_at: <now>`, `last_turn_at: <now>`, `turn_count: 0`).
   - ACTIVE → continue: read existing state into memory.

5. **Handle question presence**

   - No question text and entering mode: reply with greeting + recent sprint hint (list top 5 sprint dirs) + invitation to ask. Stop.
   - Question text present: proceed to Stage 1.

## State File Management

The state file at `~/.recall/session.yaml` is written **at the end of every turn that produced an answer**. Update fields:

- `last_turn_at` → current UTC timestamp
- `turn_count` → +1
- `sprint_focus` → set when user confirms a candidate (Stage 1) or implied by sprint-id in query
- `topic_focus` → keep latest user-mentioned topic
- `last_sources` → list of file paths Read this turn
- `recent_candidates` → from Stage 1 if multiple candidates were shown

If the existing state file fails to parse (yaml error), call `session_backup_corrupt` and start a new session silently.
````

- [ ] **Step 2: Verify**

Run: `grep -c "^## " plugins/recall/skills/ask/SKILL.md`
Expected: at least `4` (Invocation, Inputs, Preconditions, Entry Flow, State File Management)

- [ ] **Step 3: Commit**

```bash
git add plugins/recall/skills/ask/SKILL.md
git commit -m "feat(recall): SKILL.md entry flow + state management"
```

---

## Task 10: SKILL.md — Stage 1 Discovery

**Files:**
- Modify: `plugins/recall/skills/ask/SKILL.md`

- [ ] **Step 1: Append Stage 1 section**

Append to `plugins/recall/skills/ask/SKILL.md`:
````markdown

## Stage 1 — Discovery (cheap)

Run **two tracks in parallel** (separate Bash/Read calls in one assistant message). Track A may short-circuit; Track B always runs.

### Track A — Sprint focus

1. **Explicit sprint-id in question?**

   Glob sprint dir names from `${sources.sprints.path}` and check whether the question text contains any of them as substring.
   - Yes → set `sprint_focus = <matched id>`, skip to Stage 2.

2. **Existing sprint_focus in state?**

   - Yes, AND user did not say "다른 sprint" / "another sprint" → keep, proceed to Stage 2.

3. **Otherwise — derive candidates**

   For each `<sprint-id>` under `${sources.sprints.path}`:
   - Read `<sprint>/sprint-config.yaml` if present (full file, small).
   - Read `<sprint>/retrospective/*.md` first 30 lines only (use `Read` with `limit: 30`).
   - Score by lexical/substring match between question keywords and (a) sprint-id, (b) sprint-config name/title, (c) retrospective heading text.

   Produce **top 3-5** candidates ranked by score.

4. **Multiple candidates?**

   If top score is not clearly higher than next, ask the user to confirm:

   ```
   다음 후보 중 어디부터 볼까요?
   1) <sprint-id-A> — <one-line reason>
   2) <sprint-id-B> — <one-line reason>
   3) <sprint-id-C> — <one-line reason>
   ```

   Persist `recent_candidates` to state. **Stop** — wait for the user's next `/recall:ask` turn.

5. **Single confident match** → set `sprint_focus`, proceed to Stage 2.

### Track B — KB matching (always runs)

If `sources.kb.path` is set:

1. Glob `${kb.path}/learning/reflections/*.md`.
2. Read frontmatter + first 20 lines of each. Match `domain` against `domain_enum` if topic implies one; otherwise lexical-match against question keywords.
3. Glob `${kb.path}/learning/patterns/*.yaml`. Match against `name` / `tags` / `category`.
4. Pick top **K=3** of each. Stage 2 will full-read them.

Track B never blocks Track A's clarification — KB matches accompany the answer, they don't decide sprint focus.
````

- [ ] **Step 2: Verify**

Run: `grep -c "Stage 1" plugins/recall/skills/ask/SKILL.md`
Expected: ≥ 2 (Stage 1 in entry flow + section header)

- [ ] **Step 3: Commit**

```bash
git add plugins/recall/skills/ask/SKILL.md
git commit -m "feat(recall): SKILL.md Stage 1 Discovery"
```

---

## Task 11: SKILL.md — Stage 2 Targeted retrieval

**Files:**
- Modify: `plugins/recall/skills/ask/SKILL.md`

- [ ] **Step 1: Append Stage 2 section**

Append to `plugins/recall/skills/ask/SKILL.md`:
````markdown

## Stage 2 — Targeted retrieval (full)

For the confirmed `sprint_focus`, full-Read these paths under `${sprint_focus}/`:

| Path | When to Read |
|---|---|
| `PRD.md` | Always (if exists) |
| `retrospective/*.md` | Always |
| `evaluations/*.md` | If question topic keyword appears in any filename or first 50 lines |
| `contracts/*.md` | If question touches API / data shape (keywords: API, contract, schema, type, response, payload) |
| `tasks/*.md` | If question is task-shaped ("어떤 task", "what was done about X") |
| `prototypes/*` | Skip by default (large). Only if user explicitly asks for prototypes. |
| `logs/*` | Skip by default. Only on explicit ask. |
| `checkpoints/*` | Skip by default. Only on explicit ask. |

For KB Track B candidates from Stage 1: full-Read them (they were already filtered to top K).

After Reads, synthesize the answer.

**Important:** track every absolute file path you Read this turn — they go into `last_sources` and the user-facing **Sources** block.
````

- [ ] **Step 2: Verify**

Run: `grep -c "Stage 2" plugins/recall/skills/ask/SKILL.md`
Expected: ≥ 2

- [ ] **Step 3: Commit**

```bash
git add plugins/recall/skills/ask/SKILL.md
git commit -m "feat(recall): SKILL.md Stage 2 Targeted retrieval"
```

---

## Task 12: SKILL.md — Output format + Failure modes + End-of-turn

**Files:**
- Modify: `plugins/recall/skills/ask/SKILL.md`

- [ ] **Step 1: Append output / failure / end-of-turn sections**

Append to `plugins/recall/skills/ask/SKILL.md`:
````markdown

## Output Format (per answer turn)

```
<답변 본문 — 자연어, 짧고 직접적. 파일 인용 시 file_path:line>

---
**Sources**
- <abs-path-1>
- <abs-path-2>

**관련 follow-up 제안** (1-3개, optional)
- "..."
```

- `Sources` is **always** shown — verification + hallucination guard.
- `follow-up` only when there's a natural next question.

## End-of-Turn

After replying with an answer, immediately update the state file via Bash:

```bash
source <plugin>/scripts/session.sh
session_write "$(cat <<EOF
active: true
started_at: <existing-or-now>
last_turn_at: <now>
turn_count: <prev+1>
sprint_focus: <id-or-null>
topic_focus: <topic>
last_sources:
  - <path-1>
  - <path-2>
recent_candidates:
  - <id-or-empty>
EOF
)"
```

## Failure Modes

| Situation | Action |
|---|---|
| 0 sprint candidates after Track A | Reply: `찾지 못했습니다. 전체 sprint 목록 보여드릴까요?` Show top-level dir list. |
| State file parse error | Run `session_backup_corrupt`, start fresh session silently. |
| Individual file Read fails (Stage 1 or 2) | Skip + log a one-liner; never abort. |
| KB path missing or `layout: none` | Skip Track B silently. |
| sprint-config.yaml missing | Use dir name + retrospective only for that candidate. |
| `--status` with no active session | Reply: `활성 세션 없음.` |

## Out of Scope (v1)

- App repo code grep
- Jira ticket lookup
- Git commit history search
- Semantic search (v1 is lexical/substring)
- Multi-sprint comparison answers
````

- [ ] **Step 2: Verify all sections present**

Run: `grep "^## " plugins/recall/skills/ask/SKILL.md`
Expected output includes lines for: Invocation, Inputs, Preconditions, Entry Flow, State File Management, Stage 1 — Discovery (cheap), Stage 2 — Targeted retrieval (full), Output Format (per answer turn), End-of-Turn, Failure Modes, Out of Scope (v1)

- [ ] **Step 3: Commit**

```bash
git add plugins/recall/skills/ask/SKILL.md
git commit -m "feat(recall): SKILL.md output format + failure modes"
```

---

## Task 13: install.sh / uninstall.sh

**Files:**
- Create: `plugins/recall/scripts/install.sh`
- Create: `plugins/recall/scripts/uninstall.sh`

- [ ] **Step 1: Write install.sh**

Create `plugins/recall/scripts/install.sh`:
```bash
#!/usr/bin/env bash
# install.sh — symlink the recall plugin into ~/.claude/skills/recall/
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="$HOME/.claude/skills/recall"

mkdir -p "$HOME/.claude/skills"

if [[ -L "$TARGET_DIR" ]]; then
  current=$(readlink "$TARGET_DIR")
  if [[ "$current" == "$PLUGIN_DIR/skills" ]]; then
    echo "already linked: $TARGET_DIR -> $current"
    exit 0
  fi
  echo "removing stale symlink: $TARGET_DIR -> $current"
  rm "$TARGET_DIR"
elif [[ -e "$TARGET_DIR" ]]; then
  echo "ERROR: $TARGET_DIR exists and is not a symlink. Aborting." >&2
  exit 1
fi

ln -s "$PLUGIN_DIR/skills" "$TARGET_DIR"
echo "linked: $TARGET_DIR -> $PLUGIN_DIR/skills"
echo "Restart Claude Code session to pick up the new skill."
```

- [ ] **Step 2: Write uninstall.sh**

Create `plugins/recall/scripts/uninstall.sh`:
```bash
#!/usr/bin/env bash
# uninstall.sh — remove the recall plugin symlink
set -euo pipefail

TARGET_DIR="$HOME/.claude/skills/recall"

if [[ -L "$TARGET_DIR" ]]; then
  rm "$TARGET_DIR"
  echo "removed: $TARGET_DIR"
elif [[ -e "$TARGET_DIR" ]]; then
  echo "ERROR: $TARGET_DIR exists and is not a symlink. Inspect manually." >&2
  exit 1
else
  echo "not installed: $TARGET_DIR does not exist"
fi
```

- [ ] **Step 3: Make executable + smoke**

```bash
chmod +x plugins/recall/scripts/install.sh plugins/recall/scripts/uninstall.sh
```

Run install in a temp HOME to verify:
```bash
TMPHOME=$(mktemp -d)
HOME="$TMPHOME" bash plugins/recall/scripts/install.sh
ls -la "$TMPHOME/.claude/skills/"
HOME="$TMPHOME" bash plugins/recall/scripts/uninstall.sh
[[ ! -e "$TMPHOME/.claude/skills/recall" ]] && echo "OK: uninstall removed link"
rm -rf "$TMPHOME"
```
Expected: install prints `linked: ...`, ls shows `recall -> .../plugins/recall/skills`, uninstall prints `removed: ...`, final `OK`.

- [ ] **Step 4: Commit**

```bash
git add plugins/recall/scripts/install.sh plugins/recall/scripts/uninstall.sh
git commit -m "feat(recall): install/uninstall symlink scripts"
```

---

## Task 14: Plugin README (OSS)

**Files:**
- Create: `plugins/recall/README.md`

- [ ] **Step 1: Write README**

Create `plugins/recall/README.md`:
````markdown
# recall

Interactive recall over project artifacts. Ask Claude about past sprint work, decisions, and lessons from a fresh session — get answers in interview mode.

## What it does

`/recall:ask` enters a stateful interview mode. Successive `/recall:ask` calls within 30 minutes continue the same session — same sprint focus, accumulating context. Idle past 30 minutes or call `--reset` to start fresh.

It searches two sources:
1. **Sprint artifacts** — your sprint output tree (`PRD.md`, `retrospective/`, `evaluations/`, `contracts/`, `tasks/`)
2. **Knowledge base** (optional) — reflections and patterns

## Install

```bash
git clone <this-repo>
cd <this-repo>
bash plugins/recall/scripts/install.sh
```

This symlinks `~/.claude/skills/recall` to `plugins/recall/skills`. Restart Claude Code.

## Configure

Create `.recall.yaml` (CWD or `~/`):

```yaml
sources:
  sprints:
    path: ./sprints                  # required
  kb:
    path: ~/my-kb                    # optional
    layout: zzem-kb                  # zzem-kb | none
```

See `plugins/recall/config/recall.example.yaml` for the full schema.

## Usage

```
/recall:ask                   enter mode
/recall:ask <question>        ask immediately
/recall:ask --reset           end session
/recall:ask --status          show session metadata
```

Examples:
- `/recall:ask qa-2 의 unblock toast 어떻게 끝났더라?`
- `/recall:ask 지금까지 X 기능 손댄 sprint 다 알려줘`
- `/recall:ask --reset`

Every answer ends with a **Sources** block listing the files Claude read — so you can verify.

## Tests

```bash
bash plugins/recall/tests/test_session.sh
bash plugins/recall/tests/test_config.sh
```

## License

MIT (or whatever the parent repo uses).
````

- [ ] **Step 2: Commit**

```bash
git add plugins/recall/README.md
git commit -m "docs(recall): plugin README for OSS distribution"
```

---

## Task 15: Smoke verification

**Files:**
- Create: `plugins/recall/tests/smoke.md`

- [ ] **Step 1: Write smoke scenarios doc**

Create `plugins/recall/tests/smoke.md`:
````markdown
# recall:ask smoke scenarios

Run these manually after install. Verify each behaves as described in the spec
(`docs/superpowers/specs/2026-04-28-recall-ask-design.md`).

## Pre-req

```bash
bash plugins/recall/scripts/install.sh
# Restart Claude Code session.
# Ensure CWD is the orchestrator repo root so .recall.yaml is picked up.
rm -f ~/.recall/session.yaml
```

## Scenarios

### 1. Explicit sprint-id

```
/recall:ask qa-2 의 unblock toast 어떻게 처리됐어?
```

Expected: Stage 1 short-circuits (Track A finds `qa-2` substring → maps to `ugc-platform-integration-qa-2`). Stage 2 reads PRD/retrospective/evaluations matching "unblock toast". Answer + **Sources** block shown.

### 2. Ambiguous query → candidate list

```
/recall:ask --reset
/recall:ask unblock toast
```

Expected: 2-3 candidates listed with one-line reasons. State file updated with `recent_candidates`. Skill stops, awaits user pick.

### 3. Continue session (sprint_focus retained)

After scenario 1:
```
/recall:ask 그 결정 KB pattern 도 보여줘
```

Expected: `sprint_focus = ugc-platform-integration-qa-2` retained from state. KB `learning/reflections` + `learning/patterns` matched + read. Answer + Sources.

### 4. Idle timeout

```bash
# Manually set last_turn_at to 45min ago:
python3 -c "
import datetime, yaml, os
p = os.path.expanduser('~/.recall/session.yaml')
d = yaml.safe_load(open(p))
d['last_turn_at'] = (datetime.datetime.utcnow()-datetime.timedelta(minutes=45)).strftime('%Y-%m-%dT%H:%M:%SZ')
yaml.safe_dump(d, open(p, 'w'))
"
```
Then:
```
/recall:ask 003 의 nickname sort 어떻게 됐어?
```

Expected: Skill detects idle, starts fresh. `sprint_focus` set to `ugc-platform-003` via Stage 1.

### 5. No match

```
/recall:ask 이런 토픽 절대 없을걸 zzz
```

Expected: `찾지 못했습니다. 전체 sprint 목록 보여드릴까요?` followed by sprint dir list.

### 6. Status

```
/recall:ask --status
```

Expected: prints `started_at / turn_count / sprint_focus / topic_focus / last_sources count`. Or `활성 세션 없음.` if reset.

### 7. Reset

```
/recall:ask --reset
```

Expected: `세션 종료됨.` State file deleted. `/recall:ask --status` afterward → `활성 세션 없음.`

## Pass criteria

All 7 scenarios behave as expected. Any deviation → file an issue with screenshot of the answer + state file contents.
````

- [ ] **Step 2: Run scenarios 1, 5, 6, 7 (the script-checkable ones)**

Manually run scenarios 1, 5, 6, 7 in a real Claude session against the current ZZEM data. Note results in a quick log.

(Scenarios 2, 3, 4 require a multi-turn session — verify when you have a few minutes.)

- [ ] **Step 3: Commit smoke doc + final cleanup commit**

```bash
git add plugins/recall/tests/smoke.md
git commit -m "test(recall): smoke verification scenarios"
```

---

## Self-Review Checklist

Run these mentally after writing all tasks:

1. **Spec coverage**
   - [x] Plugin name `recall:ask` — Task 8
   - [x] Invocation surface — Task 8
   - [x] State file schema — Tasks 2-4 (helpers) + Task 9 (SKILL.md docs)
   - [x] Stage 1 Discovery (Track A + B) — Task 10
   - [x] Stage 2 Targeted retrieval — Task 11
   - [x] Output Format with always-on Sources — Task 12
   - [x] OSS Portability config layer — Tasks 5, 6
   - [x] Failure modes — Task 12
   - [x] Verification (7 smoke scenarios) — Task 15
   - [x] Acceptance criteria covered by tasks 2-4 (state lifecycle), 5-7 (config + ZZEM default), 12 (Sources always, graceful skip)

2. **Placeholder scan** — none ("TBD"/"TODO" only appear in Open Questions section of *spec*, not plan).

3. **Type/name consistency** — `session_active`, `session_read`, `session_write`, `session_reset`, `session_backup_corrupt`, `session_path` used identically across Tasks 2, 3, 4, 9, 12. `load_config_path` used identically Tasks 5, 7, 9. `sprint_focus`, `topic_focus`, `last_sources`, `recent_candidates` schema fields consistent across spec + Tasks 9, 12.

No issues found.
