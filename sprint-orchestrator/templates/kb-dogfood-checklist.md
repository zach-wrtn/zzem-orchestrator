# KB Phase 1 Dogfood Checklist

Copy this file to `sprint-orchestrator/sprints/<sprint-id>/kb-dogfood.md` at sprint start.

## Read path
- [ ] Phase 2 Spec invoked `zzem-kb:sync` at start
- [ ] Phase 2 Spec invoked `zzem-kb:read type=reflection domain=<domain> limit=3` — got expected results
- [ ] Phase 4 Evaluator invoked `zzem-kb:read type=rubric status=active` — loaded latest rubric
- [ ] Phase 4 Evaluator invoked `zzem-kb:read type=pattern category=...` — got relevant patterns

## Write path
- [ ] ≥1 new pattern written via `zzem-kb:write-pattern` and landed on `main`
- [ ] ≥1 existing pattern bumped via `zzem-kb:update-pattern`
- [ ] Reflection written at sprint end via `zzem-kb:write-reflection`

## Failure handling
- [ ] Intentionally wrote an invalid pattern; CI blocked the push; agent reported the error
- [ ] Simulated a push conflict (two parallel writes) — rebase retry resolved it

## State independence
- [ ] Switched orchestrator worktree; KB state unchanged at `$ZZEM_KB_PATH`
- [ ] Reset orchestrator `main`; KB state unchanged
- [ ] Fresh clone on a second machine syncs with `git clone` + `install-skills.sh`

## Notes & deviations

(Record anything surprising here — inform Phase 2 brainstorming.)
