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
