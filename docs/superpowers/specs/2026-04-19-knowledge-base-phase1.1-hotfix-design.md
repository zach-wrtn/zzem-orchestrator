# Knowledge Base Phase 1.1 Hotfix — Design Spec

**Date:** 2026-04-19
**Target repo:** `zach-wrtn/knowledge-base` (standalone)
**Source sprint:** kb-phase1-dogfood (retrospective-driven)
**Scope:** two gaps surfaced during Phase 1 dogfood; no new features

## Motivation

Phase 1 dogfood (`sprint-orchestrator/sprints/kb-phase1-dogfood/kb-dogfood.md`)
validated every protocol surface but surfaced six gaps. Two of them are
"unfinished edges" from Phase 1 that would keep biting anyone who uses the
system — they are not Phase 2 features. This spec covers those two only;
the remaining four (ruleset, observability, auto-cleanup, domain enum) are
deferred to Phase 2 proper.

### Gap #2 — pattern YAML files not schema-validated

`validate-markdown-frontmatter.mjs` already schema-validates every
`content/rubrics/**/*.md` and `content/reflections/*.md` against its
respective JSON Schema. For patterns, the pipeline only runs
`validate-filename-id-match.mjs` (id equals filename stem) and
`validate-unique-ids.mjs` (no id collisions) — neither loads
`schemas/pattern.schema.json`. A pattern with a missing required field, an
invalid `category`/`severity` enum, or a bad `discovered_at` format can be
committed and pass CI. During dogfood, new patterns were manually piped
through `ajv.compile + validate` as a workaround.

### Gap #3 — `install-skills.sh` silently re-links `~/.claude/skills/zzem-kb`

The installer does `rm -rf $LINK && ln -s $TARGET $LINK` unconditionally.
Bootstrapping a second clone with a different `ZZEM_KB_PATH` re-points the
symlink away from the first clone with no warning. A user or agent who
expected their existing KB path to remain authoritative loses that link
silently. Restored manually during dogfood.

## Scope

**In scope**

1. Schema-validate `content/patterns/*.yaml` against
   `schemas/pattern.schema.json`. Rubrics and reflections are already
   validated by `validate-markdown-frontmatter.mjs` — not re-implemented.
2. Make `scripts/install-skills.sh` idempotent and refuse to silently clobber
   an existing symlink pointing elsewhere.

**Out of scope**

- Gap #1 (Pro-tier `file_path_restriction` ruleset) — product/billing decision.
- Gap #4 (observability of skill usage) — Phase 2 feature.
- Gap #5 (auto-cleanup based on `frequency` / `last_seen`) — Phase 2 feature.
- Gap #6 (reflection `domain` enum standardization) — Phase 2 schema change;
  depends on domain decision and existing-reflection migration.
- Schema changes. The existing schemas are the contract. If current content
  fails validation, the content is fixed, not the schema.

## Design

### 1. Pattern YAML schema validation

**New file:** `scripts/validate-pattern-schemas.mjs`

Walks `content/patterns/*.yaml`, loads each via `js-yaml`, and validates
against `schemas/pattern.schema.json`. Uses AJV draft-2020-12 with
`ajv-formats`. Compiles the pattern validator once (not in a loop) to avoid
the `schema with key or id already exists` bug captured in KB pattern
`code_quality-003`.

Output format on failure (example):

```
FAIL  content/patterns/example-001.yaml: /severity must be equal to one of the allowed values
FAIL  content/patterns/other-002.yaml: must have required property 'contract_clause'

2 pattern file(s) failed schema validation
```

Match the existing validator style (`FAIL  <path>: <message>` per line,
summary line at the end). Collect all failures before exiting so one bad
file does not hide another. Exits `0` on all-pass, `1` on any failure.

**Package wiring:** the `validate:content` npm script gains this script in
sequence with the existing validators. `validate:content` is what CI runs
and what `zzem-kb:write-pattern` / `zzem-kb:update-pattern` /
`zzem-kb:write-reflection` run before commit — adding the step there means
both CI and client-side skills benefit.

Order within `validate:content`: run **after** `validate-unique-ids` and
**before** `validate-markdown-frontmatter`. Rationale: id-level checks first,
then structural checks on YAML content, then frontmatter for MD.

**CI:** `.github/workflows/validate.yml` already invokes
`npm run validate:content`, so no workflow edit is required.

**Back-compat sweep:** the first implementation task runs the new validator
over current main to confirm every existing file passes. If any existing
content fails, it is fixed in the same PR; the schemas are not weakened.

### 2. Bootstrap symlink idempotency

**Modified file:** `scripts/install-skills.sh`

Current behavior (roughly):

```bash
rm -rf "$LINK_PATH"
ln -s "$TARGET_PATH" "$LINK_PATH"
```

New behavior:

```
if $LINK_PATH does not exist:
  ln -s $TARGET_PATH $LINK_PATH
  log "linked $LINK_PATH -> $TARGET_PATH"

elif $LINK_PATH is a symlink whose readlink == $TARGET_PATH:
  exit 0   # idempotent no-op

elif ZZEM_KB_FORCE_LINK=1:
  rm -rf $LINK_PATH
  ln -s $TARGET_PATH $LINK_PATH
  log "force-relinked $LINK_PATH -> $TARGET_PATH (was: $OLD_TARGET)"

else:
  echo "warn: $LINK_PATH already exists and points to $OLD_TARGET" >&2
  echo "      refusing to overwrite. To re-link to $TARGET_PATH," >&2
  echo "      re-run with ZZEM_KB_FORCE_LINK=1." >&2
  exit 1
```

`$OLD_TARGET` is read via `readlink`; for a non-symlink existing file the
message says so explicitly ("exists and is not a symlink").

`kb-bootstrap.sh` is unchanged. In the two-clone collision scenario, the
second bootstrap completes `git clone/pull` and `npm ci` but then the
install-skills step exits non-zero. The user sees the warning and decides:
use the canonical clone, or explicitly force-relink.

### Testing

**`validate-pattern-schemas.mjs`**

- Reuse existing fixtures. `tests/fixtures/invalid-pattern-missing-field.yaml`
  and `tests/fixtures/invalid-pattern-bad-id.yaml` already cover the negative
  cases and are used by `validate-fixtures.mjs`. Running
  `validate-pattern-schemas.mjs` with `tests/fixtures` as its content dir
  must report both as invalid and exit 1.
- Real-content integration: running the validator on `content/patterns` in
  the repo exits 0.

**`install-skills.sh`**

- Shell test at `tests/install-skills.test.sh` (bash; no new dep) covers:
  1. Fresh install, no existing link — succeeds, link created.
  2. Re-run with same target — exit 0, link unchanged.
  3. Re-run with different target, no `ZZEM_KB_FORCE_LINK` — exit 1, link
     unchanged, warning printed.
  4. Re-run with different target and `ZZEM_KB_FORCE_LINK=1` — exit 0, link
     re-pointed.
- Runs under `/tmp/kb-install-test-*` sandboxes; does not touch
  `~/.claude/skills/`.
- Invoked by a dedicated `npm run test:install-skills` script, and called
  from the existing `validate` CI job after `validate:content`.

### Failure modes

- **New content file violates schema** → `validate:content` fails locally
  (skill aborts before commit) and in CI (push blocked by branch protection
  on `validate` status check). Error message names the file and the field.
- **Existing content file violates schema after a schema change** → same
  path. The implementation task forbids this by running the validator before
  any schema change is merged.
- **Bootstrap on a second machine with same `ZZEM_KB_PATH` and intended
  canonical link** → idempotent no-op; no spurious re-link.
- **Bootstrap with a different `ZZEM_KB_PATH`** → clear warning, exit 1,
  user sets `ZZEM_KB_FORCE_LINK=1` if they really want to repoint.

## Success criteria

1. A hand-crafted pattern YAML missing a required field (e.g.
   `contract_clause`) is rejected by `npm run validate:content` locally and
   by CI on push.
2. A hand-crafted pattern with a bad enum value (e.g. `severity: huge`) is
   rejected by the same pipeline.
3. Every file currently in `content/patterns/` passes the new validator
   unmodified (or is fixed in the same PR; schemas not weakened).
4. Bootstrapping the KB at a second path without `ZZEM_KB_FORCE_LINK=1`
   exits non-zero at the install-skills step, prints a warning naming both
   paths, and leaves the existing symlink intact.
5. Bootstrapping again with the same `ZZEM_KB_PATH` as an earlier run is a
   silent no-op at the install-skills step.
6. Every new KB write protocol (`write-pattern`, `update-pattern`,
   `write-reflection`) goes through the schema validator as part of its
   pre-commit validation with no additional protocol change needed.

## Not changing

- Schema definitions under `schemas/`.
- Skill contracts under `skills/zzem-kb/*`.
- CI workflow structure (only the package script it invokes changes its
  internals).
- `kb-bootstrap.sh` top-level flow.
- The `~/.claude/skills/zzem-kb` canonical symlink name — single-path by
  design.
