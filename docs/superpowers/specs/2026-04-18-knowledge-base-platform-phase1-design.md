# Knowledge Base Platform — Phase 1 Design

**Status:** Draft v1
**Date:** 2026-04-18
**Author:** zach-wrtn (brainstormed with Claude)
**Scope:** Phase 1 only (Platform Core + existing KB migration). Phase 2~4 out of scope.

---

## 1. Overview

### 1.1 Motivation

The orchestrator's knowledge base currently lives as YAML/Markdown files under
`sprint-orchestrator/knowledge-base/` inside the orchestrator git repo. This
couples KB state to the orchestrator's branch, worktree, and reset cycles:

- The 2026-04-09 full reset lost the non-committed portion of the KB; it had to
  be manually regenerated.
- Multiple worktrees see diverging KB state.
- Team members must keep the orchestrator checkout in a particular state to
  share KB content.
- The KB is limited to agent-tuning sources (patterns, rubrics, reflections). A
  broader machine-readable document surface (PRDs, event specs, future types)
  has no home today.

### 1.2 Long-Term Vision (C from brainstorm)

A **team-wide machine-readable document platform** spanning agent KB, PRDs,
event-logging specs, and additional future content types, consumed primarily by
orchestrator agents (machine-first).

### 1.3 Phase Decomposition

| Phase | Scope | Delivers |
|-------|-------|----------|
| **1** | Platform Core + existing KB migration | This spec |
| 2 | PRD integration (Notion ↔ KB sync) | Separate spec, blocked on Phase 1 |
| 3 | Event-logging spec registry | Separate spec |
| 4 | General content-type expansion + human review dashboard | Separate spec |

Only Phase 1 is designed in this document. Phases 2~4 are re-entered through
their own brainstorming + writing-plans cycles after Phase 1 exit.

### 1.4 Phase 1 Goals

1. Host the team KB in a standalone, state-independent store.
2. Machine-first interface: agents read and write via deterministic skills, not
   inline bash recipes.
3. Enforce strict schemas for all content at commit time.
4. Migrate the 18 existing files (13 patterns, 2 rubrics, 3 reflections) into
   the new store without loss.
5. Remove the file-based KB from `sprint-orchestrator/` after one dogfood
   sprint.

### 1.5 Non-Goals

- Semantic search (pgvector, embeddings) — deferred; YAGNI at current scale.
- Real-time sync to external clients — agents are batch, pull-on-phase-start
  suffices.
- Human-facing review UI beyond GitHub PR pages — deferred to Phase 4.
- Content types beyond pattern / rubric / reflection — deferred to Phases 2~4.
- SDK / client library — agents use native Read/Write/Bash plus Skills.
- Bot GitHub App / machine user — developer credentials suffice at Phase 1.
- Dashboards / observability infra — manual monthly review is enough.

### 1.6 Design Decisions (locked during brainstorm)

| Decision | Choice | Rejected alternatives | Reason |
|----------|--------|-----------------------|--------|
| Primary user | Machine-first (agents) | Human-first, Hybrid | Agents are the dominant reader/writer; schema strictness beats editing UX. |
| Storage | Git repository (GitHub) | Managed Postgres (Supabase), Firestore, SQLite/Turso, Notion | Workload is ~100s of static structured files with low write rate. Git gives free history, diff, PR review, and zero infra ops. |
| Interface | Claude Code **skills** | Inline PROTOCOL.md recipes, SDK library | Skills are executable procedures; prose protocols drift, SDKs add wrapper with no value over native tools. |
| Skill distribution | Inside KB repo (`skills/`) | Separate Claude plugin | Co-versioning with schemas eliminates drift between protocol and content format. |
| Index file | `MANIFEST.json` **deferred to Phase 1.5** | Included in v0 | ~18 files today; `Glob`+`Read` is fast enough. Add when file count exceeds ~100. |
| Auth | Developer GitHub credentials | Shared bot account, GitHub App | Existing per-dev credentials suffice; attribution preserved in git log. |
| Branch protection | Direct push to `main` for `content/`; PR + CODEOWNERS for `schemas/` `skills/` `scripts/` `.github/` | PR-required for everything, no protection | Agent write volume demands low friction on content; protocol/schema changes need human gate. |

---

## 2. Architecture

### 2.1 Repository Layout

A new private GitHub repository: `zzem-org/knowledge-base`.

```
zzem-knowledge-base/
├── README.md                           # Human entry point
├── schemas/                            # JSON Schema (draft-2020-12)
│   ├── pattern.schema.json
│   ├── rubric.schema.json
│   └── reflection.schema.json
├── content/
│   ├── patterns/{category}-{NNN}.yaml
│   ├── rubrics/v{N}.md
│   └── reflections/{sprint-id}.md
├── archived/                           # Frequency<3 & 3+ sprints unseen
│   └── patterns/
├── skills/                             # Claude Code skills (single source of truth for protocol)
│   ├── sync/SKILL.md
│   ├── read/SKILL.md
│   ├── write-pattern/SKILL.md
│   ├── update-pattern/SKILL.md
│   └── write-reflection/SKILL.md
├── scripts/
│   ├── install-skills.sh               # Symlinks skills into ~/.claude/skills/zzem-kb/
│   ├── migrate-from-orchestrator.mjs   # One-shot seed from sprint-orchestrator/
│   ├── validate-markdown-frontmatter.mjs
│   ├── validate-filename-id-match.mjs
│   ├── validate-unique-ids.mjs
│   ├── validate-schema-backwards-compat.mjs
│   └── validate-skill-frontmatter.mjs
├── tests/
│   └── fixtures/                       # Intentionally invalid payloads for negative tests
├── .github/
│   ├── workflows/
│   │   ├── validate.yml
│   │   └── guard-sensitive-paths.yml
│   └── CODEOWNERS
├── .pre-commit-config.yaml             # Optional local install
└── .gitignore
```

### 2.2 Consumer-Side Layout

Each orchestrator installation (dev machine, CI environment) holds a local
clone at a conventional path.

```
$HOME/.zzem/kb/                         # Default; overridable via ZZEM_KB_PATH
├── .git/
├── schemas/
├── content/
├── skills/
└── ...
```

A bootstrap script in the orchestrator repo (`scripts/kb-bootstrap.sh`) ensures
the clone exists and has been symlinked into `~/.claude/skills/zzem-kb/` before
any sprint phase runs.

### 2.3 Why Independent Repo (not a subdirectory)

- State independence from orchestrator branches / resets / worktrees (the
  primary motivation for the project).
- Own permission model and CODEOWNERS.
- Own CI lifecycle (validate runs per KB change, not per orchestrator change).
- Own release cadence.

---

## 3. Content Types & Schemas

### 3.1 Phase 1 Content Types

| Type | Format | Filename | Validation |
|------|--------|----------|------------|
| **pattern** | YAML | `content/patterns/{category}-{NNN}.yaml` | Full structure JSON Schema |
| **rubric** | Markdown + YAML frontmatter | `content/rubrics/v{N}.md` | Frontmatter only |
| **reflection** | Markdown + YAML frontmatter | `content/reflections/{sprint-id}.md` | Frontmatter only |

Rationale: rubric and reflection bodies are narrative prose. Validating the
prose adds friction without value; validating only the structured frontmatter
captures the invariants we care about (version, status, sprint id, outcome).

### 3.2 `pattern.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://zzem-org.github.io/knowledge-base/schemas/pattern.schema.json",
  "title": "Pattern",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id", "title", "category", "severity", "source_sprint",
    "discovered_at", "frequency", "last_seen",
    "description", "detection", "prevention", "contract_clause",
    "schema_version"
  ],
  "properties": {
    "id":              { "type": "string",
                         "pattern": "^(correctness|completeness|integration|edge_case|code_quality|design_proto|design_spec)-[0-9]{3}$" },
    "title":           { "type": "string", "maxLength": 120 },
    "category":        { "enum": ["correctness","completeness","integration","edge_case","code_quality","design_proto","design_spec"] },
    "severity":        { "enum": ["critical","major","minor"] },
    "source_sprint":   { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "source_group":    { "type": "string", "pattern": "^group-[0-9]+$" },
    "discovered_at":   { "type": "string", "format": "date-time" },
    "frequency":       { "type": "integer", "minimum": 1 },
    "last_seen":       { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "description":     { "type": "string", "minLength": 10 },
    "detection":       { "type": "string", "minLength": 10 },
    "prevention":      { "type": "string", "minLength": 10 },
    "contract_clause": { "type": "string", "minLength": 10 },
    "example": {
      "type": "object",
      "required": ["bad","good"],
      "properties": { "bad": {"type":"string"}, "good": {"type":"string"} }
    },
    "schema_version":  { "const": 1 }
  }
}
```

Differences from today's informal YAML:

- `id` pattern enforces the category prefix, preventing silent mismatch between
  filename and body.
- `additionalProperties: false` rejects typo'd keys.
- `schema_version` is required so future migrations can branch on version.

### 3.3 `rubric.schema.json` (frontmatter only)

```json
{
  "type": "object",
  "required": ["version", "status", "superseded_by", "schema_version"],
  "additionalProperties": false,
  "properties": {
    "version":        { "type": "integer", "minimum": 1 },
    "status":         { "enum": ["active", "superseded"] },
    "superseded_by":  { "type": ["integer","null"] },
    "changelog":      { "type": "string" },
    "schema_version": { "const": 1 }
  }
}
```

File example:

```markdown
---
version: 2
status: active
superseded_by: null
changelog: "v1 대비 completeness 세부화"
schema_version: 1
---

# Rubric v2

(Narrative body — free form)
```

### 3.4 `reflection.schema.json` (frontmatter only)

```json
{
  "type": "object",
  "required": ["sprint_id", "domain", "completed_at", "outcome", "schema_version"],
  "additionalProperties": false,
  "properties": {
    "sprint_id":         { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "domain":            { "type": "string" },
    "completed_at":      { "type": "string", "format": "date-time" },
    "outcome":           { "enum": ["pass", "fail", "partial"] },
    "related_patterns":  {
      "type": "array",
      "items": { "type": "string", "pattern": "^(correctness|completeness|integration|edge_case|code_quality|design_proto|design_spec)-[0-9]{3}$" }
    },
    "schema_version":    { "const": 1 }
  }
}
```

### 3.5 Schema Versioning Policy

- Every content file carries `schema_version: N` in body (patterns) or
  frontmatter (rubrics / reflections).
- Schema files themselves are versioned by git. Archived past versions are
  preserved at `schemas/archived/{type}.v{N}.schema.json` once a breaking
  change is cut.
- **Breaking change procedure:**
  1. Open PR authoring the new schema as `schemas/{type}.schema.json` (v2).
  2. Move previous `schemas/{type}.schema.json` to `schemas/archived/{type}.v1.schema.json`.
  3. Add `scripts/migrate-{type}-v1-to-v2.mjs`.
  4. Run migration, update all affected content files in the same PR.
  5. CI runs new schema against all content (strict mode).
  6. Land as single atomic PR.

Non-breaking additions (new optional field) can be made without bumping
`schema_version`.

---

## 4. Skills (The Protocol)

### 4.1 Skill Inventory

| Skill | Purpose | Invoked during |
|-------|---------|----------------|
| `zzem-kb:sync` | `git pull --ff-only` on local clone | Start of every sprint phase before any KB read |
| `zzem-kb:read` | Query by type / category / severity / sprint-domain | Phase 2 Spec, Phase 4 Evaluator |
| `zzem-kb:write-pattern` | Create new pattern file → validate → commit → push with rebase retry | Phase 4 Evaluator (new defect pattern) |
| `zzem-kb:update-pattern` | Increment `frequency`, update `last_seen` on existing pattern | Phase 4 Evaluator (recurring pattern) |
| `zzem-kb:write-reflection` | Create reflection file for completed sprint | Sprint end (Phase 6 Retrospective) |

Skills deliberately excluded at Phase 1:

- `zzem-kb:bootstrap` — one-time `git clone`; handled by orchestrator
  bootstrap script + README.
- `zzem-kb:archive-pattern` — CI / scheduled job sweeps `frequency < 3 &&
  3+ sprints unseen` patterns into `archived/`.
- `zzem-kb:read-rubric` — folded into `zzem-kb:read` with `type=rubric`.

### 4.2 Skill File Format

Each skill lives at `skills/{name}/SKILL.md` and follows Claude Code skill
frontmatter:

```markdown
---
name: zzem-kb:write-pattern
description: >
  Write a new pattern YAML to the KB repo. Validates against schema, commits,
  and pushes with rebase retry. Use when the evaluator discovers a new defect
  pattern not matching any existing pattern.
---

# Write Pattern

## Preconditions
...

## Steps
1. ...

## Failure handling
...

## Verification
...
```

Each skill's `SKILL.md` must include:

- **Preconditions** — env vars, clean working tree, required inputs.
- **Steps** — numbered, each step names the exact tool call (`Bash:`, `Read:`,
  `Write:`, `Glob:`).
- **Failure handling** — what to do on CI reject, push conflict, etc.
- **Verification** — smoke procedure (covered in §8).

### 4.3 Canonical Flow: `zzem-kb:write-pattern`

```
1. Sync:
   Bash: git -C "$ZZEM_KB_PATH" checkout main && git -C "$ZZEM_KB_PATH" pull --ff-only

2. Determine next id:
   Glob: $ZZEM_KB_PATH/content/patterns/{category}-*.yaml
   Parse filenames → max NNN → increment by 1.

3. Read schema:
   Read: $ZZEM_KB_PATH/schemas/pattern.schema.json

4. Compose + write file:
   Write: $ZZEM_KB_PATH/content/patterns/{category}-{NNN}.yaml
   Ensure schema_version:1, discovered_at=now ISO8601, frequency:1,
   last_seen=source_sprint.

5. (Optional) Local validate:
   Bash: cd "$ZZEM_KB_PATH" && npx -y ajv-cli validate \
           -s schemas/pattern.schema.json \
           -d content/patterns/{category}-{NNN}.yaml --strict=false

6. Commit + rebase-retry push:
   Bash: (
     cd "$ZZEM_KB_PATH"
     git add content/patterns/{category}-{NNN}.yaml
     git commit -m "pattern: {category}-{NNN} from {source_sprint}/{source_group}"
     for i in 1 2 3; do
       git pull --rebase origin main && git push && exit 0
       sleep $((2**i))
     done
     exit 1
   )

7. On step-6 failure: report failure, file remains committed locally; do NOT
   block sprint progression (best-effort semantics).
```

The other skills follow the same template scaled down.

### 4.4 Skill Distribution

Skills ship inside the KB repo. `scripts/install-skills.sh` on the consumer
side symlinks `~/.claude/skills/zzem-kb/` to `$ZZEM_KB_PATH/skills/`. Orches-
trator bootstrap invokes this script. Skill updates propagate on the next
`zzem-kb:sync`.

---

## 5. Data Flow

### 5.1 Bootstrap (once per machine)

```bash
KB_PATH="${ZZEM_KB_PATH:-$HOME/.zzem/kb}"
if [ ! -d "$KB_PATH/.git" ]; then
  git clone git@github.com:zzem-org/knowledge-base.git "$KB_PATH"
fi
"$KB_PATH/scripts/install-skills.sh"
```

Idempotent. Called from the orchestrator's session-start hook.

### 5.2 Read Path

```
Phase 2 Spec start
  → Skill("zzem-kb:sync")
  → Skill("zzem-kb:read", type=reflection, domain=<sprint domain>, limit=3)
  → Skill("zzem-kb:read", type=pattern, category=<task-relevant>)
  → agent consumes results via Read
```

All filtering happens client-side via `Glob`+`Read` over YAML/Markdown. No
index file at Phase 1.

### 5.3 Write Path (happy)

```
Phase 4 Evaluator identifies new pattern
  → Skill("zzem-kb:write-pattern", <payload>)
    → sync
    → next id
    → read schema
    → write file
    → commit + rebase retry + push
  → CI validates → merged into main
```

### 5.4 Write Path (conflict)

Two agents push concurrently:

```
Agent A: git push OK
Agent B: git push → non-fast-forward → rejected
  → retry 1: git pull --rebase (replays B's commit on top of A's) → git push OK
```

If three retries fail (unusual), the skill logs failure and returns an error.
The sprint proceeds; the local commit can be pushed manually later.

### 5.5 Update Path (existing pattern frequency++)

Executed by `zzem-kb:update-pattern`. Reads the target file, increments
`frequency`, updates `last_seen`, writes, commits, pushes.

### 5.6 State Independence Claims

| Scenario | Old (file-based) | New (git-backed) |
|----------|------------------|------------------|
| Orchestrator reset | KB lost | Unaffected |
| Worktree switch | State diverges | Shared via `$HOME` |
| Fresh dev machine | Must regenerate | One `git clone` |
| Two agents write | Race / overwrite | push serialized, rebase retry |

---

## 6. Auth, Permissions, Branch Protection

### 6.1 Repository Visibility

Private, within the `zzem-org` GitHub organization.

### 6.2 Credentials

Reuses each developer's existing GitHub SSH key / PAT. No separate agent
credential. Agents inherit shell env. No bot account at Phase 1.

### 6.3 Branch Protection on `main`

- Required status checks: `validate`, `guard-sensitive-paths`,
  `filename-id-match`, `unique-ids`.
- `Require branches to be up to date` — forces rebase before merge.
- No pull-request requirement (direct push to `main` allowed).
- No force push, no branch deletion.
- No bypass, including admins.

### 6.4 Path-Scoped Review (`CODEOWNERS`)

```
/schemas/**   @zach-wrtn
/skills/**    @zach-wrtn
/scripts/**   @zach-wrtn
/.github/**   @zach-wrtn
```

`content/**` is intentionally unowned — no review requirement.

### 6.5 Path-Scoped Enforcement (`ruleset` + post-push guard)

Two mechanisms together enforce path-scoped review:

**Preventive (GitHub Ruleset, authoritative):** a repository ruleset on `main`
with a `restrict file paths` rule for `schemas/**`, `skills/**`, `scripts/**`,
`.github/**`. Any push (direct or PR merge) that modifies these paths must
come via a PR that satisfies CODEOWNERS review. Rulesets, unlike classic
branch protection, support path-scoped push restrictions.

**Detective (`guard-sensitive-paths.yml`):** defense in depth. If a direct
push to sensitive paths slips through (e.g., ruleset mis-config), this
workflow fails on the push event and opens an incident. It runs *after* the
commit lands, so it is a tripwire, not a block.

```yaml
on:
  push:
    branches: [main]
jobs:
  guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 2 }
      - name: Fail on direct push to sensitive paths
        run: |
          CHANGED=$(git diff --name-only HEAD^ HEAD)
          if echo "$CHANGED" | grep -E '^(schemas|skills|scripts|\.github)/'; then
            echo "Direct push to protected paths detected. Ruleset may be misconfigured."
            exit 1
          fi
```

Net effect: `content/` is fast lane; protocol and schema changes require a PR
with CODEOWNERS review, enforced primarily by ruleset and monitored by the
guard workflow.

### 6.6 Permission Matrix

| Path | Agent direct push | Human direct push | PR required | CI |
|------|-------------------|-------------------|-------------|----|
| `content/patterns/` | ✅ | ✅ | ❌ | Full schema |
| `content/rubrics/` | ✅ | ✅ | ❌ | Frontmatter |
| `content/reflections/` | ✅ | ✅ | ❌ | Frontmatter |
| `schemas/` | ❌ (guard) | ❌ (guard) | ✅ | Schema lint + backwards-compat |
| `skills/` | ❌ | ❌ | ✅ | Skill frontmatter check |
| `scripts/` | ❌ | ❌ | ✅ | — |
| `.github/` | ❌ | ❌ | ✅ | — |

### 6.7 Audit

Git log + GitHub PR history is the audit surface. No separate audit store.

---

## 7. Migration & Rollout

### 7.1 Source Inventory

- 13 patterns in `sprint-orchestrator/knowledge-base/patterns/*.yaml`
- 2 rubrics in `knowledge-base/rubrics/v{1,2}.md`
- 3 reflections in `knowledge-base/reflections/*.md`
- 8 references to `knowledge-base` in the orchestrator; the one active external
  reference is `sprint-orchestrator/templates/sprint-contract-template.md`.

### 7.2 Migration Steps

| Step | Repo | Work |
|------|------|------|
| 1. Scaffold | KB | Create repo; add schemas, skills, workflows, CODEOWNERS, README; enable branch protection. |
| 2. Seed | KB | Run `scripts/migrate-from-orchestrator.mjs` → commit 18 files with `schema_version:1`. |
| 3. Integrate | Orchestrator | Add `scripts/kb-bootstrap.sh`; invoke at session start; replace file-path references in templates with `zzem-kb:read` invocations. |
| 4. Dogfood | — | Run one sprint against the new KB; old directory kept as read-only fallback. |
| 5. Cleanup | Orchestrator | `git rm -r sprint-orchestrator/knowledge-base/`; update `MEMORY.md` references. |

### 7.3 Rollback

- Steps 1–2 failure: delete the KB repo; no impact on orchestrator.
- Step 3 failure: revert the orchestrator integration PR.
- Step 4 regression: halt sprint, restore the file-based KB by reverting Step
  3; fix forward on the KB repo before retry.
- Post-Step-5: `git revert` restores the file-based KB.

### 7.4 Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Concurrent push conflicts | Medium | Rebase-retry (3 × exponential backoff); write is best-effort. |
| Agents write files directly, bypassing skills | Medium | `sprint-contract-template` mandates skill path; first dogfood sprint actively monitored. |
| CI too strict → blocks sprints | Low | `--strict=false` on ajv; collect first-week failure cases and relax or clarify guidance. |
| Worktree-wide `~/.zzem/kb` collisions | Low | `ZZEM_KB_PATH` override for per-worktree isolation; default intentionally shared. |
| ID collision during migration | Low | Migration script pre-checks for duplicates; aborts on conflict. |

### 7.5 Success Criteria (Phase 1 Exit)

1. 18 files migrated, CI green on KB repo.
2. All 5 skills smoke-tested, including the concurrent-write conflict case.
3. One dogfood sprint completed using exclusively the new KB, with real reads
   and at least one real write.
4. `sprint-orchestrator/knowledge-base/` removed from the orchestrator repo.
5. `MEMORY.md` and any remaining references updated.
6. Release `zzem-knowledge-base@v1.0.0` tagged with release notes.

Estimated effort: ~1.5 person-days of setup + 1 sprint of dogfood observation.

---

## 8. Testing & Verification

### 8.1 Layer 1 — Schema Unit (CI)

`.github/workflows/validate.yml` runs on every push and PR:

- `ajv validate` for `pattern.schema.json` against `content/patterns/*.yaml`.
- `validate-markdown-frontmatter.mjs` for rubrics + reflections.
- `validate-filename-id-match.mjs` — filename `{category}-{NNN}` equals `.id`.
- `validate-unique-ids.mjs` — global id uniqueness across content + archived.
- `validate-schema-backwards-compat.mjs` — new schema still validates all
  existing content (prevents accidental breaking change).
- `validate-skill-frontmatter.mjs` — every `skills/*/SKILL.md` has the
  required frontmatter fields.

Negative fixtures under `tests/fixtures/` must fail validation; a small script
asserts this.

### 8.2 Layer 2 — Skill Smoke (manual, documented)

Each `SKILL.md` ends with a `Verification` section defining the smoke
procedure. Phase 1 runs these manually once, and any time a skill changes.

| Skill | Smoke |
|-------|-------|
| `zzem-kb:sync` | Clone into `/tmp/kb-test`; push a change from another clone; sync the first; confirm HEAD matches. |
| `zzem-kb:read` | `type=pattern, category=correctness` returns ≥3 files. |
| `zzem-kb:write-pattern` | Create a throwaway pattern; CI green; file appears on origin. |
| `zzem-kb:update-pattern` | Bump `correctness-001` frequency; diff shows only `frequency` and `last_seen`. |
| `zzem-kb:write-reflection` | Create a reflection for a fake sprint id; file appears with correct frontmatter. |
| Conflict | Two sessions write different patterns concurrently; both eventually land via rebase-retry. |

Test artifacts named with a `test-` prefix, reverted in a single cleanup
commit after smoke.

### 8.3 Layer 3 — End-to-End Dogfood

One real sprint after Step 3, tracked by checklist at
`sprint-orchestrator/sprints/{sprint-id}/kb-dogfood.md`:

- Read path: `zzem-kb:read` invoked by Phase 2 Spec and Phase 4 Evaluator.
- Write path: at least one new pattern and one reflection land on origin.
- Failure injection: one intentional invalid pattern is blocked by CI and the
  agent reports the error.
- State independence: verify KB state survives a worktree switch and an
  orchestrator main reset.

### 8.4 Layer 4 — Runtime Observability

Minimal, manual, monthly:

- Skill invocation counts from Claude Code transcripts.
- Push success rate from git log.
- CI failure counts from GitHub Actions history.
- KB growth rate (patterns per sprint).

No dashboards at Phase 1.

### 8.5 Failure Response Playbook

| Symptom | Diagnosis | Response |
|---------|-----------|----------|
| Agent writes files directly instead of invoking skill | Transcript lacks `Skill("zzem-kb:...")` | Strengthen sprint-contract-template wording; add skill-usage reminder. |
| Sustained push conflicts (3-retry failures recurring) | Parallelism too high | Serialize writes to sprint-end; reduce concurrent sprint count. |
| CI routinely blocks valid writes | Schema too strict | Relax `minLength` or add missing field; clarify docs. |
| Need for breaking schema change | Intentional evolution | Follow §3.5 procedure. |

---

## 9. Open Questions

These are deliberately left open for Phase 2+ rebrainstorming rather than
resolved now.

1. **Semantic search.** If KB grows large enough that `Glob`+`Read` is slow, do
   we add pgvector (move to hybrid DB), an embedding index file, or smarter
   manifest?
2. **PRD integration shape.** Is Notion the source of truth with KB as the
   projection, or vice versa? Phase 2 spec.
3. **Event-spec code generation.** Do we emit TypeScript types client-side or
   from the KB via CI? Phase 3 spec.
4. **Archival automation.** Currently a manual or cron script; under what
   exact policy (e.g., "`frequency<3` AND 5+ sprints without `last_seen`
   match"). Phase 4 or earlier if the archive grows noisy.
5. **Human review dashboard.** GitHub PR view covers the machine-first path;
   whether we need more is a Phase 4 question.

---

## 10. Appendices

### 10.1 References

- Current KB: `sprint-orchestrator/knowledge-base/README.md`
- Related memory: `project_sprint_pipeline.md`, `reference_knowledge_base.md`,
  `feedback_sprint_artifacts_commit.md`
- Superpowers skills used to produce this design: `brainstorming`,
  `writing-plans` (next step)

### 10.2 Glossary

- **Consumer** — any environment with a local clone of the KB (dev machine, CI
  worker).
- **Phase (KB)** — a decomposition milestone for building out the platform
  (Phase 1~4 in this doc). Distinct from orchestrator sprint phases.
- **Skill** — Claude Code skill; a markdown file with frontmatter describing a
  protocol the agent executes.
