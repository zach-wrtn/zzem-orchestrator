# QA-Fix Workflow Fixture

This is a dry-run fixture for the QA-Fix workflow (`.claude/skills/sprint/phase-qa-fix.md`).

**Not a real sprint.** Used to validate the workflow's outputs without a live Jira connection.

## Usage

```bash
# Dry-run from this snapshot (Sprint Lead reads jira-snapshot.yaml directly instead of calling Jira)
/sprint qa-fix-fixture --phase=qa-fix --dry-run --use-snapshot
```

> Note: `--use-snapshot` is a future flag that lets the workflow read from an existing
> `jira-snapshot.yaml` instead of calling the Jira MCP. If not yet implemented, the
> Sprint Lead should manually skip Stage 1 fetch and proceed from triage.

## Expected Outputs

After a successful dry-run, the following files should exist:
- `qa-fix/triage.md` — with FIXTURE-1 + FIXTURE-2 in-scope, FIXTURE-3 deferred
- `qa-fix/groups/group-1.yaml` — both in-scope tickets bundled (or split if grouping rationale differs)
- `qa-fix/contracts/group-1.md` — group contract
- (post-build) `qa-fix/jira-comments/FIXTURE-1.md` — local SSOT, no `.posted` marker (dry-run)
- (post-build) `qa-fix/kb-candidates/FIXTURE-1.yaml` — P0 candidate
- `qa-fix/retro.md`

Inspect outputs and verify:
1. Local SSOT comments are well-formed (template fields filled)
2. KB candidate yaml uses correct zzem-kb category enum
3. No `.posted` marker exists (dry-run blocks the post)
4. Retro Pattern Digest counts match: 2 P0/P1 + 1 P3 (deferred)
