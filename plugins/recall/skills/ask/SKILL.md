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
