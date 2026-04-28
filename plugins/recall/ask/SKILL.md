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
- Helper scripts at `~/.claude/skills/recall/scripts/session.sh` and `~/.claude/skills/recall/scripts/load-config.sh` are sourceable.

## Entry Flow

When `/recall:ask` is invoked, follow exactly this sequence:

1. **Resolve config**

   Run via Bash:
   ```
   source ~/.claude/skills/recall/scripts/load-config.sh && load_config_path
   ```
   If output is empty, use built-in defaults: `sources.sprints.path = ./sprints`, no KB, `session.state_file = ~/.recall/session.yaml`. Otherwise Read the resolved YAML path and parse.

2. **Inspect session state**

   Run via Bash:
   ```
   source ~/.claude/skills/recall/scripts/session.sh && session_active && echo ACTIVE || echo INACTIVE
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
source ~/.claude/skills/recall/scripts/session.sh
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
| Session stale (> 7 days) | session_active returns INACTIVE; Entry Flow starts a fresh session silently. |
| Legacy KB layout (e.g., `events.yaml`) | Print a one-line deprecation note and continue (`zzem-kb:read` pattern). |

## Out of Scope (v1)

- App repo code grep
- Jira ticket lookup
- Git commit history search
- Semantic search (v1 is lexical/substring)
- Multi-sprint comparison answers
