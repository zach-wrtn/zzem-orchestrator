# Phase 1 Checkpoint — preview-feature

## Status: ✓ Complete (2026-04-26)

## Created
- Sprint directory: `sprint-orchestrator/sprints/preview-feature/`
- `PRD.md` — KB canonical PRD 링크 + scope summary (US-1/2/3, AC 20개, BR-1~12, 3-tier boundary)
- `sprint-config.yaml` — repos: backend(apple) + app(main) + tokens(symlink)
- Subdirs: `tasks/{app,backend}/`, `contracts/`, `evaluations/`, `prototypes/app/`, `checkpoints/`, `logs/`

## Worktrees
- `backend/` → `~/dev/work/wrtn-backend` worktree, branch `sprint/preview-feature` from `origin/apple` (HEAD 5577451d)
- `app/` → `~/dev/work/app-core-packages` worktree, branch `sprint/preview-feature` from `origin/main` (HEAD 63436697b)
- `tokens/` → symlink to `~/dev/work/wds-tokens` (read-only)

## Decisions Recorded
- App base branch changed from initial `apple` proposal → `main` (no `apple` branch in app-core-packages; preview-feature has no ugc/APOLO epic dependency).
- Backend stays on `apple` (ZZEM main release).
- User scope: this run is **prototype-phase only** (Phase 1~3). Phase 4~6 deferred.

## Canonical PRD Reference
`~/.zzem/kb/products/preview-feature/prd.md` (Notion mirror, owner Walter, draft, 2026-04-23).

## Next: Phase 2 — Spec
Generate sprint-contract, AC↔task mapping, api-contract.yaml, evaluation criteria.
