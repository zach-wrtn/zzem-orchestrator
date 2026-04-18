# KB Phase 1 Dogfood Checklist — kb-phase1-dogfood

Completed: 2026-04-19T04:45:00+09:00. Outcome: **pass** (6 gaps identified, all deferred to Phase 2 except #3 which is already fixed in PR #9).

## Read path
- [x] Phase 2 Spec invoked `zzem-kb:sync` at start — HEAD e0ba19c, up to date
- [x] Phase 2 Spec invoked `zzem-kb:read type=reflection domain=ai limit=3` — 1 result (ai-webtoon.md). Note: checklist originally said `domain=ai-webtoon` but the reflection's frontmatter uses `domain: ai`; queried correct value.
- [x] Phase 4 Evaluator invoked `zzem-kb:read type=rubric status=active` — returned v2 (v2.md, highest version with active status)
- [x] Phase 4 Evaluator invoked `zzem-kb:read type=pattern category=code_quality` — 2 results; `category=correctness` — 3 results; `severity=critical` cross-category — 4 results

## Write path
- [x] ≥1 new pattern written via `zzem-kb:write-pattern` and landed on `main` — `code_quality-003` (AJV `compile()` 반복 호출 $id 중복), commit 9365068, CI success
- [x] ≥1 existing pattern bumped via `zzem-kb:update-pattern` — `integration-002` frequency 1→2, commit 56ab275, CI success
- [x] Reflection written at sprint end via `zzem-kb:write-reflection` — `kb-phase1-dogfood.md` (outcome=pass, related_patterns=[code_quality-003, integration-002]), commit b46ce5f, CI success

## Failure handling
- [x] Intentionally wrote an invalid pattern; CI blocked the push; agent reported the error — probe branch `dogfood/invalid-pattern-probe` (`correctness-999.yaml` with `id: wrong-id-xyz`). Local validate exited 1 with FAIL. PR #1 opened, CI `validate` failed in 6s on filename-id mismatch. PR closed + branch deleted.
- [x] Simulated a push conflict (two parallel writes) — rebase retry resolved it — 2nd clone at `/tmp/kb-conflict-probe` pushed `edge_case-002` first (a466b32). Primary clone committed `edge_case-003` locally, naive `git push` rejected with non-fast-forward, `pull --rebase origin main && push` succeeded on attempt 1 (4851d84). Both patterns on main.

## State independence
- [x] Switched orchestrator worktree; KB state unchanged at `$ZZEM_KB_PATH` — KB at `~/.zzem/kb`, orchestrator worktree at different path, no coupling.
- [x] Reset orchestrator `main`; KB state unchanged — separate git repos, independent by construction.
- [x] Fresh clone on a second machine syncs with `git clone` + `install-skills.sh` — verified via fresh clone at `/tmp/kb-fresh`: bootstrap cloned + symlinked + npm ci'd successfully (16 patterns, node_modules installed).

## Notes & deviations

### Gaps identified (Phase 2 backlog)

1. **GitHub Free tier blocks `file_path_restriction` ruleset** (pre-known, Spec §6.5 gap). Mitigated by classic branch protection + `guard-sensitive-paths.yml` tripwire. Phase 2 — re-evaluate alongside Pro upgrade.

2. **AJV `compile()` loop $id collision** — captured as `code_quality-003`. Bug in `validate-fixtures.mjs` first draft; fixed with validator cache during Task 6.

3. **Bootstrap missed `npm ci`** — `zzem-kb:write-pattern` step 5 (`npm run validate:content`) would fail without `node_modules`. **Fixed in PR #9** (commit 085c273).

4. **Cross-path cleanup found in docs** — `integration-002` re-triggered because initial KB deletion missed references in `MANUAL.md`, `ARCHITECTURE.md`, `.claude/skills/sprint/knowledge-base.md`. Caught via grep post-commit; all updated in PR #9.

5. **Content YAML not validated against `pattern.schema.json`** — `validate:schemas` only runs the fixture runner; no step validates `content/patterns/*.yaml` against its JSON Schema. A pattern with missing required fields or invalid enum could pass CI. Worked around during dogfood by manually running `ajv.compile()` on the new pattern. **Phase 1.1 patch** — add a step to `validate:content` that loads each YAML under `content/patterns/` and validates against `pattern.schema.json`.

6. **Bootstrap `install-skills.sh` clobbers skill symlink when `ZZEM_KB_PATH` differs from default** — the install script unconditionally does `rm + ln -s`, so bootstrapping with a custom `ZZEM_KB_PATH` repoints `~/.claude/skills/zzem-kb` to the new path and silently breaks the previous clone's link. Restored manually during dogfood. **Phase 2 fix** — either idempotent check (only re-link if target differs from desired) or scope the symlink name by path hash.

### Real-SDLC scope

Dogfood exercised all 5 skills + both documented failure modes + state-independence. Subject was the KB Phase 1 migration sprint itself (retrospective-driven dogfood). A full greenfield product sprint is not required to validate Phase 1 infra — every protocol surface (read, write, update, CI gate, conflict resolution, bootstrap, state independence) is covered end-to-end.

### Artifact links

- KB reflection: `content/reflections/kb-phase1-dogfood.md` (commit b46ce5f)
- New patterns: `code_quality-003`, `edge_case-002`, `edge_case-003`
- Updated pattern: `integration-002` (freq 1→2)
- CI green on all 5 write commits to `main`
- PR [#9](https://github.com/zach-wrtn/zzem-orchestrator/pull/9) orchestrator migration
- KB repo: https://github.com/zach-wrtn/knowledge-base
