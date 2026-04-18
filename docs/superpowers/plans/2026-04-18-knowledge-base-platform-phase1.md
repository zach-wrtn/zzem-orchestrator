# Knowledge Base Platform Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the orchestrator's knowledge base out of `sprint-orchestrator/knowledge-base/` into a standalone, state-independent GitHub repository (`zach-wrtn/knowledge-base`) with skill-driven read/write and JSON Schema validation in CI.

**Architecture:** Independent private GitHub repo holds `schemas/`, `content/`, and `skills/`. Consumers keep a git clone at `$ZZEM_KB_PATH` (default `~/.zzem/kb`) and interact via five Claude Code skills (`zzem-kb:sync|read|write-pattern|update-pattern|write-reflection`). GitHub Actions runs JSON Schema + convention checks on every push; GitHub Rulesets require a PR with CODEOWNERS review for anything outside `content/`.

**Tech Stack:** Git + GitHub, Node 20 + `ajv` + `js-yaml` + `gray-matter` for validation/migration scripts, GitHub Actions, GitHub Rulesets, Claude Code skills (Markdown with frontmatter).

**Spec:** `docs/superpowers/specs/2026-04-18-knowledge-base-platform-phase1-design.md` (commit `ed51fd6`).

---

## Working Directories

Two repos are touched. Tasks state the working directory up front.

| Alias | Absolute path | Repo |
|-------|---------------|------|
| `$KB` | `$HOME/dev/zzem-knowledge-base` | NEW repo `zach-wrtn/knowledge-base` (created in Task 1) |
| `$ORCH` | `/Users/zachryu/.superset/worktrees/zzem-orchestrator/chore/knowledge-base` | current orchestrator worktree |
| `$OLD_KB` | `$ORCH/sprint-orchestrator/knowledge-base` | pre-migration source |

Export once before starting:

```bash
export KB="$HOME/dev/zzem-knowledge-base"
export ORCH="/Users/zachryu/.superset/worktrees/zzem-orchestrator/chore/knowledge-base"
export OLD_KB="$ORCH/sprint-orchestrator/knowledge-base"
```

---

## File Structure (`$KB` after this plan is complete)

```
zzem-knowledge-base/
├── README.md
├── package.json
├── package-lock.json
├── .gitignore
├── .github/
│   ├── CODEOWNERS
│   └── workflows/
│       ├── validate.yml
│       └── guard-sensitive-paths.yml
├── schemas/
│   ├── pattern.schema.json
│   ├── rubric.schema.json
│   └── reflection.schema.json
├── content/
│   ├── patterns/                    # 13 YAML files after migration
│   ├── rubrics/                     # v1.md, v2.md after migration
│   └── reflections/                 # 3 md files after migration
├── skills/
│   ├── sync/SKILL.md
│   ├── read/SKILL.md
│   ├── write-pattern/SKILL.md
│   ├── update-pattern/SKILL.md
│   └── write-reflection/SKILL.md
├── scripts/
│   ├── install-skills.sh
│   ├── migrate-from-orchestrator.mjs
│   ├── validate-filename-id-match.mjs
│   ├── validate-unique-ids.mjs
│   ├── validate-markdown-frontmatter.mjs
│   ├── validate-skill-frontmatter.mjs
│   └── validate-schema-backwards-compat.mjs
└── tests/
    ├── fixtures/
    │   ├── valid-pattern.yaml
    │   ├── invalid-pattern-missing-field.yaml
    │   ├── invalid-pattern-bad-id.yaml
    │   ├── valid-rubric.md
    │   └── invalid-rubric-missing-frontmatter.md
    └── run-fixtures.mjs
```

Orchestrator-side changes (`$ORCH`):

```
$ORCH/
├── scripts/
│   └── kb-bootstrap.sh              # NEW
├── sprint-orchestrator/
│   ├── knowledge-base/              # REMOVED at Task 27 (post-dogfood)
│   └── templates/
│       └── sprint-contract-template.md   # MODIFIED (KB access → skills)
└── .claude/                         # session-start hook updated (Task 23)
```

---

## Task Groups

- **Group A (Tasks 1–2):** GitHub repo + local clone bootstrap
- **Group B (Tasks 3–6):** Node deps + JSON schemas + fixtures
- **Group C (Tasks 7–11):** Validation scripts
- **Group D (Tasks 12–14):** CI workflows + CODEOWNERS
- **Group E (Tasks 15–19):** Skills (5 `SKILL.md`)
- **Group F (Tasks 20–21):** `install-skills.sh` + README
- **Group G (Tasks 22–23):** Migration script + initial seed push
- **Group H (Tasks 24–26):** Orchestrator integration (bootstrap + template)
- **Group I (Task 27):** GitHub Ruleset + branch protection
- **Group J (Task 28):** Dogfood checklist template
- **Group K (Tasks 29–30):** Post-dogfood cleanup + v1.0.0 tag

Tasks 29–30 execute *after* one dogfood sprint. Everything before is pre-dogfood setup.

---

## Group A: Repo Bootstrap

### Task 1: Create GitHub repo and local clone

**Files:** none yet

- [ ] **Step 1.1: Create the private repo on GitHub**

Working dir: anywhere.

```bash
gh repo create zach-wrtn/knowledge-base \
  --private \
  --description "Machine-readable team knowledge base (patterns, rubrics, reflections)." \
  --clone=false
```

Expected: `https://github.com/zach-wrtn/knowledge-base` printed.

- [ ] **Step 1.2: Clone into `$KB`**

```bash
mkdir -p "$(dirname "$KB")"
git clone git@github.com:zach-wrtn/knowledge-base.git "$KB"
cd "$KB"
```

Expected: empty clone, HEAD on `main` (may need `git checkout -b main` if GitHub default is different).

- [ ] **Step 1.3: Write `.gitignore`**

File: `$KB/.gitignore`

```
node_modules/
*.log
.DS_Store
```

- [ ] **Step 1.4: Initial commit**

```bash
cd "$KB"
git add .gitignore
git commit -m "chore: initialize repo"
git push -u origin main
```

Expected: push succeeds. (Branch protection is applied later in Task 27.)

---

### Task 2: Establish Node project

**Files:**
- Create: `$KB/package.json`

- [ ] **Step 2.1: Initialize `package.json`**

File: `$KB/package.json`

```json
{
  "name": "@zach-wrtn/knowledge-base",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Machine-readable team knowledge base.",
  "scripts": {
    "validate:schemas": "node scripts/validate-fixtures.mjs",
    "validate:content": "node scripts/validate-filename-id-match.mjs && node scripts/validate-unique-ids.mjs && node scripts/validate-markdown-frontmatter.mjs",
    "validate:skills": "node scripts/validate-skill-frontmatter.mjs",
    "validate:backcompat": "node scripts/validate-schema-backwards-compat.mjs",
    "validate": "npm run validate:content && npm run validate:skills && npm run validate:backcompat",
    "migrate": "node scripts/migrate-from-orchestrator.mjs"
  },
  "devDependencies": {
    "ajv": "^8.17.1",
    "ajv-formats": "^3.0.1",
    "gray-matter": "^4.0.3",
    "js-yaml": "^4.1.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2.2: Install deps and commit lockfile**

```bash
cd "$KB"
npm install
git add package.json package-lock.json
git commit -m "chore: add Node deps (ajv, js-yaml, gray-matter)"
```

Expected: `package-lock.json` created, ~0 vulnerabilities.

---

## Group B: Schemas + Fixtures

### Task 3: Author `pattern.schema.json` and fixtures

**Files:**
- Create: `$KB/schemas/pattern.schema.json`
- Create: `$KB/tests/fixtures/valid-pattern.yaml`
- Create: `$KB/tests/fixtures/invalid-pattern-missing-field.yaml`
- Create: `$KB/tests/fixtures/invalid-pattern-bad-id.yaml`

- [ ] **Step 3.1: Write the pattern schema**

File: `$KB/schemas/pattern.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://zach-wrtn.github.io/knowledge-base/schemas/pattern.schema.json",
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
    "id":              { "type": "string", "pattern": "^(correctness|completeness|integration|edge_case|code_quality|design_proto|design_spec)-[0-9]{3}$" },
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

- [ ] **Step 3.2: Write a valid fixture**

File: `$KB/tests/fixtures/valid-pattern.yaml`

```yaml
id: "correctness-001"
title: "커서 페이지네이션 DTO 이중 래핑"
category: "correctness"
severity: "critical"
source_sprint: "ugc-profile-nav-001"
source_group: "group-001"
discovered_at: "2026-04-06T00:00:00+09:00"
frequency: 1
last_seen: "ugc-profile-nav-001"
description: |
  Controller에서 Service가 반환한 CursorResponseDto를 다시 래핑하는 패턴.
detection: |
  Controller 메서드에서 CursorResponseDto를 재생성하는 코드 확인.
prevention: |
  Service가 완성된 CursorResponseDto를 반환, Controller는 패스스루.
contract_clause: |
  페이지네이션 API는 Controller에서 DTO를 재래핑하지 않는다.
schema_version: 1
```

- [ ] **Step 3.3: Write an invalid fixture (missing required field)**

File: `$KB/tests/fixtures/invalid-pattern-missing-field.yaml`

```yaml
id: "correctness-002"
title: "잘못된 예시"
category: "correctness"
severity: "critical"
# missing source_sprint, discovered_at, etc.
schema_version: 1
```

- [ ] **Step 3.4: Write an invalid fixture (bad id pattern)**

File: `$KB/tests/fixtures/invalid-pattern-bad-id.yaml`

```yaml
id: "bogus-001"
title: "잘못된 id prefix"
category: "correctness"
severity: "critical"
source_sprint: "test"
source_group: "group-001"
discovered_at: "2026-04-06T00:00:00+09:00"
frequency: 1
last_seen: "test"
description: "id의 카테고리 prefix가 필드의 category와 불일치."
detection: "validate가 fail해야 함."
prevention: "id 정규식이 카테고리를 포함."
contract_clause: "id pattern 일치."
schema_version: 1
```

- [ ] **Step 3.5: Commit**

```bash
cd "$KB"
git add schemas/pattern.schema.json tests/fixtures/
git commit -m "schemas: add pattern.schema.json + fixtures (valid + 2 invalid)"
```

---

### Task 4: Author `rubric.schema.json` and fixtures

**Files:**
- Create: `$KB/schemas/rubric.schema.json`
- Create: `$KB/tests/fixtures/valid-rubric.md`
- Create: `$KB/tests/fixtures/invalid-rubric-missing-frontmatter.md`

- [ ] **Step 4.1: Write the rubric schema**

File: `$KB/schemas/rubric.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://zach-wrtn.github.io/knowledge-base/schemas/rubric.schema.json",
  "title": "Rubric (frontmatter only)",
  "type": "object",
  "additionalProperties": false,
  "required": ["version", "status", "superseded_by", "schema_version"],
  "properties": {
    "version":        { "type": "integer", "minimum": 1 },
    "status":         { "enum": ["active", "superseded"] },
    "superseded_by":  { "type": ["integer", "null"] },
    "changelog":      { "type": "string" },
    "schema_version": { "const": 1 }
  }
}
```

- [ ] **Step 4.2: Write valid rubric fixture**

File: `$KB/tests/fixtures/valid-rubric.md`

```markdown
---
version: 1
status: active
superseded_by: null
changelog: "initial"
schema_version: 1
---

# Rubric v1

Narrative body.
```

- [ ] **Step 4.3: Write invalid rubric fixture (no frontmatter)**

File: `$KB/tests/fixtures/invalid-rubric-missing-frontmatter.md`

```markdown
# Rubric with no frontmatter

This file has no YAML frontmatter and should fail validation.
```

- [ ] **Step 4.4: Commit**

```bash
cd "$KB"
git add schemas/rubric.schema.json tests/fixtures/valid-rubric.md tests/fixtures/invalid-rubric-missing-frontmatter.md
git commit -m "schemas: add rubric.schema.json + fixtures"
```

---

### Task 5: Author `reflection.schema.json`

**Files:**
- Create: `$KB/schemas/reflection.schema.json`
- Create: `$KB/tests/fixtures/valid-reflection.md`

- [ ] **Step 5.1: Write the reflection schema**

File: `$KB/schemas/reflection.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://zach-wrtn.github.io/knowledge-base/schemas/reflection.schema.json",
  "title": "Reflection (frontmatter only)",
  "type": "object",
  "additionalProperties": false,
  "required": ["sprint_id", "domain", "completed_at", "outcome", "schema_version"],
  "properties": {
    "sprint_id":    { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "domain":       { "type": "string" },
    "completed_at": { "type": "string", "format": "date-time" },
    "outcome":      { "enum": ["pass", "fail", "partial"] },
    "related_patterns": {
      "type": "array",
      "items": { "type": "string", "pattern": "^(correctness|completeness|integration|edge_case|code_quality|design_proto|design_spec)-[0-9]{3}$" }
    },
    "schema_version": { "const": 1 }
  }
}
```

- [ ] **Step 5.2: Write a valid reflection fixture**

File: `$KB/tests/fixtures/valid-reflection.md`

```markdown
---
sprint_id: ai-webtoon-007
domain: ai-webtoon
completed_at: "2026-04-15T18:00:00+09:00"
outcome: pass
related_patterns:
  - correctness-001
  - completeness-002
schema_version: 1
---

# Reflection — ai-webtoon-007

Narrative body.
```

- [ ] **Step 5.3: Commit**

```bash
cd "$KB"
git add schemas/reflection.schema.json tests/fixtures/valid-reflection.md
git commit -m "schemas: add reflection.schema.json + fixture"
```

---

### Task 6: Fixture runner

**Files:**
- Create: `$KB/scripts/validate-fixtures.mjs`

The fixture runner asserts **valid fixtures pass and invalid fixtures fail** — so that the schemas can't silently accept bad data.

- [ ] **Step 6.1: Write the runner**

File: `$KB/scripts/validate-fixtures.mjs`

```javascript
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import yaml from "js-yaml";
import matter from "gray-matter";

const ROOT = new URL("..", import.meta.url).pathname;
const schemaPath = (name) => join(ROOT, "schemas", `${name}.schema.json`);
const fixturePath = (name) => join(ROOT, "tests", "fixtures", name);

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

function loadSchema(name) {
  return JSON.parse(readFileSync(schemaPath(name), "utf8"));
}

function loadYaml(fname) {
  return yaml.load(readFileSync(fixturePath(fname), "utf8"));
}

function loadFrontmatter(fname) {
  const raw = readFileSync(fixturePath(fname), "utf8");
  const parsed = matter(raw);
  if (Object.keys(parsed.data).length === 0) return null;
  return parsed.data;
}

const cases = [
  { schema: "pattern",     fixture: "valid-pattern.yaml",                     expect: "valid", loader: loadYaml },
  { schema: "pattern",     fixture: "invalid-pattern-missing-field.yaml",     expect: "invalid", loader: loadYaml },
  { schema: "pattern",     fixture: "invalid-pattern-bad-id.yaml",            expect: "invalid", loader: loadYaml },
  { schema: "rubric",      fixture: "valid-rubric.md",                        expect: "valid", loader: loadFrontmatter },
  { schema: "rubric",      fixture: "invalid-rubric-missing-frontmatter.md",  expect: "invalid", loader: loadFrontmatter },
  { schema: "reflection",  fixture: "valid-reflection.md",                    expect: "valid", loader: loadFrontmatter },
];

const validators = {};
function getValidator(name) {
  if (!validators[name]) {
    validators[name] = ajv.compile(loadSchema(name));
  }
  return validators[name];
}

let failed = 0;
for (const c of cases) {
  const validate = getValidator(c.schema);
  const data = c.loader(c.fixture);

  let ok;
  if (data === null) ok = false; // missing frontmatter
  else ok = validate(data);

  const result = ok ? "valid" : "invalid";
  const pass = result === c.expect;
  if (!pass) failed++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${c.schema}  ${c.fixture}  expected=${c.expect}  got=${result}`);
  if (!pass && ok === false) console.log("      errors:", JSON.stringify(validate.errors));
}

if (failed > 0) {
  console.error(`\n${failed} case(s) failed`);
  process.exit(1);
} else {
  console.log(`\nAll ${cases.length} cases passed`);
}
```

- [ ] **Step 6.2: Run and verify all cases pass**

```bash
cd "$KB"
node scripts/validate-fixtures.mjs
```

Expected output: every line `PASS`, final `All 6 cases passed`, exit 0.

- [ ] **Step 6.3: Commit**

```bash
cd "$KB"
git add scripts/validate-fixtures.mjs
git commit -m "scripts: add fixture runner for schemas"
```

---

## Group C: Validation Scripts

### Task 7: `validate-filename-id-match.mjs`

**Files:**
- Create: `$KB/scripts/validate-filename-id-match.mjs`

Contract: every `content/patterns/*.yaml` file has an `.id` field equal to its basename without `.yaml`.

- [ ] **Step 7.1: Add a throwaway test fixture (mismatched)**

File: `$KB/tests/fixtures/mismatch-pattern/correctness-999.yaml`

```yaml
id: "correctness-001"
title: "Filename says 999 but id says 001"
category: "correctness"
severity: "minor"
source_sprint: "test"
source_group: "group-001"
discovered_at: "2026-04-18T00:00:00+09:00"
frequency: 1
last_seen: "test"
description: "Intentional mismatch for validator testing."
detection: "validator must flag this."
prevention: "filename and id must match."
contract_clause: "filename matches id."
schema_version: 1
```

- [ ] **Step 7.2: Write the validator script**

File: `$KB/scripts/validate-filename-id-match.mjs`

```javascript
import { readFileSync, readdirSync } from "node:fs";
import { join, basename, extname } from "node:path";
import yaml from "js-yaml";

const ROOT = new URL("..", import.meta.url).pathname;

function collect(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".yaml"))
    .map((e) => join(dir, e.name));
}

function mainDir() {
  return join(ROOT, "content", "patterns");
}

function runOn(dir) {
  const files = collect(dir);
  let failed = 0;
  for (const file of files) {
    const expected = basename(file, extname(file));
    const doc = yaml.load(readFileSync(file, "utf8"));
    if (!doc || doc.id !== expected) {
      console.error(`FAIL  ${file}: id="${doc?.id}" does not match filename "${expected}"`);
      failed++;
    }
  }
  return failed;
}

const target = process.argv[2] ? join(ROOT, process.argv[2]) : mainDir();

let failed = 0;
try { failed = runOn(target); } catch (e) {
  if (e.code === "ENOENT") {
    console.log(`(no ${target}, skipping)`);
  } else { throw e; }
}

if (failed > 0) { console.error(`${failed} file(s) failed filename-id match`); process.exit(1); }
console.log("filename-id match OK");
```

- [ ] **Step 7.3: Run on the mismatched fixture to confirm it fails**

```bash
cd "$KB"
node scripts/validate-filename-id-match.mjs tests/fixtures/mismatch-pattern
```

Expected: `FAIL ... id="correctness-001" does not match filename "correctness-999"`, exit 1.

- [ ] **Step 7.4: Run on main `content/patterns/` (empty) to confirm it passes**

```bash
cd "$KB"
mkdir -p content/patterns
node scripts/validate-filename-id-match.mjs
```

Expected: `filename-id match OK`, exit 0.

- [ ] **Step 7.5: Create content placeholders and commit**

```bash
cd "$KB"
mkdir -p content/patterns content/rubrics content/reflections
touch content/patterns/.gitkeep content/rubrics/.gitkeep content/reflections/.gitkeep
git add scripts/validate-filename-id-match.mjs tests/fixtures/mismatch-pattern content/
git commit -m "scripts: add filename-id-match validator + content/ placeholders"
```

---

### Task 8: `validate-unique-ids.mjs`

**Files:**
- Create: `$KB/scripts/validate-unique-ids.mjs`

Contract: every pattern `.id` is globally unique across `content/patterns/` and `archived/patterns/`.

- [ ] **Step 8.1: Add throwaway dup fixtures**

File: `$KB/tests/fixtures/dup-ids/correctness-001.yaml` — copy `$KB/tests/fixtures/valid-pattern.yaml` verbatim.

File: `$KB/tests/fixtures/dup-ids-archive/correctness-001.yaml` — copy the same content.

```bash
cd "$KB"
mkdir -p tests/fixtures/dup-ids tests/fixtures/dup-ids-archive
cp tests/fixtures/valid-pattern.yaml tests/fixtures/dup-ids/correctness-001.yaml
cp tests/fixtures/valid-pattern.yaml tests/fixtures/dup-ids-archive/correctness-001.yaml
```

- [ ] **Step 8.2: Write the validator**

File: `$KB/scripts/validate-unique-ids.mjs`

```javascript
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";

const ROOT = new URL("..", import.meta.url).pathname;

function collectYaml(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".yaml"))
    .map((e) => join(dir, e.name));
}

function runOn(dirs) {
  const byId = new Map();
  for (const dir of dirs) {
    for (const file of collectYaml(dir)) {
      const id = yaml.load(readFileSync(file, "utf8"))?.id;
      if (!id) { console.error(`FAIL  ${file}: missing .id`); continue; }
      const existing = byId.get(id);
      if (existing) {
        console.error(`FAIL  duplicate id "${id}" in:\n    ${existing}\n    ${file}`);
        return 1;
      }
      byId.set(id, file);
    }
  }
  return 0;
}

const dirs = process.argv.length > 2
  ? process.argv.slice(2).map((p) => join(ROOT, p))
  : [join(ROOT, "content/patterns"), join(ROOT, "archived/patterns")];

if (runOn(dirs) > 0) process.exit(1);
console.log(`unique ids OK (${dirs.length} dir(s) checked)`);
```

- [ ] **Step 8.3: Run on dup fixtures to confirm fail**

```bash
cd "$KB"
node scripts/validate-unique-ids.mjs tests/fixtures/dup-ids tests/fixtures/dup-ids-archive
```

Expected: `FAIL duplicate id "correctness-001"`, exit 1.

- [ ] **Step 8.4: Run on main dirs (currently empty) to confirm pass**

```bash
cd "$KB"
node scripts/validate-unique-ids.mjs
```

Expected: `unique ids OK`, exit 0.

- [ ] **Step 8.5: Commit**

```bash
cd "$KB"
git add scripts/validate-unique-ids.mjs tests/fixtures/dup-ids tests/fixtures/dup-ids-archive
git commit -m "scripts: add unique-ids validator"
```

---

### Task 9: `validate-markdown-frontmatter.mjs`

**Files:**
- Create: `$KB/scripts/validate-markdown-frontmatter.mjs`

Contract: every `content/rubrics/*.md` validates against `rubric.schema.json` frontmatter; every `content/reflections/*.md` against `reflection.schema.json`.

- [ ] **Step 9.1: Write the validator**

File: `$KB/scripts/validate-markdown-frontmatter.mjs`

```javascript
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import matter from "gray-matter";

const ROOT = new URL("..", import.meta.url).pathname;
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

function loadSchema(name) {
  return ajv.compile(JSON.parse(readFileSync(join(ROOT, "schemas", `${name}.schema.json`), "utf8")));
}

function collectMd(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md") && !e.name.startsWith("."))
    .filter((e) => e.name !== "README.md")
    .map((e) => join(dir, e.name));
}

const targets = [
  { dir: join(ROOT, "content/rubrics"),      schema: loadSchema("rubric") },
  { dir: join(ROOT, "content/reflections"),  schema: loadSchema("reflection") },
];

let failed = 0;
for (const t of targets) {
  for (const file of collectMd(t.dir)) {
    const raw = readFileSync(file, "utf8");
    const parsed = matter(raw);
    if (Object.keys(parsed.data).length === 0) {
      console.error(`FAIL  ${file}: no frontmatter`);
      failed++;
      continue;
    }
    if (!t.schema(parsed.data)) {
      console.error(`FAIL  ${file}: ${JSON.stringify(t.schema.errors)}`);
      failed++;
    }
  }
}

if (failed > 0) process.exit(1);
console.log("markdown frontmatter OK");
```

- [ ] **Step 9.2: Run (empty dirs) → pass**

```bash
cd "$KB"
node scripts/validate-markdown-frontmatter.mjs
```

Expected: `markdown frontmatter OK`, exit 0.

- [ ] **Step 9.3: Drop invalid fixture temporarily into `content/rubrics/` → expect fail**

```bash
cd "$KB"
cp tests/fixtures/invalid-rubric-missing-frontmatter.md content/rubrics/probe.md
node scripts/validate-markdown-frontmatter.mjs
# expect: FAIL ... no frontmatter, exit 1
rm content/rubrics/probe.md
```

- [ ] **Step 9.4: Commit**

```bash
cd "$KB"
git add scripts/validate-markdown-frontmatter.mjs
git commit -m "scripts: add markdown frontmatter validator"
```

---

### Task 10: `validate-skill-frontmatter.mjs`

**Files:**
- Create: `$KB/scripts/validate-skill-frontmatter.mjs`

Contract: every `skills/*/SKILL.md` has frontmatter containing at least `name` and `description`. `name` must start with `zzem-kb:`.

- [ ] **Step 10.1: Write the validator**

File: `$KB/scripts/validate-skill-frontmatter.mjs`

```javascript
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const ROOT = new URL("..", import.meta.url).pathname;
const skillsDir = join(ROOT, "skills");

if (!existsSync(skillsDir)) {
  console.log("(no skills/ directory yet, skipping)");
  process.exit(0);
}

let failed = 0;
for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = join(skillsDir, entry.name, "SKILL.md");
  if (!existsSync(file)) {
    console.error(`FAIL  ${file}: missing`);
    failed++;
    continue;
  }
  const fm = matter(readFileSync(file, "utf8")).data;
  if (!fm.name || !fm.description) {
    console.error(`FAIL  ${file}: missing name or description`);
    failed++;
    continue;
  }
  if (!String(fm.name).startsWith("zzem-kb:")) {
    console.error(`FAIL  ${file}: name must start with "zzem-kb:" (got "${fm.name}")`);
    failed++;
  }
}

if (failed > 0) process.exit(1);
console.log("skill frontmatter OK");
```

- [ ] **Step 10.2: Run (no skills yet) → pass (skip)**

```bash
cd "$KB"
node scripts/validate-skill-frontmatter.mjs
```

Expected: `(no skills/ directory yet, skipping)`, exit 0.

- [ ] **Step 10.3: Commit**

```bash
cd "$KB"
git add scripts/validate-skill-frontmatter.mjs
git commit -m "scripts: add skill frontmatter validator"
```

---

### Task 11: `validate-schema-backwards-compat.mjs`

**Files:**
- Create: `$KB/scripts/validate-schema-backwards-compat.mjs`

Contract: every content file validates against the **current** schema. This prevents a schema edit from silently invalidating existing content.

- [ ] **Step 11.1: Write the validator**

File: `$KB/scripts/validate-schema-backwards-compat.mjs`

```javascript
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import yaml from "js-yaml";
import matter from "gray-matter";

const ROOT = new URL("..", import.meta.url).pathname;
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

function schema(name) {
  return ajv.compile(JSON.parse(readFileSync(join(ROOT, "schemas", `${name}.schema.json`), "utf8")));
}
function collect(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(ext) && !e.name.startsWith("."))
    .filter((e) => e.name !== "README.md")
    .map((e) => join(dir, e.name));
}

const targets = [
  { dir: join(ROOT, "content/patterns"),     ext: ".yaml", validate: schema("pattern"),    loader: (f) => yaml.load(readFileSync(f, "utf8")) },
  { dir: join(ROOT, "content/rubrics"),      ext: ".md",   validate: schema("rubric"),     loader: (f) => matter(readFileSync(f, "utf8")).data },
  { dir: join(ROOT, "content/reflections"),  ext: ".md",   validate: schema("reflection"), loader: (f) => matter(readFileSync(f, "utf8")).data },
];

let failed = 0;
for (const t of targets) {
  for (const file of collect(t.dir, t.ext)) {
    const data = t.loader(file);
    if (!t.validate(data)) {
      console.error(`FAIL  ${file}: ${JSON.stringify(t.validate.errors)}`);
      failed++;
    }
  }
}

if (failed > 0) { console.error(`${failed} file(s) incompatible with current schemas`); process.exit(1); }
console.log("schema backwards-compat OK");
```

- [ ] **Step 11.2: Run (empty content) → pass**

```bash
cd "$KB"
node scripts/validate-schema-backwards-compat.mjs
```

Expected: `schema backwards-compat OK`, exit 0.

- [ ] **Step 11.3: Commit**

```bash
cd "$KB"
git add scripts/validate-schema-backwards-compat.mjs
git commit -m "scripts: add schema backwards-compat validator"
```

---

## Group D: CI Workflows + CODEOWNERS

### Task 12: `validate.yml` workflow

**Files:**
- Create: `$KB/.github/workflows/validate.yml`

- [ ] **Step 12.1: Write the workflow**

File: `$KB/.github/workflows/validate.yml`

```yaml
name: validate
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run validate:schemas
      - run: npm run validate:content
      - run: npm run validate:skills
      - run: npm run validate:backcompat
```

- [ ] **Step 12.2: Commit**

```bash
cd "$KB"
git add .github/workflows/validate.yml
git commit -m "ci: add validate workflow"
```

- [ ] **Step 12.3: Push and confirm run on origin**

```bash
cd "$KB"
git push
gh run list --limit 1
gh run watch
```

Expected: validate job passes. If it fails, fix and re-push before continuing.

---

### Task 13: `guard-sensitive-paths.yml` workflow

**Files:**
- Create: `$KB/.github/workflows/guard-sensitive-paths.yml`

- [ ] **Step 13.1: Write the workflow**

File: `$KB/.github/workflows/guard-sensitive-paths.yml`

```yaml
name: guard-sensitive-paths
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
          # On the first commit of a branch, HEAD^ doesn't exist; skip.
          if ! git rev-parse HEAD^ >/dev/null 2>&1; then
            echo "First commit; nothing to diff. Skipping."
            exit 0
          fi
          CHANGED=$(git diff --name-only HEAD^ HEAD)
          echo "Changed files:"
          echo "$CHANGED"
          if echo "$CHANGED" | grep -E '^(schemas|skills|scripts|\.github)/' >/dev/null; then
            echo ""
            echo "::error::Direct push to protected paths detected. Rulesets may be misconfigured."
            exit 1
          fi
          echo "All changes in content/ — OK"
```

- [ ] **Step 13.2: Commit and push**

```bash
cd "$KB"
git add .github/workflows/guard-sensitive-paths.yml
git commit -m "ci: add guard-sensitive-paths tripwire"
git push
```

Expected: this push itself touches `.github/`. The guard workflow should **fail** on this push. That failure is the intended behavior before rulesets are configured — it proves the tripwire works. Note the run URL for later reference; the follow-up ruleset setup (Task 27) will prevent such direct pushes in the future.

```bash
gh run list --workflow=guard-sensitive-paths.yml --limit 1
```

---

### Task 14: `CODEOWNERS`

**Files:**
- Create: `$KB/.github/CODEOWNERS`

- [ ] **Step 14.1: Write CODEOWNERS**

File: `$KB/.github/CODEOWNERS`

```
/schemas/**   @zach-wrtn
/skills/**    @zach-wrtn
/scripts/**   @zach-wrtn
/.github/**   @zach-wrtn
```

- [ ] **Step 14.2: Commit and push**

```bash
cd "$KB"
git add .github/CODEOWNERS
git commit -m "chore: add CODEOWNERS for protocol paths"
git push
```

Expected: guard workflow fails again (touched `.github/`). Acknowledge and proceed; rulesets in Task 27 will close this loop.

---

## Group E: Skills

Each skill lives at `skills/{name}/SKILL.md`. Frontmatter must have `name: zzem-kb:<action>` and a `description`.

### Task 15: `zzem-kb:sync`

**Files:**
- Create: `$KB/skills/sync/SKILL.md`

- [ ] **Step 15.1: Write the skill**

File: `$KB/skills/sync/SKILL.md`

```markdown
---
name: zzem-kb:sync
description: Pull the latest state of the team knowledge base into the local clone. Invoke at the start of every sprint phase before reading or writing KB content.
---

# zzem-kb:sync

## Preconditions
- Environment variable `$ZZEM_KB_PATH` is set (default `~/.zzem/kb`) and is a git clone of `zach-wrtn/knowledge-base`.
- Working tree at `$ZZEM_KB_PATH` is clean (or has only tracked staged changes the caller is about to commit).

## Steps
1. **Fetch and fast-forward**
   Bash: `git -C "$ZZEM_KB_PATH" checkout main && git -C "$ZZEM_KB_PATH" pull --ff-only`

2. **Report HEAD**
   Bash: `git -C "$ZZEM_KB_PATH" rev-parse --short HEAD`

## Failure handling
- `pull --ff-only` rejected because of local changes: the caller has left uncommitted work. Do NOT stash silently; abort and report back to the user.
- Network failure: continue with the current local state and log a warning. Reads are still valid against the cached clone.

## Verification (smoke)
1. In a second clone at `/tmp/kb-probe`, make a commit on main and push.
2. Invoke this skill against the original clone.
3. Confirm `git log -1` on the original now contains the probe commit.
```

- [ ] **Step 15.2: Commit**

```bash
cd "$KB"
git add skills/sync/SKILL.md
git commit -m "skills: add zzem-kb:sync"
```

---

### Task 16: `zzem-kb:read`

**Files:**
- Create: `$KB/skills/read/SKILL.md`

- [ ] **Step 16.1: Write the skill**

File: `$KB/skills/read/SKILL.md`

```markdown
---
name: zzem-kb:read
description: Query the KB by content type and filters. Returns file paths (caller reads content via Read tool). Use at Phase 2 Spec to load prior patterns/reflections and at Phase 4 Evaluator to load the latest rubric.
---

# zzem-kb:read

## Inputs
- `type` — one of `pattern`, `rubric`, `reflection` (required).
- Filters (optional, AND semantics):
  - For `pattern`: `category` (enum), `severity` (enum), `min_frequency` (integer).
  - For `rubric`: `status` (default `active`).
  - For `reflection`: `domain` (string), `limit` (integer, default 3, most-recent first by `completed_at`).

## Preconditions
- `zzem-kb:sync` was invoked in this sprint phase. If not, invoke it first.

## Steps
1. **Resolve directory**
   - `pattern` → `$ZZEM_KB_PATH/content/patterns/`
   - `rubric`  → `$ZZEM_KB_PATH/content/rubrics/`
   - `reflection` → `$ZZEM_KB_PATH/content/reflections/`

2. **List candidates**
   Glob: `{dir}/*.yaml` for patterns, `*.md` for rubrics/reflections.

3. **Filter client-side**
   Read each candidate, parse YAML or frontmatter, apply filter predicate.
   - `pattern`: keep if `category`, `severity`, `frequency >= min_frequency` match.
   - `rubric`: keep if frontmatter `status` matches; sort descending by `version`; return top 1.
   - `reflection`: keep if `domain` matches; sort by `completed_at` desc; slice `limit`.

4. **Return paths**
   Output a list of absolute file paths. The caller uses Read on each.

## Failure handling
- No matches → return empty list. Do not treat as error.
- Parse error on one file → log the specific file and skip it; continue.

## Verification (smoke)
Invoke with `type=pattern, category=correctness` after migration. Expect ≥3 files returned.
```

- [ ] **Step 16.2: Commit**

```bash
cd "$KB"
git add skills/read/SKILL.md
git commit -m "skills: add zzem-kb:read"
```

---

### Task 17: `zzem-kb:write-pattern`

**Files:**
- Create: `$KB/skills/write-pattern/SKILL.md`

- [ ] **Step 17.1: Write the skill**

File: `$KB/skills/write-pattern/SKILL.md`

```markdown
---
name: zzem-kb:write-pattern
description: Create a new pattern YAML, validate against schema, commit, and push with rebase retry. Use at Phase 4 Evaluator when a defect pattern does not match any existing pattern.
---

# zzem-kb:write-pattern

## Inputs (all required unless noted)
- `category` — one of `correctness | completeness | integration | edge_case | code_quality | design_proto | design_spec`
- `severity` — one of `critical | major | minor`
- `title` — ≤120 chars
- `source_sprint` — e.g. `ai-webtoon-007`
- `source_group` — e.g. `group-001`
- `description`, `detection`, `prevention`, `contract_clause` — each ≥10 chars
- `example.bad`, `example.good` — optional

## Preconditions
- `zzem-kb:sync` succeeded in this session.
- Working tree at `$ZZEM_KB_PATH` is clean.

## Steps

1. **Ensure main + fast-forward**
   Bash:
   ```
   cd "$ZZEM_KB_PATH"
   git checkout main
   git pull --ff-only
   ```

2. **Determine next id**
   Glob: `content/patterns/{category}-*.yaml`
   Parse `NNN` suffix; take `max + 1`; zero-pad to 3 digits. Next id = `{category}-{NNN}`.

3. **Read schema for reference**
   Read: `schemas/pattern.schema.json`

4. **Compose the YAML**
   Write: `content/patterns/{id}.yaml`

   Fields to emit:
   - `id`, `title`, `category`, `severity`, `source_sprint`, `source_group`
   - `discovered_at`: current ISO 8601 with offset (e.g. `2026-04-18T12:34:56+09:00`)
   - `frequency: 1`
   - `last_seen: {source_sprint}`
   - `description`, `detection`, `prevention`, `contract_clause`
   - `example` (if provided)
   - `schema_version: 1`

5. **Local validate (best-effort)**
   Bash:
   ```
   cd "$ZZEM_KB_PATH"
   npm run validate:content || { echo "validation failed; fix and re-run from step 4"; exit 1; }
   ```

6. **Commit + rebase-retry push**
   Bash:
   ```
   cd "$ZZEM_KB_PATH"
   git add content/patterns/{id}.yaml
   git commit -m "pattern: {id} from {source_sprint}/{source_group}"
   for i in 1 2 3; do
     if git pull --rebase origin main && git push; then exit 0; fi
     sleep $((2**i))
   done
   echo "push failed after 3 retries; file remains committed locally"
   exit 1
   ```

## Failure handling
- Local validate fails → fix body; re-run from step 5. Do NOT commit malformed content.
- CI fails after push → read `gh run view --log-failed` on latest run; fix; commit+push again.
- 3 retries exhausted → report to caller. Sprint continues; file is locally committed and can be pushed later.

## Verification (smoke)
Invoke with a dummy pattern in a throwaway branch; verify:
- File appears at `content/patterns/{id}.yaml`.
- CI `validate` passes on the resulting push.
- `gh pr list` is empty (direct push permitted for content).
```

- [ ] **Step 17.2: Commit**

```bash
cd "$KB"
git add skills/write-pattern/SKILL.md
git commit -m "skills: add zzem-kb:write-pattern"
```

---

### Task 18: `zzem-kb:update-pattern`

**Files:**
- Create: `$KB/skills/update-pattern/SKILL.md`

- [ ] **Step 18.1: Write the skill**

File: `$KB/skills/update-pattern/SKILL.md`

```markdown
---
name: zzem-kb:update-pattern
description: Increment the frequency counter and refresh last_seen on an existing pattern. Use at Phase 4 Evaluator when a recurring defect matches an existing pattern.
---

# zzem-kb:update-pattern

## Inputs
- `id` — e.g. `correctness-001` (required, must match existing pattern)
- `source_sprint` — the sprint that just observed the pattern (required)

## Preconditions
- `zzem-kb:sync` succeeded in this session.
- Working tree at `$ZZEM_KB_PATH` is clean.

## Steps

1. **Sync main**
   Bash: `cd "$ZZEM_KB_PATH" && git checkout main && git pull --ff-only`

2. **Locate and parse file**
   Read: `content/patterns/{id}.yaml`
   If missing: abort, report "pattern not found".

3. **Mutate frequency + last_seen**
   Edit the YAML:
   - `frequency: <current + 1>`
   - `last_seen: {source_sprint}`
   Leave every other field untouched (especially `discovered_at`).

4. **Validate**
   Bash: `cd "$ZZEM_KB_PATH" && npm run validate:content`

5. **Commit + rebase-retry push**
   Bash:
   ```
   cd "$ZZEM_KB_PATH"
   git add content/patterns/{id}.yaml
   git commit -m "pattern: {id} frequency +1 ({source_sprint})"
   for i in 1 2 3; do
     if git pull --rebase origin main && git push; then exit 0; fi
     sleep $((2**i))
   done
   echo "push failed after 3 retries"
   exit 1
   ```

## Failure handling
- Pattern not found → abort with "pattern not found: {id}". Do NOT create a new pattern here; use `zzem-kb:write-pattern` for that.
- Validate fails → pattern file was unexpectedly malformed; surface to caller.

## Verification (smoke)
Pick an existing pattern (say `correctness-001`), invoke with a test sprint id. Diff on `content/patterns/correctness-001.yaml` must show only `frequency` incremented and `last_seen` updated.
```

- [ ] **Step 18.2: Commit**

```bash
cd "$KB"
git add skills/update-pattern/SKILL.md
git commit -m "skills: add zzem-kb:update-pattern"
```

---

### Task 19: `zzem-kb:write-reflection`

**Files:**
- Create: `$KB/skills/write-reflection/SKILL.md`

- [ ] **Step 19.1: Write the skill**

File: `$KB/skills/write-reflection/SKILL.md`

```markdown
---
name: zzem-kb:write-reflection
description: Record a sprint-end reflection (markdown + frontmatter) and push to the KB. Use at the Phase 6 Retrospective of every sprint.
---

# zzem-kb:write-reflection

## Inputs
- `sprint_id` — required, lowercase-hyphen.
- `domain` — required (e.g. `ai-webtoon`, `ugc-platform`).
- `completed_at` — ISO 8601 with offset.
- `outcome` — one of `pass | fail | partial`.
- `related_patterns` — optional array of pattern ids.
- `body` — markdown narrative (required, non-empty).

## Preconditions
- `zzem-kb:sync` succeeded in this session.
- Working tree at `$ZZEM_KB_PATH` is clean.

## Steps

1. **Sync main**
   Bash: `cd "$ZZEM_KB_PATH" && git checkout main && git pull --ff-only`

2. **Write file**
   Write: `content/reflections/{sprint_id}.md`

   Content:
   ```
   ---
   sprint_id: {sprint_id}
   domain: {domain}
   completed_at: "{completed_at}"
   outcome: {outcome}
   related_patterns:
   {each id as "- <id>"; omit key if empty}
   schema_version: 1
   ---

   {body}
   ```

3. **Validate frontmatter**
   Bash: `cd "$ZZEM_KB_PATH" && npm run validate:content`

4. **Commit + rebase-retry push**
   Bash:
   ```
   cd "$ZZEM_KB_PATH"
   git add content/reflections/{sprint_id}.md
   git commit -m "reflection: {sprint_id} ({outcome})"
   for i in 1 2 3; do
     if git pull --rebase origin main && git push; then exit 0; fi
     sleep $((2**i))
   done
   exit 1
   ```

## Failure handling
- Duplicate reflection (file exists) → overwrite is NOT allowed by this skill; abort. Use a different sprint_id or remove the existing file via PR.

## Verification (smoke)
Create a throwaway reflection; confirm file appears and CI passes.
```

- [ ] **Step 19.2: Commit**

```bash
cd "$KB"
git add skills/write-reflection/SKILL.md
git commit -m "skills: add zzem-kb:write-reflection"
```

---

## Group F: Install Script + README

### Task 20: `install-skills.sh`

**Files:**
- Create: `$KB/scripts/install-skills.sh`

- [ ] **Step 20.1: Write the installer**

File: `$KB/scripts/install-skills.sh`

```bash
#!/usr/bin/env bash
# Symlink zzem-kb skills from this repo into ~/.claude/skills/zzem-kb/.
# Idempotent.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$HOME/.claude/skills/zzem-kb"

mkdir -p "$(dirname "$TARGET")"

if [ -L "$TARGET" ]; then
  rm "$TARGET"
elif [ -e "$TARGET" ]; then
  echo "error: $TARGET exists and is not a symlink. Remove manually and re-run." >&2
  exit 1
fi

ln -s "$REPO_ROOT/skills" "$TARGET"
echo "linked $TARGET -> $REPO_ROOT/skills"
```

- [ ] **Step 20.2: Make executable and run**

```bash
cd "$KB"
chmod +x scripts/install-skills.sh
./scripts/install-skills.sh
ls -l ~/.claude/skills/zzem-kb
```

Expected: symlink created, pointing at `$KB/skills`.

- [ ] **Step 20.3: Commit**

```bash
cd "$KB"
git add scripts/install-skills.sh
git commit -m "scripts: add install-skills.sh"
```

---

### Task 21: Author `README.md`

**Files:**
- Create: `$KB/README.md`

- [ ] **Step 21.1: Write README**

File: `$KB/README.md`

````markdown
# zzem-knowledge-base

Machine-readable team knowledge base consumed by orchestrator agents.

## Install (consumer)

```bash
# First-time setup
git clone git@github.com:zach-wrtn/knowledge-base.git ~/.zzem/kb
~/.zzem/kb/scripts/install-skills.sh
```

The orchestrator's `scripts/kb-bootstrap.sh` runs both steps idempotently on session start.

Override the clone path with `ZZEM_KB_PATH=/custom/path`.

## Skills (agent interface)

| Skill | Purpose |
|-------|---------|
| `zzem-kb:sync` | Pull latest KB state |
| `zzem-kb:read` | Query by type/category/severity/domain |
| `zzem-kb:write-pattern` | Create a new defect pattern |
| `zzem-kb:update-pattern` | Bump frequency / last_seen of an existing pattern |
| `zzem-kb:write-reflection` | Record a sprint retrospective |

Each skill's `SKILL.md` is the authoritative protocol; agents invoke them via the Skill tool.

## Content types

| Type | Directory | Schema | Filename |
|------|-----------|--------|----------|
| pattern | `content/patterns/` | `schemas/pattern.schema.json` | `{category}-{NNN}.yaml` |
| rubric | `content/rubrics/` | `schemas/rubric.schema.json` | `v{N}.md` |
| reflection | `content/reflections/` | `schemas/reflection.schema.json` | `{sprint-id}.md` |

## Contributing

- **Content (`content/**`):** direct push to `main` permitted (CI validates schemas).
- **Everything else:** PR required; CODEOWNERS review enforced by repository ruleset.

Breaking schema changes follow the procedure in the Phase 1 design doc `docs/superpowers/specs/2026-04-18-knowledge-base-platform-phase1-design.md` in the orchestrator repo.

## Development

```bash
npm install
npm run validate   # run all validators locally
```

## License

Private — zach-wrtn internal.
````

- [ ] **Step 21.2: Commit and push**

```bash
cd "$KB"
git add README.md
git commit -m "docs: add README"
git push
```

---

## Group G: Migration

### Task 22: `migrate-from-orchestrator.mjs`

**Files:**
- Create: `$KB/scripts/migrate-from-orchestrator.mjs`

Copies 13 patterns, 2 rubrics, and 3 reflections from `$OLD_KB` into `$KB/content/`, adding `schema_version: 1` and frontmatter where missing.

- [ ] **Step 22.1: Write the migration script**

File: `$KB/scripts/migrate-from-orchestrator.mjs`

```javascript
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import yaml from "js-yaml";
import matter from "gray-matter";

const OLD_KB = process.env.OLD_KB;
if (!OLD_KB || !existsSync(OLD_KB)) {
  console.error("Set OLD_KB to the sprint-orchestrator/knowledge-base path.");
  process.exit(1);
}

const ROOT = new URL("..", import.meta.url).pathname;
const TARGET = {
  patterns:    join(ROOT, "content/patterns"),
  rubrics:     join(ROOT, "content/rubrics"),
  reflections: join(ROOT, "content/reflections"),
};
for (const d of Object.values(TARGET)) mkdirSync(d, { recursive: true });

function copyPatterns() {
  const src = join(OLD_KB, "patterns");
  const files = readdirSync(src).filter((f) => f.endsWith(".yaml") && f !== "README.yaml");
  for (const f of files) {
    if (f === "README.md" || f === "README.yaml") continue;
    const doc = yaml.load(readFileSync(join(src, f), "utf8"));
    if (!doc) { console.warn(`skip ${f}: empty`); continue; }
    if (doc.schema_version === undefined) doc.schema_version = 1;
    writeFileSync(join(TARGET.patterns, f), yaml.dump(doc, { lineWidth: 0 }));
    console.log(`pattern  ${f}`);
  }
}

function copyRubrics() {
  const src = join(OLD_KB, "rubrics");
  const files = readdirSync(src).filter((f) => /^v\d+\.md$/.test(f));
  // Sort by version ascending; latest = active
  files.sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
  const latest = files.at(-1);

  for (const f of files) {
    const version = parseInt(f.slice(1), 10);
    const raw = readFileSync(join(src, f), "utf8");
    const existing = matter(raw);
    const body = existing.content || raw;
    const isActive = f === latest;
    const fm = {
      version,
      status: isActive ? "active" : "superseded",
      superseded_by: isActive ? null : version + 1,
      changelog: existing.data?.changelog || "",
      schema_version: 1,
    };
    const out = matter.stringify(body, fm);
    writeFileSync(join(TARGET.rubrics, f), out);
    console.log(`rubric   ${f} (${fm.status})`);
  }
}

function copyReflections() {
  const src = join(OLD_KB, "reflections");
  const files = readdirSync(src).filter((f) => f.endsWith(".md") && f !== "README.md");
  for (const f of files) {
    const sprintId = basename(f, ".md");
    const raw = readFileSync(join(src, f), "utf8");
    const existing = matter(raw);
    const body = existing.content || raw;
    const fm = {
      sprint_id: existing.data?.sprint_id || sprintId,
      domain: existing.data?.domain || sprintId.split("-").slice(0, -1).join("-") || sprintId,
      completed_at: existing.data?.completed_at || "2026-04-01T00:00:00+09:00",
      outcome: existing.data?.outcome || "pass",
      related_patterns: existing.data?.related_patterns || [],
      schema_version: 1,
    };
    if (!fm.related_patterns.length) delete fm.related_patterns;
    const out = matter.stringify(body, fm);
    writeFileSync(join(TARGET.reflections, f), out);
    console.log(`reflection ${f}`);
  }
}

copyPatterns();
copyRubrics();
copyReflections();

console.log("\nMigration complete. Review generated files, then run: npm run validate");
```

- [ ] **Step 22.2: Dry-run migration (do not commit yet)**

```bash
cd "$KB"
OLD_KB="$OLD_KB" node scripts/migrate-from-orchestrator.mjs
```

Expected: ~18 `pattern|rubric|reflection ...` lines, no errors.

- [ ] **Step 22.3: Run validators against the freshly migrated content**

```bash
cd "$KB"
npm run validate
```

Expected: all validators exit 0. If any file fails, inspect the file; common fixes:

- Reflection missing `completed_at` → migration script filled `2026-04-01T00:00:00+09:00`; edit to the real date from git log of the original file.
- Reflection `domain` wrong → edit manually.
- Any pattern mismatch → inspect and fix the source file in `$OLD_KB`, re-run migration (the target is overwritten).

- [ ] **Step 22.4: Commit the seed**

```bash
cd "$KB"
git add content/ scripts/migrate-from-orchestrator.mjs
git commit -m "migrate: seed content/ from sprint-orchestrator (2026-04)"
```

---

### Task 23: Push seed + CI verify

- [ ] **Step 23.1: Push**

```bash
cd "$KB"
git push
```

- [ ] **Step 23.2: Watch CI**

```bash
gh run watch
```

Expected: both `validate` and `guard-sensitive-paths` complete. `validate` must be green. `guard-sensitive-paths` may pass (content-only changes) or fail if previous commits in this push touched sensitive paths — that is acceptable until Task 27 enables rulesets. Record any real validate failures and fix forward.

---

## Group H: Orchestrator Integration

### Task 24: `kb-bootstrap.sh`

**Files:**
- Create: `$ORCH/scripts/kb-bootstrap.sh`

- [ ] **Step 24.1: Write bootstrap**

File: `$ORCH/scripts/kb-bootstrap.sh`

```bash
#!/usr/bin/env bash
# Clone (or pull) the zzem KB and symlink its skills.
# Idempotent; safe to run on every session start.
set -euo pipefail

KB_PATH="${ZZEM_KB_PATH:-$HOME/.zzem/kb}"
KB_URL="git@github.com:zach-wrtn/knowledge-base.git"

if [ ! -d "$KB_PATH/.git" ]; then
  mkdir -p "$(dirname "$KB_PATH")"
  git clone "$KB_URL" "$KB_PATH"
else
  git -C "$KB_PATH" fetch origin main
fi

"$KB_PATH/scripts/install-skills.sh"
```

- [ ] **Step 24.2: Make executable and smoke-test**

```bash
chmod +x "$ORCH/scripts/kb-bootstrap.sh"
"$ORCH/scripts/kb-bootstrap.sh"
ls -l ~/.claude/skills/zzem-kb
```

Expected: clone exists at `~/.zzem/kb`, symlink resolves to `$HOME/.zzem/kb/skills`.

- [ ] **Step 24.3: Commit**

```bash
cd "$ORCH"
git add scripts/kb-bootstrap.sh
git commit -m "scripts: add kb-bootstrap.sh for zzem knowledge-base"
```

---

### Task 25: Update `sprint-contract-template.md`

**Files:**
- Modify: `$ORCH/sprint-orchestrator/templates/sprint-contract-template.md`

Replace any file-path references to `sprint-orchestrator/knowledge-base/` with skill invocations.

- [ ] **Step 25.1: Locate references**

```bash
grep -n "knowledge-base" "$ORCH/sprint-orchestrator/templates/sprint-contract-template.md"
```

Note each line number.

- [ ] **Step 25.2: Apply edits**

For each reference, replace as follows:

- "참조: `sprint-orchestrator/knowledge-base/patterns/...`" → "참조: Skill `zzem-kb:read` with `type=pattern, category=...`"
- "KB 경로 ..." → "KB 접근은 `zzem-kb:*` 스킬을 통해서만 수행. 스킬 카탈로그는 `~/.claude/skills/zzem-kb/`."
- Preserve surrounding wording unless the change is forced.

Use Edit on the file with a unique old_string per occurrence. If there are many similar lines, verify each replace produces the intended text by re-reading after each edit.

- [ ] **Step 25.3: Commit**

```bash
cd "$ORCH"
git add sprint-orchestrator/templates/sprint-contract-template.md
git commit -m "chore(template): KB access via zzem-kb:* skills"
```

---

### Task 26: Session-start hook wiring

**Files:**
- Modify: `$ORCH/.claude/settings.json` (or equivalent hook config; see `Bash: ls $ORCH/.claude/`)

The orchestrator already has a harness; this step adds a SessionStart hook that invokes `scripts/kb-bootstrap.sh`.

- [ ] **Step 26.1: Inspect current settings**

```bash
cat "$ORCH/.claude/settings.json" 2>/dev/null || echo "(no settings.json)"
cat "$ORCH/.claude/settings.local.json" 2>/dev/null || echo "(no settings.local.json)"
ls "$ORCH/.claude/hooks" 2>/dev/null || echo "(no hooks dir)"
```

Choose the correct target based on what exists. If neither exists, create `$ORCH/.claude/settings.local.json`.

- [ ] **Step 26.2: Add SessionStart hook**

Edit the chosen settings file to include (merging with existing keys):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "bash scripts/kb-bootstrap.sh" }
        ]
      }
    ]
  }
}
```

- [ ] **Step 26.3: Verify hook fires**

Start a new Claude Code session inside `$ORCH`. Confirm console output contains `linked ~/.claude/skills/zzem-kb -> ...` or `Already up to date`.

- [ ] **Step 26.4: Commit**

```bash
cd "$ORCH"
git add .claude/settings.json .claude/settings.local.json 2>/dev/null
git commit -m "chore(harness): run kb-bootstrap on session start"
```

---

## Group I: Ruleset + Branch Protection

### Task 27: Enable GitHub Ruleset

Rulesets are the **authoritative** enforcement of path-scoped PR requirement (Spec §6.5).

- [ ] **Step 27.1: Enable classic branch protection first (defense in depth)**

```bash
gh api -X PUT repos/zach-wrtn/knowledge-base/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["validate", "guard-sensitive-paths"] },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

Expected: JSON response confirming protection. No required reviews (content path stays fast-lane).

- [ ] **Step 27.2: Create the ruleset enforcing PR for sensitive paths**

```bash
gh api -X POST repos/zach-wrtn/knowledge-base/rulesets --input - <<'JSON'
{
  "name": "protected-paths",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "require_code_owner_review": true,
        "dismiss_stale_reviews_on_push": false,
        "required_approving_review_count": 1,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "file_path_restriction",
      "parameters": {
        "restricted_file_paths": [
          "schemas/**",
          "skills/**",
          "scripts/**",
          ".github/**"
        ]
      }
    }
  ]
}
JSON
```

Note: the exact `file_path_restriction` parameter shape may differ across API versions. If `gh api` returns a 422, open repo Settings → Rules → New ruleset, set the same intent via UI, then re-run `gh api -X GET repos/zach-wrtn/knowledge-base/rulesets` to document the resulting id.

- [ ] **Step 27.3: Verify**

From a fresh throwaway clone:

```bash
cd /tmp && rm -rf kb-probe && git clone git@github.com:zach-wrtn/knowledge-base.git kb-probe
cd kb-probe
echo "# probe" >> schemas/pattern.schema.json
git add schemas/pattern.schema.json
git commit -m "probe: direct push to schemas"
git push
```

Expected: push **rejected** by ruleset ("pull request required for this path"). Revert locally:

```bash
cd /tmp/kb-probe
git reset --hard origin/main
cd - && rm -rf /tmp/kb-probe
```

Also verify content push still works:

```bash
cd /tmp && rm -rf kb-probe && git clone git@github.com:zach-wrtn/knowledge-base.git kb-probe
cd kb-probe
echo "" >> content/patterns/correctness-001.yaml  # trivial whitespace change
git add content/patterns/correctness-001.yaml
git commit -m "probe: direct push to content"
git push
```

Expected: push **succeeds**, CI runs. Revert:

```bash
git revert HEAD --no-edit
git push
cd - && rm -rf /tmp/kb-probe
```

---

## Group J: Dogfood Checklist

### Task 28: Dogfood checklist template

**Files:**
- Create: `$ORCH/sprint-orchestrator/templates/kb-dogfood-checklist.md`

- [ ] **Step 28.1: Write the template**

File: `$ORCH/sprint-orchestrator/templates/kb-dogfood-checklist.md`

```markdown
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
```

- [ ] **Step 28.2: Commit**

```bash
cd "$ORCH"
git add sprint-orchestrator/templates/kb-dogfood-checklist.md
git commit -m "templates: add KB Phase 1 dogfood checklist"
```

---

## Group K: Post-Dogfood Cleanup

**Execute Tasks 29–30 only after one sprint successfully used the new KB end-to-end per the Task 28 checklist.**

### Task 29: Remove file-based KB

**Files:**
- Delete: `$ORCH/sprint-orchestrator/knowledge-base/` (entire directory)
- Modify: `$ORCH/MEMORY.md` (if present) — actually lives at `~/.claude/projects/<project>/memory/MEMORY.md`; update the reference there

- [ ] **Step 29.1: Confirm dogfood checklist complete**

Open `$ORCH/sprint-orchestrator/sprints/<dogfood-sprint>/kb-dogfood.md`. Every checkbox must be checked. If not: abort and continue dogfood.

- [ ] **Step 29.2: Remove the directory**

```bash
cd "$ORCH"
git rm -r sprint-orchestrator/knowledge-base
```

- [ ] **Step 29.3: Update MEMORY.md reference**

Grep for `knowledge-base` in the auto-memory dir:

```bash
grep -RIn "knowledge-base" ~/.claude/projects/-Users-zachryu-dev-work-zzem-orchestrator/memory/ || true
```

For `reference_knowledge_base.md`, rewrite the pointer to reference the new repo and skills. Use Edit with the exact old string.

- [ ] **Step 29.4: Commit**

```bash
cd "$ORCH"
git add -A
git commit -m "chore: remove file-based KB (migrated to zach-wrtn/knowledge-base)"
```

- [ ] **Step 29.5: Verify no stale references**

```bash
cd "$ORCH"
grep -RIn "sprint-orchestrator/knowledge-base" . --exclude-dir=node_modules --exclude-dir=.git || echo "clean"
```

Expected: `clean`, or only hits inside `docs/superpowers/specs/2026-04-18-knowledge-base-platform-phase1-design.md` (the spec itself historically references the old path; keep those).

---

### Task 30: Tag `v1.0.0` on the KB repo

- [ ] **Step 30.1: Tag**

```bash
cd "$KB"
git checkout main
git pull --ff-only
git tag -a v1.0.0 -m "Phase 1 — initial release"
git push origin v1.0.0
```

- [ ] **Step 30.2: Write release notes**

```bash
gh release create v1.0.0 \
  --repo zach-wrtn/knowledge-base \
  --title "v1.0.0 — Phase 1" \
  --notes "Initial release. Contents: 13 patterns, 2 rubrics, 3 reflections seeded from sprint-orchestrator. Five skills (sync, read, write-pattern, update-pattern, write-reflection). CI validates all content on push; GitHub Ruleset requires PR + CODEOWNERS review for schemas/, skills/, scripts/, .github/."
```

Expected: release page URL printed. Share with team.

---

## Spec Coverage Map

Cross-reference to confirm the plan implements every requirement in the spec.

| Spec section | Tasks |
|--------------|-------|
| §1.4 Goals | Tasks 1, 15–19, 22–23, 3–5, 22, 29 |
| §1.6 Locked decisions | Tasks 1 (git-backed), 15–19 (skills), 20 (skills inside repo, symlink install) |
| §2.1 Repo layout | Tasks 1, 3–14, 15–21 |
| §2.2 Consumer layout | Task 24 |
| §3.2 pattern.schema.json | Task 3 |
| §3.3 rubric.schema.json | Task 4 |
| §3.4 reflection.schema.json | Task 5 |
| §3.5 Versioning policy | Documented in README (Task 21) + spec reference in README |
| §4.1 Skill inventory | Tasks 15–19 |
| §4.2 Skill file format + §4.3 write-pattern flow | Task 17 |
| §4.4 Skill distribution | Task 20 |
| §5.1 Bootstrap | Task 24 |
| §5.2–5.4 Read/write/conflict flows | Tasks 15–19 |
| §5.5 Update flow | Task 18 |
| §6.3 Branch protection | Task 27 step 1 |
| §6.4 CODEOWNERS | Task 14 |
| §6.5 Ruleset + guard | Tasks 13, 27 step 2 |
| §7.2 Migration steps 1–5 | Tasks 1, 22–23, 24–26, dogfood, 29 |
| §7.5 Success criteria | Task 30 exit check |
| §8.1 Schema unit CI | Tasks 6–12 |
| §8.2 Skill smoke | Each skill task has a Verification section; exercised during dogfood (Task 28) |
| §8.3 E2E dogfood | Task 28 |
| §8.4 Observability | Deferred to Phase 2+ as spec states |
| §8.5 Failure playbook | Documented in README + individual skill SKILL.md Failure handling |

---

## Roll-back Map

| Step | If this fails | Back out by |
|------|---------------|-------------|
| Tasks 1–21 | Broken commits | `git reset --hard` on `$KB`; no external impact until Task 23 push |
| Task 22 migration | Bad seed data | Fix the script, re-run (target dir is overwritten), re-commit |
| Task 23 push | CI red | Fix forward — edit the offending file, push again |
| Tasks 24–26 orchestrator | Session hook breaks | Revert the three integration commits; KB repo unaffected |
| Task 27 ruleset | Over-restrictive | Disable ruleset via `gh api -X DELETE repos/zach-wrtn/knowledge-base/rulesets/<id>`, redo |
| Task 29 cleanup | Agents fail reading KB | Revert `git rm` commit; sprint-orchestrator/knowledge-base/ is restored; fix skills; retry |
