# Knowledge Base Phase 1.1 Hotfix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Schema-validate pattern YAML files in CI and make `install-skills.sh` idempotent so a second KB clone does not silently clobber the first clone's symlink.

**Architecture:** Add one new Node validator (`scripts/validate-pattern-schemas.mjs`) wired into the existing `validate:content` npm script. Rewrite `scripts/install-skills.sh` to detect existing symlinks and refuse to re-point unless `ZZEM_KB_FORCE_LINK=1`. Back up the install-script change with a bash test that mocks `$HOME` to a temp sandbox.

**Tech Stack:** Node 20 (ESM), AJV draft-2020-12, `js-yaml`, bash, GitHub Actions.

**Working directory for implementation:** `/Users/zachryu/dev/zzem-knowledge-base/` (the standalone KB repo). The orchestrator worktree at `/Users/zachryu/.superset/worktrees/zzem-orchestrator/chore/knowledge-base/` is used only to host this plan document.

**Branch:** Work on a new branch in the KB repo, e.g. `phase1.1/hotfix`. Open the PR against `zach-wrtn/knowledge-base:main`.

**Spec:** `docs/superpowers/specs/2026-04-19-knowledge-base-phase1.1-hotfix-design.md` (in orchestrator repo).

---

## File Structure

**New files (KB repo):**
- `scripts/validate-pattern-schemas.mjs` — AJV-based validator for `content/patterns/*.yaml` against `schemas/pattern.schema.json`. Accepts an optional CLI argument for the target directory (mirroring `validate-filename-id-match.mjs`).
- `tests/install-skills.test.sh` — four-case shell test for `install-skills.sh` using a `$HOME` sandbox.

**Modified files (KB repo):**
- `scripts/install-skills.sh` — idempotent re-link with `ZZEM_KB_FORCE_LINK=1` escape hatch.
- `package.json` — add `validate:patterns` step in `validate:content`; add `test:install-skills` script.
- `.github/workflows/validate.yml` — add `npm run test:install-skills` step after `validate:content`.

**Not modified:**
- `schemas/*.json` — the contract is fixed. If existing content fails the new validator, fix the content, never the schema.
- `skills/zzem-kb/*` — skill contracts unchanged.
- `scripts/kb-bootstrap.sh` — already idempotent at the npm-ci layer; install-skills step will now refuse bad clobbers naturally.

---

## Task 1: Pattern schema validator

**Files:**
- Create: `scripts/validate-pattern-schemas.mjs`

**Context:** `validate-filename-id-match.mjs` checks the id-filename invariant but does not open the full schema. `validate-fixtures.mjs` compiles schemas once using the `getValidator(name)` cache pattern (captured in KB pattern `code_quality-003`). Reuse both patterns here: single compile outside the loop, collect all errors before exiting.

- [ ] **Step 1: Create `scripts/validate-pattern-schemas.mjs`**

```javascript
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import yaml from "js-yaml";

const ROOT = new URL("..", import.meta.url).pathname;

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const validate = ajv.compile(
  JSON.parse(readFileSync(join(ROOT, "schemas", "pattern.schema.json"), "utf8"))
);

function collectYaml(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".yaml"))
    .map((e) => join(dir, e.name));
}

function runOn(dir) {
  let failed = 0;
  for (const file of collectYaml(dir)) {
    const doc = yaml.load(readFileSync(file, "utf8"));
    if (!validate(doc)) {
      for (const err of validate.errors) {
        const path = err.instancePath || "(root)";
        console.error(`FAIL  ${file}: ${path} ${err.message}`);
      }
      failed++;
    }
  }
  return failed;
}

const target = process.argv[2]
  ? join(ROOT, process.argv[2])
  : join(ROOT, "content", "patterns");

const failed = runOn(target);
if (failed > 0) {
  console.error(`${failed} pattern file(s) failed schema validation`);
  process.exit(1);
}
console.log(`pattern schemas OK (${target})`);
```

- [ ] **Step 2: Run against real content — expect pass**

Run: `cd /Users/zachryu/dev/zzem-knowledge-base && node scripts/validate-pattern-schemas.mjs`

Expected: exit 0, final line `pattern schemas OK (.../content/patterns)`.

If any existing pattern fails, the failure message names the file and field. Fix the content in that file (never the schema). Common legitimate fixes:
- Missing `contract_clause` — add one sentence capturing the rule the pattern enforces.
- Bad `severity` — only `critical`, `major`, `minor` are allowed (not `info`).
- Bad `discovered_at` — must be full RFC 3339 date-time (e.g. `"2026-04-19T04:00:00+09:00"`).

- [ ] **Step 3: Run against fixture dir — expect fail**

Run: `cd /Users/zachryu/dev/zzem-knowledge-base && node scripts/validate-pattern-schemas.mjs tests/fixtures`

Expected: exit 1. Output names `invalid-pattern-missing-field.yaml` and `invalid-pattern-bad-id.yaml` as failures, followed by `2 pattern file(s) failed schema validation`.

The fixture dir also contains `valid-pattern.yaml`, which must pass (i.e. only the two invalid files are reported).

- [ ] **Step 4: Commit**

```bash
cd /Users/zachryu/dev/zzem-knowledge-base
git checkout -b phase1.1/hotfix
git add scripts/validate-pattern-schemas.mjs
git commit -m "feat: add pattern YAML schema validator"
```

---

## Task 2: Wire validator into `validate:content`

**Files:**
- Modify: `package.json` (line with `"validate:content"`)

**Context:** `validate:content` currently chains three scripts with `&&`. New validator runs after `validate-unique-ids` and before `validate-markdown-frontmatter` — ids first, then pattern structure, then MD frontmatter.

- [ ] **Step 1: Edit `package.json`**

Replace the existing `"validate:content"` line with:

```json
    "validate:content": "node scripts/validate-filename-id-match.mjs && node scripts/validate-unique-ids.mjs && node scripts/validate-pattern-schemas.mjs && node scripts/validate-markdown-frontmatter.mjs",
```

No other keys change. The `"validate"` aggregator already composes `validate:content` and does not need editing.

- [ ] **Step 2: Run the full validation pipeline — expect pass**

Run: `cd /Users/zachryu/dev/zzem-knowledge-base && npm run validate`

Expected: exit 0. Output shows `filename-id match OK`, `unique ids OK (...)`, `pattern schemas OK (...)`, `markdown frontmatter OK`, and the subsequent skills/backcompat lines.

- [ ] **Step 3: Sanity-check failure path end-to-end**

Create a throwaway bad pattern to confirm the chain actually blocks:

```bash
cd /Users/zachryu/dev/zzem-knowledge-base
cat > content/patterns/correctness-999.yaml <<'EOF'
id: correctness-999
title: "probe — should fail validate:content"
category: correctness
severity: huge
source_sprint: phase11-probe
discovered_at: "2026-04-19T00:00:00+09:00"
frequency: 1
last_seen: phase11-probe
description: "temporary probe, remove before commit"
detection: "temporary probe"
prevention: "temporary probe"
contract_clause: "temporary probe"
schema_version: 1
EOF
npm run validate:content; echo "exit=$?"
rm content/patterns/correctness-999.yaml
```

Expected: exit code `1`, output includes a line naming `correctness-999.yaml` and the `/severity` enum violation. The `rm` at the end leaves the tree clean.

- [ ] **Step 4: Commit**

```bash
cd /Users/zachryu/dev/zzem-knowledge-base
git add package.json
git commit -m "chore: chain pattern schema validator into validate:content"
```

---

## Task 3: `install-skills.sh` idempotent re-link

**Files:**
- Modify: `scripts/install-skills.sh`
- Create: `tests/install-skills.test.sh`

**Context:** Current `install-skills.sh` always `rm`s an existing symlink and re-creates it. With two KB clones at different paths, the second `install-skills.sh` silently repoints the global `~/.claude/skills/zzem-kb` away from the first. The fix: detect existing link, no-op if it already matches, refuse to clobber a different target unless `ZZEM_KB_FORCE_LINK=1`. Test uses `HOME=$(mktemp -d)` to sandbox so the real `~/.claude/skills/` is untouched.

- [ ] **Step 1: Write the shell test first**

Create `tests/install-skills.test.sh`:

```bash
#!/usr/bin/env bash
# Test install-skills.sh idempotency. Uses HOME sandbox to avoid touching the
# real ~/.claude/skills/ dir.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL="$REPO_ROOT/scripts/install-skills.sh"

SANDBOX="$(mktemp -d -t kb-install-test-XXXXXX)"
trap 'rm -rf "$SANDBOX"' EXIT

pass=0
fail=0

run()           { HOME="$SANDBOX" bash "$INSTALL" "$@"; }
run_force()     { HOME="$SANDBOX" ZZEM_KB_FORCE_LINK=1 bash "$INSTALL" "$@"; }
link_path()     { echo "$SANDBOX/.claude/skills/zzem-kb"; }
target_of()     { readlink "$1"; }
reset_sandbox() { rm -rf "$SANDBOX"; mkdir -p "$SANDBOX"; }

check() {
  local label="$1"; shift
  if "$@"; then pass=$((pass+1)); echo "PASS  $label"
  else fail=$((fail+1)); echo "FAIL  $label"
  fi
}

# Case 1: fresh install creates the link
reset_sandbox
run > /dev/null 2>&1
check "case1: link created" test -L "$(link_path)"
check "case1: points to repo skills" test "$(target_of "$(link_path)")" = "$REPO_ROOT/skills"

# Case 2: re-run with same target is a silent no-op (exit 0)
run > /dev/null 2>&1
check "case2: re-run exits 0" test "$?" -eq 0
check "case2: link unchanged" test "$(target_of "$(link_path)")" = "$REPO_ROOT/skills"

# Case 3: different target, no FORCE — must refuse and leave link alone
reset_sandbox
mkdir -p "$SANDBOX/.claude/skills" "$SANDBOX/other-skills"
ln -s "$SANDBOX/other-skills" "$(link_path)"
if run > /dev/null 2>&1; then
  fail=$((fail+1)); echo "FAIL  case3: should have exited non-zero"
else
  pass=$((pass+1)); echo "PASS  case3: exited non-zero"
fi
check "case3: link not clobbered" test "$(target_of "$(link_path)")" = "$SANDBOX/other-skills"

# Case 4: different target + FORCE — re-link
run_force > /dev/null 2>&1
check "case4: force-relinked" test "$(target_of "$(link_path)")" = "$REPO_ROOT/skills"

echo "---"
echo "$pass passed, $fail failed"
test "$fail" -eq 0
```

Make it executable and run it — expect cases 2 and 3 to fail against the current script (case 2 might pass since re-run currently does rm+ln to the same target; case 3 will definitely fail because the current script clobbers):

```bash
cd /Users/zachryu/dev/zzem-knowledge-base
chmod +x tests/install-skills.test.sh
bash tests/install-skills.test.sh; echo "exit=$?"
```

Expected at this step: exit non-zero, at minimum `FAIL  case3: exited non-zero` and `FAIL  case3: link not clobbered`.

- [ ] **Step 2: Rewrite `scripts/install-skills.sh`**

Replace the file with:

```bash
#!/usr/bin/env bash
# Symlink zzem-kb skills from this repo into ~/.claude/skills/zzem-kb/.
# Idempotent:
#   - same target       -> no-op
#   - different target  -> refuse unless ZZEM_KB_FORCE_LINK=1
#   - non-symlink file  -> refuse (manual cleanup required)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$REPO_ROOT/skills"
TARGET="$HOME/.claude/skills/zzem-kb"

mkdir -p "$(dirname "$TARGET")"

if [ -L "$TARGET" ]; then
  current="$(readlink "$TARGET")"
  if [ "$current" = "$SOURCE" ]; then
    echo "already linked: $TARGET -> $SOURCE"
    exit 0
  fi
  if [ "${ZZEM_KB_FORCE_LINK:-0}" = "1" ]; then
    rm "$TARGET"
    ln -s "$SOURCE" "$TARGET"
    echo "force-relinked: $TARGET -> $SOURCE (was: $current)"
    exit 0
  fi
  echo "warn: $TARGET already points to $current" >&2
  echo "      refusing to overwrite with $SOURCE" >&2
  echo "      set ZZEM_KB_FORCE_LINK=1 to override" >&2
  exit 1
elif [ -e "$TARGET" ]; then
  echo "error: $TARGET exists and is not a symlink. Remove manually and re-run." >&2
  exit 1
fi

ln -s "$SOURCE" "$TARGET"
echo "linked: $TARGET -> $SOURCE"
```

- [ ] **Step 3: Re-run the shell test — expect all pass**

Run: `cd /Users/zachryu/dev/zzem-knowledge-base && bash tests/install-skills.test.sh; echo "exit=$?"`

Expected: exit 0, four `PASS` lines for each of four cases (7 total checks), final line `N passed, 0 failed`.

- [ ] **Step 4: Commit**

```bash
cd /Users/zachryu/dev/zzem-knowledge-base
git add scripts/install-skills.sh tests/install-skills.test.sh
git commit -m "fix(install-skills): refuse silent re-link of existing symlink

Previously the script always rm'd an existing ~/.claude/skills/zzem-kb
and re-created it, so bootstrapping a second KB clone silently repointed
the first clone's skills away. Now no-ops when the existing link already
matches, and refuses to re-link a different target unless
ZZEM_KB_FORCE_LINK=1. Adds a 4-case bash test using a HOME sandbox."
```

---

## Task 4: CI wiring + PR

**Files:**
- Modify: `package.json` (add `test:install-skills` script)
- Modify: `.github/workflows/validate.yml`

- [ ] **Step 1: Add `test:install-skills` npm script**

Edit `package.json`. Inside `"scripts"`, add after the `validate:backcompat` line:

```json
    "test:install-skills": "bash tests/install-skills.test.sh",
```

(Order does not affect behavior, but keep it grouped with the validator/test scripts.)

- [ ] **Step 2: Verify locally**

Run: `cd /Users/zachryu/dev/zzem-knowledge-base && npm run test:install-skills`

Expected: exit 0, `N passed, 0 failed` as in Task 3 step 3.

- [ ] **Step 3: Add CI step**

Edit `.github/workflows/validate.yml`. After the `npm run validate:content` line, add:

```yaml
      - run: npm run test:install-skills
```

The resulting `steps:` block should be:

```yaml
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run validate:schemas
      - run: npm run validate:content
      - run: npm run test:install-skills
      - run: npm run validate:skills
      - run: npm run validate:backcompat
```

- [ ] **Step 4: Commit**

```bash
cd /Users/zachryu/dev/zzem-knowledge-base
git add package.json .github/workflows/validate.yml
git commit -m "ci: run install-skills test in validate job"
```

- [ ] **Step 5: Push branch and open PR**

```bash
cd /Users/zachryu/dev/zzem-knowledge-base
git push -u origin phase1.1/hotfix
gh pr create --title "phase1.1: pattern schema validation + install-skills idempotency" --body "$(cat <<'EOF'
## Summary
- Add `scripts/validate-pattern-schemas.mjs`; chain it into `validate:content` so every `content/patterns/*.yaml` is AJV-validated against `schemas/pattern.schema.json` in CI and in skill pre-commit.
- Rewrite `scripts/install-skills.sh` to be idempotent: same-target re-runs are a no-op, different-target requires `ZZEM_KB_FORCE_LINK=1`. Adds a bash test with a `$HOME` sandbox.
- Wire `test:install-skills` into the `validate` CI workflow.

## Test plan
- [ ] CI `validate` job green.
- [ ] Local `npm run validate` green.
- [ ] Local `npm run test:install-skills` green.
- [ ] Manually confirm a hand-crafted bad pattern (e.g. `severity: huge`) is rejected by `npm run validate:content`.

Closes gaps #2 and #3 from the kb-phase1-dogfood retrospective. Remaining four gaps (Pro ruleset, observability, auto-cleanup, domain enum) deferred to Phase 2.
EOF
)"
```

Expected: PR URL printed. CI will run on push; all steps including the new ones should pass.

---

## After all tasks

- Merge PR once CI is green.
- Update `sprint-orchestrator/sprints/kb-phase1-dogfood/kb-dogfood.md` "Gaps identified" section to mark #2 and #3 as resolved (link the merged PR).
- No KB reflection needed for this hotfix (too small; it is a tail of the Phase 1 dogfood). Phase 2 gets its own reflection.
