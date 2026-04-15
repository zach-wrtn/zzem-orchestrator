# Sprint Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a Linear-changelog-style historical gallery of every sprint's prototypes to GitHub Pages.

**Architecture:** Astro static site reads `sprint-orchestrator/sprints/*/` at build time via a filesystem collector, copies prototype HTML into `public/`, reuses existing per-prototype screenshots as thumbnails, and renders a timeline home + per-sprint detail pages. GitHub Actions replaces the existing `deploy-prototypes.yml` workflow, deploying the built `dist/` to Pages on every `main` push.

**Tech Stack:** Astro (static), TypeScript, MDX, vanilla CSS with design tokens, React (islands for modal + ⌘K palette), Vitest (unit tests), GitHub Actions, GitHub Pages.

---

## Discovery Summary (from spec + existing codebase)

Key facts verified against the current repo:
- Sprints live at `sprint-orchestrator/sprints/<slug>/`
- Existing `sprint-config.yaml` uses `sprint_id` (string) + `repositories` + `team` — no display metadata. Schema will be **extended** (additive) not rewritten.
- Prototypes live at `sprint-orchestrator/sprints/<slug>/prototypes/app/<proto-id>/`, entry file is `prototype.html` (not `index.html`)
- Each prototype already has a `screenshots/` subfolder with PNGs (e.g. `default.png`, `empty.png`) — **we reuse these, no Puppeteer needed** for v1
- An existing `.github/workflows/deploy-prototypes.yml` deploys `sprint-orchestrator/` directly to Pages — this plan **replaces** it
- Existing Pages URL will switch from a raw directory listing to the Astro-built gallery

## File Structure

```
sprint-gallery/
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── env.d.ts
│   ├── lib/
│   │   ├── collect-sprints.ts            # filesystem scanner (tested)
│   │   ├── collect-sprints.test.ts
│   │   ├── types.ts                      # Sprint, Prototype types
│   │   └── paths.ts                      # path constants
│   ├── styles/
│   │   └── tokens.css                    # design tokens + theme variables
│   ├── components/
│   │   ├── Layout.astro                  # html shell + theme script
│   │   ├── TopBar.astro
│   │   ├── Timeline.astro                # left rail
│   │   ├── SprintEntry.astro             # main-column entry
│   │   ├── PrototypeCard.astro
│   │   ├── PreviewModal.tsx              # React island
│   │   ├── SearchPalette.tsx             # React island (⌘K)
│   │   └── ThemeToggle.tsx               # React island
│   └── pages/
│       ├── index.astro                   # timeline home
│       └── sprints/[slug].astro          # per-sprint detail
├── scripts/
│   └── copy-prototypes.ts                # mirrors prototype dirs into public/
├── public/
│   └── (prototypes/ populated at build time)
└── tests/
    └── fixtures/
        └── sprints/                      # tiny fixture repo for collector tests
            └── demo-sprint/
                ├── sprint-config.yaml
                ├── PRD.md
                └── prototypes/app/demo-001/prototype.html
```

Changes outside `sprint-gallery/`:
- `sprint-orchestrator/sprints/free-tab-diversification/sprint-config.yaml` — add `display:` block
- `sprint-orchestrator/templates/sprint-config-template.yaml` — add `display:` block template
- `.github/workflows/deploy-prototypes.yml` — **replace** with `gallery.yml` (rename + rewrite)
- `README.md` — add one section linking to the gallery URL

---

## Task 1: Scaffold Astro project

**Files:**
- Create: `sprint-gallery/package.json`
- Create: `sprint-gallery/astro.config.mjs`
- Create: `sprint-gallery/tsconfig.json`
- Create: `sprint-gallery/src/env.d.ts`
- Create: `sprint-gallery/.gitignore`

- [ ] **Step 1: Create `sprint-gallery/package.json`**

```json
{
  "name": "sprint-gallery",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "pnpm run copy:prototypes && astro build",
    "preview": "astro preview",
    "copy:prototypes": "tsx scripts/copy-prototypes.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "astro": "^4.16.0",
    "@astrojs/react": "^3.6.0",
    "@astrojs/mdx": "^3.1.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "yaml": "^2.5.0",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "tsx": "^4.19.0",
    "typescript": "^5.5.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `sprint-gallery/astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://zach-wrtn.github.io',
  base: '/zzem-orchestrator',
  integrations: [react(), mdx()],
  output: 'static',
  build: { format: 'directory' }
});
```

- [ ] **Step 3: Create `sprint-gallery/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*", "scripts/**/*", "tests/**/*", "*.config.*"]
}
```

- [ ] **Step 4: Create `sprint-gallery/src/env.d.ts`**

```ts
/// <reference types="astro/client" />
```

- [ ] **Step 5: Create `sprint-gallery/.gitignore`**

```
node_modules
dist
.astro
public/prototypes
```

- [ ] **Step 6: Install and verify**

```bash
cd sprint-gallery && pnpm install && pnpm exec astro --version
```
Expected: prints Astro version, no errors.

- [ ] **Step 7: Commit**

```bash
git add sprint-gallery/package.json sprint-gallery/astro.config.mjs sprint-gallery/tsconfig.json sprint-gallery/src/env.d.ts sprint-gallery/.gitignore
git commit -m "feat(gallery): scaffold Astro project"
```

---

## Task 2: Extend `sprint-config.yaml` schema (display block)

**Files:**
- Modify: `sprint-orchestrator/templates/sprint-config-template.yaml`
- Modify: `sprint-orchestrator/sprints/free-tab-diversification/sprint-config.yaml`

The schema is **additive**: existing fields (`sprint_id`, `repositories`, `team`) remain untouched. A new optional `display:` block supplies gallery metadata. When missing, the collector falls back to folder name + git log.

- [ ] **Step 1: Read the existing template**

Run: `cat sprint-orchestrator/templates/sprint-config-template.yaml`
Expected: shows current structure. Note its indentation style.

- [ ] **Step 2: Append `display:` block to the template**

Append to `sprint-orchestrator/templates/sprint-config-template.yaml` (follow the file's existing indent style):

```yaml

# Gallery display metadata (optional — consumed by sprint-gallery)
display:
  title: "Human-readable sprint title"
  startDate: "YYYY-MM-DD"
  endDate: "YYYY-MM-DD"
  status: "in-progress"  # in-progress | completed | archived
  tags: []
  summary: ""            # optional 1–2 line override; if empty, PRD.md first paragraph is used
  prototypes:
    # Optional per-prototype overrides. Entries match folder names under prototypes/app/.
    # Example:
    # - id: "app-001"
    #   title: "Main flow"
    #   hero: true
    #   thumbnail: "screenshots/default.png"  # path relative to prototype folder
```

- [ ] **Step 3: Add `display:` block to the real sprint**

Append to `sprint-orchestrator/sprints/free-tab-diversification/sprint-config.yaml`:

```yaml

display:
  title: "Free Tab Diversification"
  startDate: "2026-04-09"
  endDate: "2026-04-14"
  status: "completed"
  tags: ["ugc", "free-tab"]
  prototypes:
    - id: "app-001"
      hero: true
      thumbnail: "screenshots/default.png"
```

- [ ] **Step 4: Validate YAML parses**

Run: `cd sprint-gallery && node -e "const fs=require('fs');const YAML=require('yaml');console.log(YAML.parse(fs.readFileSync('../sprint-orchestrator/sprints/free-tab-diversification/sprint-config.yaml','utf8')).display)"`
Expected: prints the display object.

- [ ] **Step 5: Commit**

```bash
git add sprint-orchestrator/templates/sprint-config-template.yaml sprint-orchestrator/sprints/free-tab-diversification/sprint-config.yaml
git commit -m "feat(sprint-config): add optional display block for gallery metadata"
```

---

## Task 3: Types + path constants

**Files:**
- Create: `sprint-gallery/src/lib/types.ts`
- Create: `sprint-gallery/src/lib/paths.ts`

- [ ] **Step 1: Create `sprint-gallery/src/lib/types.ts`**

```ts
export type SprintStatus = 'in-progress' | 'completed' | 'archived';

export interface Prototype {
  id: string;               // folder name under prototypes/app/
  title: string;            // display.prototypes[].title || <title> tag || humanized id
  entry: string;            // public-relative path to prototype.html
  thumbnail: string | null; // public-relative path to PNG, or null if none
  hero: boolean;            // exactly one per sprint
  screens: string[];        // additional screenshot PNGs (public-relative)
}

export interface Sprint {
  slug: string;             // folder name
  title: string;
  startDate: string;        // ISO date
  endDate: string;          // ISO date
  status: SprintStatus;
  summary: string;          // 1–2 line extract
  tags: string[];
  prototypes: Prototype[];
  docs: {
    prd?: string;           // absolute repo path (for MDX import)
    report?: string;
    retrospective?: string[];
  };
}
```

- [ ] **Step 2: Create `sprint-gallery/src/lib/paths.ts`**

```ts
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// sprint-gallery/src/lib -> repo root
export const REPO_ROOT = resolve(here, '../../..');
export const SPRINTS_DIR = resolve(REPO_ROOT, 'sprint-orchestrator/sprints');
export const PUBLIC_DIR = resolve(here, '../../public');
export const PUBLIC_PROTOTYPES_DIR = resolve(PUBLIC_DIR, 'prototypes');
```

- [ ] **Step 3: Commit**

```bash
git add sprint-gallery/src/lib/types.ts sprint-gallery/src/lib/paths.ts
git commit -m "feat(gallery): sprint/prototype types + path constants"
```

---

## Task 4: `collect-sprints.ts` — TDD

**Files:**
- Create: `sprint-gallery/tests/fixtures/sprints/demo-sprint/sprint-config.yaml`
- Create: `sprint-gallery/tests/fixtures/sprints/demo-sprint/PRD.md`
- Create: `sprint-gallery/tests/fixtures/sprints/demo-sprint/prototypes/app/demo-001/prototype.html`
- Create: `sprint-gallery/tests/fixtures/sprints/demo-sprint/prototypes/app/demo-001/screenshots/default.png`
- Create: `sprint-gallery/tests/fixtures/sprints/missing-display/sprint-config.yaml`
- Create: `sprint-gallery/tests/fixtures/sprints/missing-display/PRD.md`
- Create: `sprint-gallery/src/lib/collect-sprints.test.ts`
- Create: `sprint-gallery/src/lib/collect-sprints.ts`
- Create: `sprint-gallery/vitest.config.ts`

- [ ] **Step 1: Create Vitest config**

`sprint-gallery/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 2: Create fixture files**

`sprint-gallery/tests/fixtures/sprints/demo-sprint/sprint-config.yaml`:
```yaml
sprint_id: "demo-sprint"
display:
  title: "Demo Sprint"
  startDate: "2026-01-01"
  endDate: "2026-01-07"
  status: "completed"
  tags: ["demo"]
  prototypes:
    - id: "demo-001"
      hero: true
      thumbnail: "screenshots/default.png"
```

`sprint-gallery/tests/fixtures/sprints/demo-sprint/PRD.md`:
```markdown
# Demo PRD

This is the first paragraph of the PRD. It should become the summary.

Second paragraph is ignored.
```

`sprint-gallery/tests/fixtures/sprints/demo-sprint/prototypes/app/demo-001/prototype.html`:
```html
<!DOCTYPE html><html><head><title>Demo Prototype</title></head><body>hi</body></html>
```

Create the empty screenshot placeholder:
```bash
mkdir -p sprint-gallery/tests/fixtures/sprints/demo-sprint/prototypes/app/demo-001/screenshots
printf '\x89PNG\r\n\x1a\n' > sprint-gallery/tests/fixtures/sprints/demo-sprint/prototypes/app/demo-001/screenshots/default.png
```

`sprint-gallery/tests/fixtures/sprints/missing-display/sprint-config.yaml`:
```yaml
sprint_id: "missing-display"
```

`sprint-gallery/tests/fixtures/sprints/missing-display/PRD.md`:
```markdown
Fallback summary line.
```

- [ ] **Step 3: Write the failing tests**

`sprint-gallery/src/lib/collect-sprints.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectSprints } from './collect-sprints.js';

import { dirname } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(HERE, '../../tests/fixtures/sprints');

describe('collectSprints', () => {
  it('parses a sprint with full display metadata', async () => {
    const sprints = await collectSprints(FIXTURES);
    const demo = sprints.find((s) => s.slug === 'demo-sprint');
    expect(demo).toBeDefined();
    expect(demo!.title).toBe('Demo Sprint');
    expect(demo!.status).toBe('completed');
    expect(demo!.tags).toEqual(['demo']);
    expect(demo!.summary).toContain('first paragraph of the PRD');
    expect(demo!.prototypes).toHaveLength(1);
    expect(demo!.prototypes[0].id).toBe('demo-001');
    expect(demo!.prototypes[0].hero).toBe(true);
    expect(demo!.prototypes[0].title).toBe('Demo Prototype');
  });

  it('falls back when display block missing', async () => {
    const sprints = await collectSprints(FIXTURES);
    const fallback = sprints.find((s) => s.slug === 'missing-display');
    expect(fallback).toBeDefined();
    expect(fallback!.title).toBe('Missing Display');
    expect(fallback!.status).toBe('in-progress');
    expect(fallback!.summary).toContain('Fallback summary');
    expect(fallback!.prototypes).toEqual([]);
  });

  it('sorts sprints by endDate descending', async () => {
    const sprints = await collectSprints(FIXTURES);
    for (let i = 0; i < sprints.length - 1; i++) {
      expect(sprints[i].endDate >= sprints[i + 1].endDate).toBe(true);
    }
  });
});
```

- [ ] **Step 4: Run tests — expect FAIL**

```bash
cd sprint-gallery && pnpm test
```
Expected: test file fails because `collect-sprints.ts` does not exist.

- [ ] **Step 5: Implement `collect-sprints.ts`**

`sprint-gallery/src/lib/collect-sprints.ts`:
```ts
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import YAML from 'yaml';
import type { Sprint, Prototype, SprintStatus } from './types.js';

interface DisplayYaml {
  title?: string;
  startDate?: string;
  endDate?: string;
  status?: SprintStatus;
  tags?: string[];
  summary?: string;
  prototypes?: Array<{
    id: string;
    title?: string;
    hero?: boolean;
    thumbnail?: string;
  }>;
}

interface ConfigYaml {
  sprint_id?: string;
  display?: DisplayYaml;
}

function humanize(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function extractTitleFromHtml(html: string): string | null {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

function firstParagraph(md: string): string {
  const stripped = md.replace(/^#.*$/gm, '').trim();
  const para = stripped.split(/\n\s*\n/).find((p) => p.trim().length > 0) ?? '';
  return para.trim().slice(0, 280);
}

async function collectPrototypes(
  sprintDir: string,
  slug: string,
  display: DisplayYaml | undefined,
): Promise<Prototype[]> {
  const appDir = join(sprintDir, 'prototypes', 'app');
  if (!existsSync(appDir)) return [];
  const entries = await readdir(appDir, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

  const overrides = new Map(
    (display?.prototypes ?? []).map((p) => [p.id, p]),
  );
  const anyHero = (display?.prototypes ?? []).some((p) => p.hero);

  const result: Prototype[] = [];
  for (const id of folders) {
    const protoDir = join(appDir, id);
    const entryFile = join(protoDir, 'prototype.html');
    if (!existsSync(entryFile)) continue;
    const html = await readFile(entryFile, 'utf8');
    const override = overrides.get(id);

    // entryRel is relative to the sprint's own prototypes/ folder.
    // Public URL shape: prototypes/<slug>/<entryRel>
    const sprintPrototypesDir = join(sprintDir, 'prototypes');
    const entryRel = relative(sprintPrototypesDir, entryFile);

    const screenshotsDir = join(protoDir, 'screenshots');
    let screens: string[] = [];
    let thumbnail: string | null = null;
    if (existsSync(screenshotsDir)) {
      const files = (await readdir(screenshotsDir))
        .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
        .sort();
      screens = files.map((f) => `prototypes/${slug}/${relative(sprintPrototypesDir, join(screenshotsDir, f))}`);
      const preferredFile = (override?.thumbnail ?? 'screenshots/default.png').replace(/^screenshots\//, '');
      const chosen = files.includes(preferredFile) ? preferredFile : files[0];
      if (chosen) {
        thumbnail = `prototypes/${slug}/${relative(sprintPrototypesDir, join(screenshotsDir, chosen))}`;
      }
    }

    result.push({
      id,
      title: override?.title ?? extractTitleFromHtml(html) ?? humanize(id),
      entry: `prototypes/${slug}/${entryRel}`,
      thumbnail,
      hero: override?.hero ?? (!anyHero && result.length === 0),
      screens,
    });
  }
  return result;
}

export async function collectSprints(sprintsDir: string): Promise<Sprint[]> {
  if (!existsSync(sprintsDir)) return [];
  const entries = await readdir(sprintsDir, { withFileTypes: true });
  const sprintFolders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const sprints: Sprint[] = [];
  for (const slug of sprintFolders) {
    const dir = join(sprintsDir, slug);
    const configPath = join(dir, 'sprint-config.yaml');
    let config: ConfigYaml = {};
    if (existsSync(configPath)) {
      config = (YAML.parse(await readFile(configPath, 'utf8')) ?? {}) as ConfigYaml;
    }
    const display = config.display;

    const prdPath = join(dir, 'PRD.md');
    let summary = display?.summary ?? '';
    if (!summary && existsSync(prdPath)) {
      summary = firstParagraph(await readFile(prdPath, 'utf8'));
    }

    const statMtime = (await stat(dir)).mtime.toISOString().slice(0, 10);

    const prototypes = await collectPrototypes(dir, slug, display);

    const reportPath = join(dir, 'REPORT.md');
    const retroDir = join(dir, 'retrospective');
    const retros: string[] = [];
    if (existsSync(retroDir)) {
      const files = await readdir(retroDir);
      for (const f of files.sort()) if (f.endsWith('.md')) retros.push(join('retrospective', f));
    }

    sprints.push({
      slug,
      title: display?.title ?? humanize(slug),
      startDate: display?.startDate ?? statMtime,
      endDate: display?.endDate ?? statMtime,
      status: display?.status ?? 'in-progress',
      summary,
      tags: display?.tags ?? [],
      prototypes,
      docs: {
        prd: existsSync(prdPath) ? 'PRD.md' : undefined,
        report: existsSync(reportPath) ? 'REPORT.md' : undefined,
        retrospective: retros.length ? retros : undefined,
      },
    });
  }

  sprints.sort((a, b) => (a.endDate < b.endDate ? 1 : a.endDate > b.endDate ? -1 : 0));
  return sprints;
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd sprint-gallery && pnpm test
```
Expected: all 3 tests pass.

- [ ] **Step 7: Commit**

```bash
git add sprint-gallery/src/lib/collect-sprints.ts sprint-gallery/src/lib/collect-sprints.test.ts sprint-gallery/tests sprint-gallery/vitest.config.ts
git commit -m "feat(gallery): sprint collector with display-block + PRD-summary fallback"
```

---

## Task 5: `copy-prototypes.ts` — mirror prototype dirs into public/

**Files:**
- Create: `sprint-gallery/scripts/copy-prototypes.ts`

- [ ] **Step 1: Create the script**

`sprint-gallery/scripts/copy-prototypes.ts`:
```ts
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_PROTOTYPES_DIR, SPRINTS_DIR } from '../src/lib/paths.js';
import { readdir } from 'node:fs/promises';

async function main() {
  if (!existsSync(SPRINTS_DIR)) {
    console.error(`sprints directory not found: ${SPRINTS_DIR}`);
    process.exit(1);
  }
  if (existsSync(PUBLIC_PROTOTYPES_DIR)) {
    await rm(PUBLIC_PROTOTYPES_DIR, { recursive: true, force: true });
  }
  await mkdir(PUBLIC_PROTOTYPES_DIR, { recursive: true });

  const sprints = (await readdir(SPRINTS_DIR, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  let copied = 0;
  for (const slug of sprints) {
    const src = join(SPRINTS_DIR, slug, 'prototypes');
    if (!existsSync(src)) continue;
    const dest = join(PUBLIC_PROTOTYPES_DIR, slug);
    await cp(src, dest, { recursive: true });
    copied++;
  }
  console.log(`copied prototypes from ${copied} sprint(s) into public/prototypes/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Run the script**

```bash
cd sprint-gallery && pnpm run copy:prototypes
```
Expected: `copied prototypes from 1 sprint(s) into public/prototypes/`. Verify `sprint-gallery/public/prototypes/free-tab-diversification/app/app-001/prototype.html` exists.

- [ ] **Step 3: Commit**

```bash
git add sprint-gallery/scripts/copy-prototypes.ts
git commit -m "feat(gallery): copy-prototypes script mirrors sprint artifacts into public/"
```

Note: the generated `public/prototypes/` directory is in `.gitignore` already (Task 1). It is regenerated on every build.

---

## Task 6: Design tokens + Layout shell

**Files:**
- Create: `sprint-gallery/src/styles/tokens.css`
- Create: `sprint-gallery/src/components/Layout.astro`
- Create: `sprint-gallery/src/components/TopBar.astro`
- Create: `sprint-gallery/src/components/ThemeToggle.tsx`

- [ ] **Step 1: Create `sprint-gallery/src/styles/tokens.css`**

```css
:root {
  --accent: #5E6AD2;
  --accent-soft: #5E6AD233;
  --radius-card: 12px;
  --radius-thumb: 8px;
  --font-ui: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  --max-width: 1120px;
  --rail-width: 200px;
}

:root[data-theme="dark"], :root:not([data-theme]) {
  color-scheme: dark;
  --bg: #08090A;
  --surface: #111214;
  --surface-hover: #17181B;
  --border: #222326;
  --text: #E6E6E7;
  --text-dim: #9A9BA1;
  --text-faint: #6A6B72;
}

:root[data-theme="light"] {
  color-scheme: light;
  --bg: #FFFFFF;
  --surface: #F6F6F7;
  --surface-hover: #EDEEF0;
  --border: #E4E4E7;
  --text: #0B0B0C;
  --text-dim: #4A4B52;
  --text-faint: #8A8B92;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: var(--font-ui); }
a { color: inherit; text-decoration: none; }
```

- [ ] **Step 2: Create `ThemeToggle.tsx`**

```tsx
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initial = stored ?? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
      }}
    >
      {theme === 'dark' ? '◐ Light' : '◑ Dark'}
    </button>
  );
}
```

- [ ] **Step 3: Create `TopBar.astro`**

```astro
---
import ThemeToggle from './ThemeToggle.tsx';
---
<header class="topbar">
  <a href={import.meta.env.BASE_URL} class="brand">ZZEM Sprints</a>
  <div class="spacer"></div>
  <button id="open-search" class="search-btn" aria-label="Search">
    <span>Search</span>
    <kbd>⌘K</kbd>
  </button>
  <ThemeToggle client:load />
</header>

<style>
  .topbar {
    position: sticky; top: 0; z-index: 10;
    display: flex; align-items: center; gap: 12px;
    padding: 14px 24px;
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
  }
  .brand { font-weight: 600; letter-spacing: -0.01em; }
  .spacer { flex: 1; }
  .search-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--surface); color: var(--text-dim);
    border: 1px solid var(--border); border-radius: 8px;
    padding: 6px 10px; font-size: 12px; font-family: var(--font-mono);
    cursor: pointer;
  }
  .search-btn:hover { background: var(--surface-hover); }
  kbd {
    border: 1px solid var(--border); border-radius: 4px;
    padding: 0 4px; font-size: 11px; color: var(--text-faint);
  }
</style>
```

- [ ] **Step 4: Create `Layout.astro`**

```astro
---
import '../styles/tokens.css';
import TopBar from './TopBar.astro';
const { title = 'ZZEM Sprints' } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="preconnect" href="https://rsms.me" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    <script is:inline>
      (function () {
        var t = localStorage.getItem('theme');
        if (!t) t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        document.documentElement.dataset.theme = t;
      })();
    </script>
  </head>
  <body>
    <TopBar />
    <main><slot /></main>
    <style>
      main { max-width: var(--max-width); margin: 0 auto; padding: 32px 24px 120px; }
    </style>
  </body>
</html>
```

- [ ] **Step 5: Commit**

```bash
git add sprint-gallery/src/styles sprint-gallery/src/components/Layout.astro sprint-gallery/src/components/TopBar.astro sprint-gallery/src/components/ThemeToggle.tsx
git commit -m "feat(gallery): design tokens + layout shell + theme toggle"
```

---

## Task 7: Timeline + SprintEntry + PrototypeCard components + home page

**Files:**
- Create: `sprint-gallery/src/components/Timeline.astro`
- Create: `sprint-gallery/src/components/SprintEntry.astro`
- Create: `sprint-gallery/src/components/PrototypeCard.astro`
- Create: `sprint-gallery/src/pages/index.astro`

- [ ] **Step 1: Create `PrototypeCard.astro`**

```astro
---
import type { Prototype } from '@/lib/types';
interface Props { sprintSlug: string; proto: Prototype; }
const { sprintSlug, proto } = Astro.props;
const base = import.meta.env.BASE_URL;
const entryHref = `${base}/${proto.entry}`.replace(/\/+/g, '/');
const thumb = proto.thumbnail ? `${base}/${proto.thumbnail}`.replace(/\/+/g, '/') : null;
---
<article class="card" data-entry={entryHref} data-title={proto.title}>
  <div class="thumb-wrap">
    {thumb
      ? <img src={thumb} alt={proto.title} loading="lazy" />
      : <div class="placeholder">No preview</div>}
    <button class="open-preview" data-entry={entryHref} data-title={proto.title} aria-label={`Preview ${proto.title}`}>
      Preview
    </button>
  </div>
  <div class="meta">
    <div class="title">{proto.title}</div>
    <a class="new-tab" href={entryHref} target="_blank" rel="noopener">Open ↗</a>
  </div>
</article>

<style>
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-card); overflow: hidden;
    transition: transform 120ms ease, border-color 120ms ease;
  }
  .card:hover { border-color: var(--accent); transform: translateY(-2px); }
  .thumb-wrap { position: relative; aspect-ratio: 16/10; background: var(--surface-hover); }
  .thumb-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .placeholder {
    width: 100%; height: 100%; display: grid; place-items: center;
    color: var(--text-faint); font-family: var(--font-mono); font-size: 12px;
  }
  .open-preview {
    position: absolute; inset: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0); border: none; color: transparent;
    cursor: pointer; transition: background 120ms ease;
  }
  .card:hover .open-preview { background: rgba(0,0,0,0.35); color: white; font-weight: 500; }
  .meta { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; }
  .title { font-size: 13px; font-weight: 500; }
  .new-tab { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); }
  .new-tab:hover { color: var(--accent); }
</style>
```

- [ ] **Step 2: Create `SprintEntry.astro`**

```astro
---
import type { Sprint } from '@/lib/types';
import PrototypeCard from './PrototypeCard.astro';
interface Props { sprint: Sprint; }
const { sprint } = Astro.props;
const hero = sprint.prototypes.find((p) => p.hero) ?? sprint.prototypes[0];
const base = import.meta.env.BASE_URL;
const heroThumb = hero?.thumbnail ? `${base}/${hero.thumbnail}`.replace(/\/+/g, '/') : null;
const detailHref = `${base}/sprints/${sprint.slug}/`.replace(/\/+/g, '/');
---
<section class="entry" id={sprint.slug}>
  <header>
    <h2><a href={detailHref}>{sprint.title}</a></h2>
    <div class="meta">
      <time>{sprint.startDate} → {sprint.endDate}</time>
      <span class={`status status-${sprint.status}`}>{sprint.status}</span>
    </div>
  </header>

  {hero && (
    <a class="hero" href={detailHref} aria-label={`${sprint.title} hero`}>
      {heroThumb
        ? <img src={heroThumb} alt={hero.title} loading="lazy" />
        : <div class="placeholder">No preview</div>}
    </a>
  )}

  {sprint.summary && <p class="summary">{sprint.summary}</p>}

  {sprint.tags.length > 0 && (
    <div class="tags">
      {sprint.tags.map((t) => <span class="tag">#{t}</span>)}
    </div>
  )}

  {sprint.prototypes.length > 1 && (
    <div class="grid">
      {sprint.prototypes.filter((p) => p !== hero).map((p) => (
        <PrototypeCard sprintSlug={sprint.slug} proto={p} />
      ))}
    </div>
  )}

  <nav class="docs">
    {sprint.docs.prd && <a href={detailHref}>PRD</a>}
    {sprint.docs.report && <a href={detailHref}>Report</a>}
    {sprint.docs.retrospective && <a href={detailHref}>Retrospective</a>}
  </nav>
</section>

<style>
  .entry { padding: 48px 0; border-bottom: 1px solid var(--border); }
  .entry:last-child { border-bottom: none; }
  header h2 { margin: 0 0 6px; font-size: 28px; letter-spacing: -0.02em; }
  header h2 a:hover { color: var(--accent); }
  .meta { display: flex; gap: 12px; font-family: var(--font-mono); font-size: 12px; color: var(--text-dim); }
  .status {
    padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border);
    text-transform: lowercase;
  }
  .status-completed { color: #7AC79A; border-color: #7AC79A44; }
  .status-in-progress { color: var(--accent); border-color: var(--accent-soft); }
  .status-archived { color: var(--text-faint); }
  .hero {
    display: block; margin: 20px 0;
    aspect-ratio: 16/10; background: var(--surface-hover);
    border: 1px solid var(--border); border-radius: var(--radius-card); overflow: hidden;
  }
  .hero img { width: 100%; height: 100%; object-fit: cover; }
  .hero:hover { border-color: var(--accent); }
  .placeholder { width: 100%; height: 100%; display: grid; place-items: center; color: var(--text-faint); font-family: var(--font-mono); }
  .summary { color: var(--text-dim); line-height: 1.6; max-width: 70ch; }
  .tags { display: flex; gap: 8px; margin: 12px 0; }
  .tag { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); background: var(--surface); border: 1px solid var(--border); padding: 2px 8px; border-radius: 4px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin: 20px 0; }
  .docs { display: flex; gap: 16px; margin-top: 20px; font-family: var(--font-mono); font-size: 12px; }
  .docs a { color: var(--text-dim); }
  .docs a:hover { color: var(--accent); }
</style>
```

- [ ] **Step 3: Create `Timeline.astro`**

```astro
---
import type { Sprint } from '@/lib/types';
interface Props { sprints: Sprint[]; }
const { sprints } = Astro.props;
const byYear = new Map<string, Sprint[]>();
for (const s of sprints) {
  const y = s.endDate.slice(0, 4);
  if (!byYear.has(y)) byYear.set(y, []);
  byYear.get(y)!.push(s);
}
---
<aside class="rail">
  {[...byYear.entries()].map(([year, list]) => (
    <div class="year-block">
      <div class="year">{year}</div>
      <ul>
        {list.map((s) => (
          <li>
            <a href={`#${s.slug}`}>
              <span class="dot" data-status={s.status}></span>
              <span class="date">{s.endDate.slice(5)}</span>
              <span class="name">{s.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  ))}
</aside>

<style>
  .rail {
    position: sticky; top: 72px; align-self: start;
    width: var(--rail-width);
    padding-right: 16px; border-right: 1px solid var(--border);
    font-family: var(--font-mono); font-size: 12px;
    max-height: calc(100vh - 80px); overflow-y: auto;
  }
  .year-block { margin-bottom: 24px; }
  .year { color: var(--text-faint); margin-bottom: 8px; }
  ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
  li a { display: flex; align-items: center; gap: 8px; color: var(--text-dim); }
  li a:hover { color: var(--text); }
  .dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--text-faint); flex-shrink: 0;
  }
  .dot[data-status="completed"] { background: #7AC79A; }
  .dot[data-status="in-progress"] { background: var(--accent); }
  .date { color: var(--text-faint); font-size: 11px; width: 44px; }
  .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
```

- [ ] **Step 4: Create `pages/index.astro`**

```astro
---
import Layout from '@/components/Layout.astro';
import Timeline from '@/components/Timeline.astro';
import SprintEntry from '@/components/SprintEntry.astro';
import PreviewModal from '@/components/PreviewModal.tsx';
import SearchPalette from '@/components/SearchPalette.tsx';
import { collectSprints } from '@/lib/collect-sprints';
import { SPRINTS_DIR } from '@/lib/paths';
const sprints = await collectSprints(SPRINTS_DIR);
const searchData = sprints.map((s) => ({
  slug: s.slug,
  title: s.title,
  tags: s.tags,
  prototypes: s.prototypes.map((p) => p.title),
}));
---
<Layout title="ZZEM Sprints">
  <div class="layout">
    <Timeline sprints={sprints} />
    <div class="stream">
      {sprints.map((s) => <SprintEntry sprint={s} />)}
      {sprints.length === 0 && <p class="empty">No sprints yet.</p>}
    </div>
  </div>
  <PreviewModal client:load />
  <SearchPalette client:load data={searchData} />
</Layout>

<style>
  .layout { display: grid; grid-template-columns: var(--rail-width) 1fr; gap: 48px; }
  .stream { min-width: 0; }
  .empty { color: var(--text-dim); }
  @media (max-width: 720px) {
    .layout { grid-template-columns: 1fr; }
    .layout > :global(.rail) { display: none; }
  }
</style>
```

- [ ] **Step 5: Commit**

```bash
git add sprint-gallery/src/components/Timeline.astro sprint-gallery/src/components/SprintEntry.astro sprint-gallery/src/components/PrototypeCard.astro sprint-gallery/src/pages/index.astro
git commit -m "feat(gallery): timeline + sprint entry + prototype card + home page"
```

---

## Task 8: PreviewModal island

**Files:**
- Create: `sprint-gallery/src/components/PreviewModal.tsx`

- [ ] **Step 1: Create `PreviewModal.tsx`**

```tsx
import { useEffect, useState } from 'react';

interface PreviewState { entry: string; title: string; }

export default function PreviewModal() {
  const [state, setState] = useState<PreviewState | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const btn = t.closest<HTMLElement>('.open-preview');
      if (!btn) return;
      e.preventDefault();
      const entry = btn.dataset.entry!;
      const title = btn.dataset.title ?? '';
      setState({ entry, title });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setState(null);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!state) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={state.title}
         style={{
           position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
           display: 'grid', placeItems: 'center', zIndex: 50, padding: 24,
         }}
         onClick={(e) => { if (e.target === e.currentTarget) setState(null); }}>
      <div style={{
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', width: 'min(1200px, 96vw)', height: '88vh',
        display: 'flex', flexDirection: 'column',
      }}>
        <header style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-mono)', fontSize: 12,
        }}>
          <span style={{ color: 'var(--text-dim)' }}>{state.title}</span>
          <span style={{ flex: 1 }} />
          <a href={state.entry} target="_blank" rel="noopener"
             style={{ color: 'var(--text-dim)' }}>Open ↗</a>
          <button onClick={() => setState(null)}
                  style={{
                    background: 'transparent', color: 'var(--text)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    padding: '4px 8px', cursor: 'pointer',
                  }}>Close</button>
        </header>
        <iframe src={state.entry} title={state.title} sandbox="allow-scripts allow-same-origin"
                style={{ flex: 1, border: 'none', background: 'white' }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sprint-gallery/src/components/PreviewModal.tsx
git commit -m "feat(gallery): preview modal island with iframe + ESC close"
```

---

## Task 9: SearchPalette island (⌘K)

**Files:**
- Create: `sprint-gallery/src/components/SearchPalette.tsx`

- [ ] **Step 1: Create `SearchPalette.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';

interface SearchItem { slug: string; title: string; tags: string[]; prototypes: string[]; }
interface Props { data: SearchItem[]; }

export default function SearchPalette({ data }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('#open-search')) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data.slice(0, 12);
    return data
      .filter((s) =>
        s.title.toLowerCase().includes(needle) ||
        s.tags.some((t) => t.toLowerCase().includes(needle)) ||
        s.prototypes.some((p) => p.toLowerCase().includes(needle)),
      )
      .slice(0, 12);
  }, [q, data]);

  if (!open) return null;
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
         style={{
           position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
           display: 'grid', placeItems: 'start center', paddingTop: '12vh', zIndex: 60,
         }}>
      <div style={{
        width: 'min(640px, 92vw)',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', overflow: 'hidden',
      }}>
        <input autoFocus placeholder="Search sprints, tags, prototypes…"
               value={q} onChange={(e) => setQ(e.target.value)}
               style={{
                 width: '100%', padding: '14px 16px',
                 background: 'transparent', border: 'none',
                 borderBottom: '1px solid var(--border)',
                 color: 'var(--text)', fontSize: 14, outline: 'none',
               }} />
        <ul style={{ listStyle: 'none', margin: 0, padding: 6, maxHeight: '60vh', overflowY: 'auto' }}>
          {hits.length === 0 && (
            <li style={{ padding: 12, color: 'var(--text-faint)', fontSize: 13 }}>No matches</li>
          )}
          {hits.map((s) => (
            <li key={s.slug}>
              <a href={`#${s.slug}`} onClick={() => setOpen(false)}
                 style={{
                   display: 'flex', justifyContent: 'space-between',
                   padding: '10px 12px', borderRadius: 8,
                   color: 'var(--text)',
                 }}
                 onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                 onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <span>{s.title}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', fontSize: 12 }}>
                  {s.tags.map((t) => `#${t}`).join(' ')}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sprint-gallery/src/components/SearchPalette.tsx
git commit -m "feat(gallery): ⌘K command palette"
```

---

## Task 10: Sprint detail page `/sprints/[slug]`

**Files:**
- Create: `sprint-gallery/src/pages/sprints/[slug].astro`

- [ ] **Step 1: Create the detail page**

```astro
---
import Layout from '@/components/Layout.astro';
import PrototypeCard from '@/components/PrototypeCard.astro';
import PreviewModal from '@/components/PreviewModal.tsx';
import { collectSprints } from '@/lib/collect-sprints';
import { SPRINTS_DIR } from '@/lib/paths';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function getStaticPaths() {
  const sprints = await collectSprints(SPRINTS_DIR);
  return sprints.map((sprint) => ({ params: { slug: sprint.slug }, props: { sprint } }));
}

const { sprint } = Astro.props;
const base = import.meta.env.BASE_URL;
const sprintDir = join(SPRINTS_DIR, sprint.slug);

async function readOptional(rel?: string): Promise<string | null> {
  if (!rel) return null;
  try { return await readFile(join(sprintDir, rel), 'utf8'); } catch { return null; }
}

const prd = await readOptional(sprint.docs.prd);
const report = await readOptional(sprint.docs.report);
const hero = sprint.prototypes.find((p) => p.hero) ?? sprint.prototypes[0];
const heroThumb = hero?.thumbnail ? `${base}/${hero.thumbnail}`.replace(/\/+/g, '/') : null;
---
<Layout title={`${sprint.title} · ZZEM Sprints`}>
  <a href={base} class="back">← Timeline</a>
  <header class="hero-header">
    <h1>{sprint.title}</h1>
    <div class="meta">
      <time>{sprint.startDate} → {sprint.endDate}</time>
      <span class={`status status-${sprint.status}`}>{sprint.status}</span>
      {sprint.tags.map((t) => <span class="tag">#{t}</span>)}
    </div>
  </header>

  {hero && (
    <div class="hero-media">
      {heroThumb
        ? <img src={heroThumb} alt={hero.title} />
        : <div class="placeholder">No preview</div>}
    </div>
  )}

  {sprint.prototypes.length > 0 && (
    <section>
      <h2>Prototypes</h2>
      <div class="grid">
        {sprint.prototypes.map((p) => <PrototypeCard sprintSlug={sprint.slug} proto={p} />)}
      </div>
    </section>
  )}

  {prd && (
    <section>
      <h2>PRD</h2>
      <pre class="doc">{prd}</pre>
    </section>
  )}

  {report && (
    <section>
      <h2>Report</h2>
      <pre class="doc">{report}</pre>
    </section>
  )}

  <PreviewModal client:load />
</Layout>

<style>
  .back { font-family: var(--font-mono); font-size: 12px; color: var(--text-dim); }
  .back:hover { color: var(--accent); }
  .hero-header { margin: 32px 0 16px; }
  .hero-header h1 { margin: 0 0 8px; font-size: 40px; letter-spacing: -0.02em; }
  .meta { display: flex; flex-wrap: wrap; gap: 10px; font-family: var(--font-mono); font-size: 12px; color: var(--text-dim); }
  .status { padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border); }
  .status-completed { color: #7AC79A; border-color: #7AC79A44; }
  .status-in-progress { color: var(--accent); border-color: var(--accent-soft); }
  .tag { color: var(--text-dim); }
  .hero-media {
    margin: 16px 0 32px; aspect-ratio: 16/10;
    background: var(--surface-hover); border: 1px solid var(--border);
    border-radius: var(--radius-card); overflow: hidden;
  }
  .hero-media img { width: 100%; height: 100%; object-fit: cover; }
  .placeholder { width: 100%; height: 100%; display: grid; place-items: center; color: var(--text-faint); font-family: var(--font-mono); }
  section { margin: 40px 0; }
  h2 { font-size: 18px; letter-spacing: -0.01em; margin: 0 0 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
  .doc {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-card); padding: 16px;
    font-family: var(--font-mono); font-size: 12px; line-height: 1.6;
    color: var(--text-dim); white-space: pre-wrap; overflow-x: auto;
  }
</style>
```

Note: v1 renders PRD/Report as pre-wrapped text for zero-dependency reliability. Upgrading to MDX rendering is a future task once v1 is live.

- [ ] **Step 2: Run local build end-to-end**

```bash
cd sprint-gallery && pnpm run build
```
Expected: `dist/` generated, no errors. Contains `index.html` and `sprints/free-tab-diversification/index.html`.

- [ ] **Step 3: Smoke-test locally**

```bash
cd sprint-gallery && pnpm run preview
```
Open the printed URL. Verify:
- Home page renders with free-tab-diversification entry
- Hero thumbnail loads (screenshots/default.png)
- Clicking a prototype card opens the modal with the iframe
- ESC closes modal
- ⌘K opens search, typing "free" finds the sprint
- Theme toggle flips dark/light
- Clicking sprint title navigates to `/sprints/free-tab-diversification/`

Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add sprint-gallery/src/pages/sprints
git commit -m "feat(gallery): per-sprint detail page"
```

---

## Task 11: Replace `deploy-prototypes.yml` with gallery workflow

**Files:**
- Delete: `.github/workflows/deploy-prototypes.yml`
- Create: `.github/workflows/gallery.yml`

- [ ] **Step 1: Remove the old workflow**

```bash
git rm .github/workflows/deploy-prototypes.yml
```

- [ ] **Step 2: Create `.github/workflows/gallery.yml`**

```yaml
name: Deploy Sprint Gallery

on:
  push:
    branches: [main]
    paths:
      - 'sprint-gallery/**'
      - 'sprint-orchestrator/sprints/**'
      - '.github/workflows/gallery.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: sprint-gallery/pnpm-lock.yaml

      - name: Install
        working-directory: sprint-gallery
        run: pnpm install --frozen-lockfile

      - name: Test
        working-directory: sprint-gallery
        run: pnpm test

      - name: Build
        working-directory: sprint-gallery
        run: pnpm run build

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: sprint-gallery/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Generate the lockfile**

```bash
cd sprint-gallery && pnpm install
```
Expected: `pnpm-lock.yaml` appears in `sprint-gallery/`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/gallery.yml sprint-gallery/pnpm-lock.yaml
git commit -m "ci(gallery): replace deploy-prototypes workflow with Astro gallery deploy"
```

---

## Task 12: README update + final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read current README**

Run: `head -40 README.md` — find a natural section to add gallery link.

- [ ] **Step 2: Add a Sprint Gallery section**

Append (or insert after Overview) in `README.md`:

```markdown

## Sprint Gallery

Historical, browsable view of every sprint's prototypes:
**https://zach-wrtn.github.io/zzem-orchestrator/**

Source: `sprint-gallery/`. The gallery auto-rebuilds on every merge to `main`
when `sprint-orchestrator/sprints/**` or `sprint-gallery/**` changes.

To add a new sprint to the gallery, populate the optional `display:` block
in the sprint's `sprint-config.yaml` (see `sprint-orchestrator/templates/sprint-config-template.yaml`).
```

- [ ] **Step 3: Run all tests + final build**

```bash
cd sprint-gallery && pnpm test && pnpm run build
```
Expected: tests pass, build succeeds.

- [ ] **Step 4: Verify GitHub Pages source setting (manual, note for user)**

After merging, the user must confirm in GitHub repo Settings → Pages:
- Source: "GitHub Actions" (not "Deploy from branch")

Add a note at the top of `sprint-gallery/README.md` (create if absent):

```markdown
# sprint-gallery

Astro site that renders every sprint's prototypes as a Linear-changelog-style timeline.
Deployed to GitHub Pages via `.github/workflows/gallery.yml`.

## Local dev

```bash
pnpm install
pnpm run copy:prototypes
pnpm run dev
```

## First-time Pages setup

Repo Settings → Pages → Source: **GitHub Actions**.
```

- [ ] **Step 5: Commit**

```bash
git add README.md sprint-gallery/README.md
git commit -m "docs(gallery): link gallery site from README + local dev notes"
```

- [ ] **Step 6: Push branch and verify CI**

```bash
git push -u origin HEAD
```
Open the resulting PR. Verify the `Deploy Sprint Gallery` workflow runs green.

---

## Post-implementation notes

- **First deploy:** after the first successful Pages deploy, the previous `deploy-prototypes` URL content is overwritten by the gallery. Verify the landing page matches the Linear-changelog mockup.
- **Future work (not in this plan):** Puppeteer thumbnail capture for prototypes without screenshots, MDX rendering of PRD/Report, `?show=all` approval toggle, custom domain.
