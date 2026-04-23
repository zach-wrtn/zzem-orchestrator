# Sprint Gallery UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the sprint-gallery site into a seamless snap-stream with shared-element prototype previews, warm-toned Pretendard typography, and a four-curve motion system — all without adding runtime JS dependencies.

**Architecture:** Four sequential feature commits on branch `feat/gallery-ux-redesign`, landing in a single PR. Commits: (1) tokens + type, (2) snap stream + panel layout, (3) preview route + device shell, (4) view transitions + motion. Existing data pipeline (`collect-sprints.ts`, `copy-prototypes.ts`, `capture-screenshots.ts`) is untouched. New URL `/prototypes/<slug>/<id>/` is added as a first-class route so preview can be deep-linked.

**Tech Stack:** Astro 4 (static SSG), React (existing islands only — SearchPalette, ThemeToggle), Pretendard Variable (CDN), Playwright + axe-core (new devDep, E2E + a11y), Puppeteer + pixelmatch (visual regression, extends existing thumbnail capture), Vitest (existing, unchanged).

**Spec:** `docs/superpowers/specs/2026-04-23-gallery-ux-redesign-design.md`

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Replace | `sprint-gallery/src/styles/tokens.css` | New warm palette, type scale, radii |
| Create | `sprint-gallery/src/styles/transitions.css` | `::view-transition-*` rules + reduced-motion |
| Modify | `sprint-gallery/src/components/Layout.astro` | Inject `<ViewTransitions />`, Pretendard CDN |
| Modify | `sprint-gallery/src/components/TopBar.astro` | Token-only restyle |
| Modify | `sprint-gallery/src/components/Timeline.astro` | IntersectionObserver scrubber |
| Create | `sprint-gallery/src/components/SprintPanel.astro` | One snap panel per sprint (replaces SprintEntry) |
| Delete | `sprint-gallery/src/components/SprintEntry.astro` | Superseded |
| Modify | `sprint-gallery/src/components/PrototypeCard.astro` | `<a>` with `transition:name`, spring hover |
| Create | `sprint-gallery/src/components/PreviewShell.astro` | Device frame + iframe |
| Delete | `sprint-gallery/src/components/PreviewModal.tsx` | Replaced by route-based shell |
| Create | `sprint-gallery/src/components/MobileStoryStack.astro` | Horizontal story swipe on mobile |
| Modify | `sprint-gallery/src/pages/index.astro` | Snap-y stream of SprintPanel |
| Modify | `sprint-gallery/src/pages/sprints/[slug].astro` | Shared-element receiver |
| Create | `sprint-gallery/src/pages/prototypes/[sprint]/[proto].astro` | Fullscreen preview route |
| Create | `sprint-gallery/src/lib/motion.ts` | Spring curves + WAAPI helpers + reduced-motion |
| Create | `sprint-gallery/src/lib/motion.test.ts` | Unit tests for motion.ts |
| Create | `sprint-gallery/playwright.config.ts` | Playwright config |
| Create | `sprint-gallery/tests/e2e/home.spec.ts` | Home + snap + rail |
| Create | `sprint-gallery/tests/e2e/preview.spec.ts` | Card → preview → back |
| Create | `sprint-gallery/tests/e2e/a11y.spec.ts` | axe scan |
| Create | `sprint-gallery/tests/e2e/reduced-motion.spec.ts` | prefers-reduced-motion path |
| Modify | `sprint-gallery/package.json` | devDeps + scripts |
| Modify | `.github/workflows/gallery.yml` | Playwright install + test step |

---

## Prerequisites

Before starting any task, run from repo root:

```bash
git checkout main && git pull
git checkout -b feat/gallery-ux-redesign
```

All tasks assume working directory `sprint-gallery/` unless otherwise noted.

---

## Phase 1 — Scaffolding & Baseline

### Task 1: Install test tooling

**Files:**
- Modify: `sprint-gallery/package.json`

- [ ] **Step 1: Add devDependencies**

From `sprint-gallery/`:

```bash
pnpm add -D @playwright/test @axe-core/playwright pixelmatch pngjs
```

- [ ] **Step 2: Install Playwright browsers (Chromium only — matches existing puppeteer Chrome install)**

```bash
pnpm exec playwright install chromium
```

- [ ] **Step 3: Add npm scripts to `sprint-gallery/package.json`**

Replace the `scripts` block:

```json
"scripts": {
  "dev": "astro dev",
  "build": "pnpm run capture:screenshots && pnpm run copy:prototypes && astro build",
  "preview": "astro preview",
  "copy:prototypes": "tsx scripts/copy-prototypes.ts",
  "capture:screenshots": "tsx scripts/capture-screenshots.ts",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

- [ ] **Step 4: Verify install**

```bash
pnpm exec playwright --version
```

Expected: `Version 1.x.x` printed. No errors.

---

### Task 2: Playwright config & smoke test

**Files:**
- Create: `sprint-gallery/playwright.config.ts`
- Create: `sprint-gallery/tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Create `sprint-gallery/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321/zzem-orchestrator',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'], baseURL: 'http://localhost:4321/zzem-orchestrator' },
    },
  ],
  webServer: {
    command: 'pnpm run build && pnpm run preview',
    url: 'http://localhost:4321/zzem-orchestrator',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] **Step 2: Write failing smoke test `sprint-gallery/tests/e2e/smoke.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test('home loads and shows at least one sprint', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ZZEM Sprints/);
  const sprintHeadings = page.locator('h2, h1').filter({ hasText: /Sprint|UGC|Platform/ });
  await expect(sprintHeadings.first()).toBeVisible();
});
```

- [ ] **Step 3: Run smoke test (should PASS against existing gallery)**

```bash
pnpm run test:e2e -- smoke
```

Expected: `1 passed`. If it fails, the baseline is broken — fix before proceeding.

- [ ] **Step 4: Stage (no commit yet; combined with Task 3 into phase-1 commit)**

```bash
git add sprint-gallery/package.json sprint-gallery/pnpm-lock.yaml sprint-gallery/playwright.config.ts sprint-gallery/tests/e2e/smoke.spec.ts
```

---

### Task 3: Capture visual-regression baseline from current main

**Files:**
- Create: `sprint-gallery/scripts/visual-baseline.ts`
- Create: `sprint-gallery/tests/visual/baseline/` (directory)

- [ ] **Step 1: Create `sprint-gallery/scripts/visual-baseline.ts`**

```typescript
/**
 * Capture visual baseline PNGs of 4 key routes from the CURRENT built site.
 * Run once on main before starting the redesign. Every PR diffs against these.
 *
 * Usage: pnpm exec tsx scripts/visual-baseline.ts
 * Prereq: `pnpm run build && pnpm run preview` running in another shell
 *         (defaults to http://localhost:4321/zzem-orchestrator)
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer';

const BASE = process.env.BASELINE_URL ?? 'http://localhost:4321/zzem-orchestrator';
const OUT = 'tests/visual/baseline';

const ROUTES: Array<{ name: string; path: string; viewport: { width: number; height: number } }> = [
  { name: 'home-desktop', path: '/', viewport: { width: 1280, height: 800 } },
  { name: 'home-mobile', path: '/', viewport: { width: 390, height: 844 } },
  { name: 'detail-desktop', path: '/sprints/ugc-platform-002/', viewport: { width: 1280, height: 800 } },
  { name: 'detail-mobile', path: '/sprints/ugc-platform-002/', viewport: { width: 390, height: 844 } },
];

async function main() {
  if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  for (const r of ROUTES) {
    await page.setViewport({ ...r.viewport, deviceScaleFactor: 2 });
    await page.goto(BASE + r.path, { waitUntil: 'networkidle0' });
    await new Promise((res) => setTimeout(res, 400));
    const out = join(OUT, `${r.name}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`  ✓ ${r.name} → ${out}`);
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the baseline capture**

In one terminal (from `sprint-gallery/`):

```bash
pnpm run build && pnpm run preview
```

In another terminal (from `sprint-gallery/`):

```bash
pnpm exec tsx scripts/visual-baseline.ts
```

Expected output: 4 `✓` lines and 4 PNGs in `tests/visual/baseline/`.

- [ ] **Step 3: Stop preview, verify PNGs exist**

```bash
ls tests/visual/baseline/
```

Expected: `detail-desktop.png  detail-mobile.png  home-desktop.png  home-mobile.png`.

- [ ] **Step 4: Commit Phase 1 (scaffolding + baseline)**

```bash
git add sprint-gallery/package.json sprint-gallery/pnpm-lock.yaml \
        sprint-gallery/playwright.config.ts \
        sprint-gallery/tests/e2e/smoke.spec.ts \
        sprint-gallery/scripts/visual-baseline.ts \
        sprint-gallery/tests/visual/baseline/
git commit -m "chore(gallery): playwright + visual baseline scaffolding"
```

---

## Phase 2 — Commit 1: Tokens & Typography

### Task 4: Write failing token test

**Files:**
- Create: `sprint-gallery/tests/e2e/tokens.spec.ts`

- [ ] **Step 1: Write failing E2E test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('design tokens', () => {
  test('warm off-black bg and coral accent', async ({ page }) => {
    await page.goto('/');
    const root = page.locator(':root');
    const bg = await root.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--bg').trim(),
    );
    const accent = await root.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--accent').trim(),
    );
    expect(bg.toLowerCase()).toBe('#0f0d0c');
    expect(accent.toLowerCase()).toBe('#ff7a63');
  });

  test('body uses Pretendard in the font stack', async ({ page }) => {
    await page.goto('/');
    const fontFamily = await page.evaluate(() =>
      getComputedStyle(document.body).fontFamily,
    );
    expect(fontFamily).toMatch(/Pretendard/i);
  });

  test('body font size is 15px', async ({ page }) => {
    await page.goto('/');
    const fontSize = await page.evaluate(() =>
      getComputedStyle(document.body).fontSize,
    );
    expect(fontSize).toBe('15px');
  });
});
```

- [ ] **Step 2: Run and expect FAIL**

```bash
pnpm run test:e2e -- tokens
```

Expected: all 3 tests FAIL (current `--bg` is `#08090A`, `--accent` is `#5E6AD2`, no Pretendard, body inherits 16px). If any pass, investigate before continuing.

---

### Task 5: Replace tokens.css

**Files:**
- Replace: `sprint-gallery/src/styles/tokens.css`

- [ ] **Step 1: Write new `sprint-gallery/src/styles/tokens.css` (full file replacement)**

```css
:root {
  --accent: #FF7A63;
  --accent-soft: rgba(255, 122, 99, 0.14);
  --accent-grad: linear-gradient(135deg, #FF7A63, #4B2F88);

  --ok: #7AC79A;
  --warn: #E5A458;
  --danger: #E57373;

  --radius-chip: 8px;
  --radius-card: 12px;
  --radius-device: 22px;
  --radius-pill: 999px;

  --font-sans: 'Pretendard Variable', 'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, 'system-ui', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

  --fs-display: 48px;  --lh-display: 1.02; --ls-display: -0.035em;
  --fs-h1: 32px;       --lh-h1: 1.2;       --ls-h1: -0.022em;
  --fs-h2: 20px;       --lh-h2: 1.35;      --ls-h2: -0.012em;
  --fs-h3: 16px;       --lh-h3: 1.4;       --ls-h3: -0.008em;
  --fs-lead: 17px;     --lh-lead: 1.65;    --ls-lead: -0.004em;
  --fs-body: 15px;     --lh-body: 1.75;    --ls-body: -0.003em;
  --fs-small: 13px;    --lh-small: 1.6;
  --fs-label: 12px;    --lh-label: 1.4;    --ls-label: 0.08em;

  --max-width: 1120px;
  --rail-width: 220px;

  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --spring-soft: cubic-bezier(0.34, 1.35, 0.64, 1);
  --spring-handoff: cubic-bezier(0.22, 1.5, 0.36, 1);

  --dur-fast: 100ms;
  --dur-ui: 140ms;
  --dur-spring-soft: 220ms;
  --dur-spring-handoff: 320ms;
}

:root[data-theme="dark"], :root:not([data-theme]) {
  color-scheme: dark;
  --bg: #0F0D0C;
  --surface: #14110F;
  --surface-hover: #1B1512;
  --border: #2A231D;
  --text: #EDEDEF;
  --text-dim: #B4ADA5;
  --text-faint: #8B857E;
}

:root[data-theme="light"] {
  color-scheme: light;
  --bg: #FBF7F2;
  --surface: #F2EDE5;
  --surface-hover: #EAE3D8;
  --border: #E0D7C8;
  --text: #1A1613;
  --text-dim: #5A544C;
  --text-faint: #867F75;
}

* { box-sizing: border-box; }

html {
  text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  font-variant-numeric: tabular-nums;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  letter-spacing: var(--ls-body);
  word-break: keep-all;
  overflow-wrap: break-word;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4 {
  text-wrap: balance;
  letter-spacing: var(--ls-h1);
}

a { color: inherit; text-decoration: none; }

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}
```

- [ ] **Step 2: Inject Pretendard in `sprint-gallery/src/components/Layout.astro` head**

Locate the existing `<link rel="preconnect" href="https://rsms.me" />` line and replace the two Inter-related lines with Pretendard:

```astro
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css" />
```

Full updated `<head>` block:

```astro
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css" />
    <script is:inline>
      (function () {
        var t = localStorage.getItem('theme');
        if (!t) t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        document.documentElement.dataset.theme = t;
      })();
    </script>
  </head>
```

- [ ] **Step 3: Run token test and expect PASS**

```bash
pnpm run test:e2e -- tokens
```

Expected: `3 passed`.

- [ ] **Step 4: Verify existing smoke test still passes**

```bash
pnpm run test:e2e -- smoke
```

Expected: `1 passed`.

- [ ] **Step 5: Replace legacy `--font-ui` references (the variable was removed)**

Search and replace across `sprint-gallery/src/` — any `var(--font-ui)` becomes `var(--font-sans)`:

```bash
grep -rl 'var(--font-ui)' src/ && \
  find src -type f \( -name '*.astro' -o -name '*.tsx' -o -name '*.css' \) \
    -exec sed -i.bak 's/var(--font-ui)/var(--font-sans)/g' {} + && \
  find src -name '*.bak' -delete
```

- [ ] **Step 6: Verify build is green**

```bash
pnpm run build
```

Expected: `Complete!` with no errors and 6 pages rendered.

- [ ] **Step 7: Commit Phase 2**

```bash
git add sprint-gallery/src/styles/tokens.css sprint-gallery/src/components/Layout.astro sprint-gallery/src/ sprint-gallery/tests/e2e/tokens.spec.ts
git commit -m "chore(gallery): new tokens + type scale

- Warm off-black palette (#0F0D0C) with coral accent (#FF7A63)
- Pretendard Variable via jsdelivr dynamic-subset
- Type scale: body 15/1.75, display 48/1.02, mono labels 12
- Radii: 8/12/22/999
- Motion curves declared as tokens (consumed in Phase 4)
- Korean readability defaults: keep-all, balance, tabular-nums"
```

---

## Phase 3 — Commit 2: Snap Stream & Panel Layout

### Task 6: Create SprintPanel component

**Files:**
- Create: `sprint-gallery/src/components/SprintPanel.astro`

- [ ] **Step 1: Write `sprint-gallery/src/components/SprintPanel.astro`**

```astro
---
import type { Sprint } from '@/lib/types';
import PrototypeCard from './PrototypeCard.astro';
import { marked } from 'marked';

interface Props { sprint: Sprint; index: number; }
const { sprint, index } = Astro.props;

const base = import.meta.env.BASE_URL;
const hero = sprint.prototypes.find((p) => p.hero) ?? sprint.prototypes[0];
const heroThumb = hero?.thumbnail ? `${base}/${hero.thumbnail}`.replace(/\/+/g, '/') : null;
const detailHref = `${base}/sprints/${sprint.slug}/`.replace(/\/+/g, '/');
const heroHref = hero ? `${base}/prototypes/${sprint.slug}/${hero.id}/`.replace(/\/+/g, '/') : detailHref;
const summaryHtml = sprint.summary ? await marked.parseInline(sprint.summary) : null;

const SIDE_LIMIT = 5;
const sideProtos = sprint.prototypes.filter((p) => p !== hero).slice(0, SIDE_LIMIT);
const overflow = sprint.prototypes.length - 1 - sideProtos.length;
---
<section class="panel" id={sprint.slug} data-sprint-slug={sprint.slug} data-sprint-index={index}>
  <div class="left">
    <p class="label">{sprint.startDate} → {sprint.endDate} · {sprint.status}</p>
    <h2 class="title"><a href={detailHref}>{sprint.title}</a></h2>
    {summaryHtml && <p class="summary" set:html={summaryHtml} />}
    {sprint.tags.length > 0 && (
      <div class="tags">
        {sprint.tags.map((t) => <span class="tag">#{t}</span>)}
      </div>
    )}
    <div class="side-grid">
      {sideProtos.map((p) => <PrototypeCard sprintSlug={sprint.slug} proto={p} compact />)}
      {overflow > 0 && (
        <a class="more" href={detailHref}>+{overflow} more →</a>
      )}
    </div>
  </div>

  {hero && (
    <a class="hero" href={heroHref} aria-label={`Open ${hero.title}`}
       style={`view-transition-name: proto-${sprint.slug}-${hero.id};`}>
      {heroThumb
        ? <img src={heroThumb} alt={hero.title} loading="lazy" />
        : <div class="hero-placeholder"><span>{hero.title}</span></div>}
    </a>
  )}
</section>

<style>
  .panel {
    min-height: 100svh;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(320px, 1.2fr);
    gap: 48px;
    padding: 72px 0 48px;
    border-bottom: 1px solid var(--border);
  }
  .panel:last-of-type { border-bottom: none; }

  .left { min-width: 0; display: flex; flex-direction: column; gap: 16px; }
  .label {
    font-family: var(--font-mono);
    font-size: var(--fs-label); letter-spacing: var(--ls-label);
    color: var(--text-faint); text-transform: uppercase;
    margin: 0;
  }
  .title {
    font-size: var(--fs-h1); line-height: var(--lh-h1); letter-spacing: var(--ls-h1);
    font-weight: 600; margin: 0;
  }
  .title a { transition: color var(--dur-ui) var(--ease-out-quart); }
  .title a:hover { color: var(--accent); }

  .summary {
    font-size: var(--fs-lead); line-height: var(--lh-lead);
    color: var(--text-dim); margin: 0; max-width: 60ch;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }

  .tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag {
    font-family: var(--font-mono); font-size: 11px;
    color: var(--text-dim); background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius-chip);
    padding: 2px 8px;
  }

  .side-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px; margin-top: 8px;
  }
  .more {
    align-self: center; font-family: var(--font-mono); font-size: var(--fs-small);
    color: var(--text-dim); padding: 12px; border: 1px dashed var(--border);
    border-radius: var(--radius-card); text-align: center;
    transition: color var(--dur-ui) var(--ease-out-quart), border-color var(--dur-ui) var(--ease-out-quart);
  }
  .more:hover { color: var(--accent); border-color: var(--accent); }

  .hero {
    display: block; border-radius: var(--radius-card);
    overflow: hidden; background: var(--accent-grad);
    aspect-ratio: 4/5;
    box-shadow: 0 14px 32px rgba(255, 122, 99, 0.14);
    transition: transform var(--dur-spring-soft) var(--spring-soft),
                box-shadow var(--dur-spring-soft) var(--spring-soft);
  }
  .hero:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(255, 122, 99, 0.28); }
  .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hero-placeholder {
    width: 100%; height: 100%;
    display: grid; place-items: center;
    color: rgba(255,255,255,0.9); font-family: var(--font-sans); font-weight: 600;
    font-size: var(--fs-h2); padding: 24px; text-align: center; text-wrap: balance;
  }

  @media (max-width: 720px) {
    .panel { grid-template-columns: 1fr; gap: 20px; padding: 48px 0 32px; min-height: auto; }
    .hero { aspect-ratio: 3/4; order: -1; }
    .side-grid { display: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero { transition: none; }
    .hero:hover { transform: none; }
  }
</style>
```

- [ ] **Step 2: Verify Astro can resolve the new component**

```bash
pnpm run build
```

Expected: build succeeds (SprintPanel is not yet used anywhere, so no regression).

---

### Task 7: Rewrite home as snap stream

**Files:**
- Modify: `sprint-gallery/src/pages/index.astro`
- Delete: `sprint-gallery/src/components/SprintEntry.astro`

- [ ] **Step 1: Write failing home-snap test `sprint-gallery/tests/e2e/home.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('home snap stream', () => {
  test('vertical snap mandatory is set on main container', async ({ page }) => {
    await page.goto('/');
    const snapType = await page.evaluate(() => {
      const main = document.querySelector('.stream');
      return main ? getComputedStyle(main).scrollSnapType : null;
    });
    expect(snapType).toMatch(/y mandatory/);
  });

  test('each sprint has its own panel with snap-align start', async ({ page }) => {
    await page.goto('/');
    const panels = page.locator('.panel[data-sprint-slug]');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(4);
    const snapAlign = await panels.first().evaluate((el) => getComputedStyle(el).scrollSnapAlign);
    expect(snapAlign).toBe('start');
  });

  test('hero anchor carries a view-transition-name', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.panel .hero').first();
    const vtName = await hero.evaluate((el) => (el as HTMLElement).style.viewTransitionName);
    expect(vtName).toMatch(/^proto-/);
  });
});
```

- [ ] **Step 2: Run and expect FAIL**

```bash
pnpm run test:e2e -- home
```

Expected: all 3 tests FAIL — no `.panel` elements yet.

- [ ] **Step 3: Replace `sprint-gallery/src/pages/index.astro` (full file)**

```astro
---
import Layout from '@/components/Layout.astro';
import Timeline from '@/components/Timeline.astro';
import SprintPanel from '@/components/SprintPanel.astro';
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
      {sprints.map((s, i) => <SprintPanel sprint={s} index={i} />)}
      {sprints.length === 0 && <p class="empty">No sprints yet.</p>}
    </div>
  </div>
  <SearchPalette client:load data={searchData} />
</Layout>

<style>
  .layout { display: grid; grid-template-columns: var(--rail-width) 1fr; gap: 48px; }
  .stream {
    min-width: 0;
    scroll-snap-type: y mandatory;
    scroll-snap-stop: always;
    overflow-y: auto;
    max-height: calc(100vh - 64px);
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
  .empty { color: var(--text-dim); padding: 48px 0; }

  @media (max-width: 720px) {
    .layout { grid-template-columns: 1fr; }
    .layout > :global(.rail) { display: none; }
    .stream { max-height: calc(100svh - 56px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .stream { scroll-behavior: auto; }
  }
</style>
```

- [ ] **Step 4: Delete `sprint-gallery/src/components/SprintEntry.astro`**

```bash
rm src/components/SprintEntry.astro
```

- [ ] **Step 5: Run home test and expect PASS**

```bash
pnpm run test:e2e -- home
```

Expected: `3 passed`.

- [ ] **Step 6: Sanity check with browser**

```bash
pnpm run dev
```

Open `http://localhost:4321/zzem-orchestrator/` and confirm:
- Vertical snap works (mouse wheel snaps to next panel)
- Hero card looks correct with thumbnail
- Side grid shows ≤5 prototypes + "+N more" if applicable

Stop dev server (Ctrl-C) when done.

---

### Task 8: Convert Timeline to IntersectionObserver scrubber

**Files:**
- Modify: `sprint-gallery/src/components/Timeline.astro`

- [ ] **Step 1: Write failing test (append to `sprint-gallery/tests/e2e/home.spec.ts`)**

Add this test inside the existing `test.describe('home snap stream', …)` block:

```typescript
  test('rail marks the current panel as active when scrolled', async ({ page }) => {
    await page.goto('/');
    const panels = page.locator('.panel[data-sprint-slug]');
    const secondSlug = await panels.nth(1).getAttribute('data-sprint-slug');
    const stream = page.locator('.stream');
    await stream.evaluate((el) => { el.scrollTop = el.clientHeight; });
    await page.waitForTimeout(400);
    const activeNode = page.locator('.rail [data-sprint-target].active');
    const activeSlug = await activeNode.getAttribute('data-sprint-target');
    expect(activeSlug).toBe(secondSlug);
  });
```

- [ ] **Step 2: Run and expect FAIL**

```bash
pnpm run test:e2e -- home
```

Expected: the new test fails (rail nodes have no `data-sprint-target` attribute and no `.active` class).

- [ ] **Step 3: Rewrite `sprint-gallery/src/components/Timeline.astro`**

```astro
---
import type { Sprint } from '@/lib/types';
interface Props { sprints: Sprint[]; }
const { sprints } = Astro.props;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatMonthDay(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
}

const byYear = new Map<string, Sprint[]>();
for (const s of sprints) {
  const y = s.endDate.slice(0, 4);
  if (!byYear.has(y)) byYear.set(y, []);
  byYear.get(y)!.push(s);
}
---
<aside class="rail" role="tablist" aria-label="Sprint timeline">
  {[...byYear.entries()].map(([year, list]) => (
    <div class="year-block">
      <div class="year">{year}</div>
      <ul>
        {list.map((s) => (
          <li>
            <a href={`#${s.slug}`}
               role="tab"
               data-sprint-target={s.slug}
               aria-label={`Jump to ${s.title}`}>
              <span class="dot" data-status={s.status}></span>
              <span class="labels">
                <span class="name">{s.title}</span>
                <span class="date">{formatMonthDay(s.endDate)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  ))}
</aside>

<script>
  // Sync rail with snap stream via IntersectionObserver.
  const rail = document.querySelector('.rail') as HTMLElement | null;
  if (rail) {
    const setActive = (slug: string) => {
      rail.querySelectorAll<HTMLElement>('[data-sprint-target]').forEach((a) => {
        a.classList.toggle('active', a.dataset.sprintTarget === slug);
        a.setAttribute('aria-selected', a.dataset.sprintTarget === slug ? 'true' : 'false');
      });
    };

    const stream = document.querySelector('.stream');
    const panels = document.querySelectorAll<HTMLElement>('.panel[data-sprint-slug]');
    if (stream && panels.length > 0) {
      const io = new IntersectionObserver(
        (entries) => {
          const best = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (best) {
            const slug = (best.target as HTMLElement).dataset.sprintSlug;
            if (slug) setActive(slug);
          }
        },
        { root: stream, threshold: [0.25, 0.55, 0.85] },
      );
      panels.forEach((p) => io.observe(p));
      // seed
      setActive((panels[0] as HTMLElement).dataset.sprintSlug!);
    }

    rail.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-sprint-target]');
      if (!a) return;
      e.preventDefault();
      const slug = a.dataset.sprintTarget!;
      const panel = document.querySelector<HTMLElement>(`.panel[data-sprint-slug="${slug}"]`);
      panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
</script>

<style>
  .rail {
    position: sticky; top: 72px; align-self: start;
    width: var(--rail-width);
    padding-right: 16px; border-right: 1px solid var(--border);
    font-family: var(--font-sans); font-size: var(--fs-small);
    max-height: calc(100vh - 80px); overflow-y: auto;
  }
  .year-block { margin-bottom: 28px; }
  .year {
    font-family: var(--font-mono); color: var(--text-faint);
    font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
    margin-bottom: 10px;
  }
  ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
  li a {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 6px 8px; margin-left: -8px;
    border-radius: 6px;
    color: var(--text-dim);
    transition: background var(--dur-ui) var(--ease-out-quart),
                color var(--dur-ui) var(--ease-out-quart);
  }
  li a:hover { background: var(--surface); color: var(--text); }
  li a.active {
    color: var(--text); background: var(--accent-soft);
  }
  li a.active .dot { background: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
  .dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--text-faint); flex-shrink: 0;
    margin-top: 7px;
    transition: background var(--dur-ui) var(--ease-out-quart),
                box-shadow var(--dur-ui) var(--ease-out-quart);
  }
  .dot[data-status="completed"] { background: var(--ok); }
  .dot[data-status="in-progress"] { background: var(--accent); }
  .labels { display: flex; flex-direction: column; min-width: 0; flex: 1; }
  .name {
    font-size: var(--fs-small); line-height: 1.3;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    max-width: 22ch;
  }
  .date {
    font-family: var(--font-mono);
    font-size: 10.5px; color: var(--text-faint);
    margin-top: 2px; letter-spacing: 0.02em;
  }
</style>
```

- [ ] **Step 4: Run test and expect PASS**

```bash
pnpm run test:e2e -- home
```

Expected: `4 passed` (3 existing + 1 new).

---

### Task 9: Refresh PrototypeCard for compact mode + card-wide link

**Files:**
- Modify: `sprint-gallery/src/components/PrototypeCard.astro`

- [ ] **Step 1: Replace file contents (full file)**

Note: `transition:name` wire-up happens in Phase 5. Here we move from "button opens modal" to "anchor navigates to preview route" and add the `compact` prop used by side grids.

```astro
---
import type { Prototype } from '@/lib/types';
interface Props { sprintSlug: string; proto: Prototype; compact?: boolean; }
const { sprintSlug, proto, compact = false } = Astro.props;

const base = import.meta.env.BASE_URL;
const previewHref = `${base}/prototypes/${sprintSlug}/${proto.id}/`.replace(/\/+/g, '/');
const thumb = proto.thumbnail ? `${base}/${proto.thumbnail}`.replace(/\/+/g, '/') : null;
const vtName = `proto-${sprintSlug}-${proto.id}`;
---
<a
  class:list={['card', { compact }]}
  href={previewHref}
  aria-label={`Open ${proto.title}`}
  style={`view-transition-name: ${vtName};`}
>
  <div class="thumb-wrap">
    {thumb
      ? <img src={thumb} alt={proto.title} loading="lazy" />
      : <div class="placeholder">{proto.title}</div>}
  </div>
  {!compact && (
    <div class="meta">
      <span class="title">{proto.title}</span>
    </div>
  )}
</a>

<style>
  .card {
    display: block; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius-card);
    overflow: hidden;
    transition: transform var(--dur-spring-soft) var(--spring-soft),
                border-color var(--dur-spring-soft) var(--spring-soft),
                box-shadow var(--dur-spring-soft) var(--spring-soft);
  }
  .card:hover {
    transform: translateY(-4px);
    border-color: var(--accent);
    box-shadow: 0 14px 32px rgba(255, 122, 99, 0.18);
  }
  .thumb-wrap { aspect-ratio: 4/5; background: var(--accent-grad); }
  .thumb-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .placeholder {
    width: 100%; height: 100%; display: grid; place-items: center;
    color: rgba(255,255,255,0.9); padding: 12px; text-align: center;
    font-size: var(--fs-small); font-weight: 500; text-wrap: balance;
  }
  .meta { padding: 10px 12px; }
  .title { font-size: var(--fs-small); font-weight: 500; color: var(--text); }

  .card.compact { aspect-ratio: 4/5; }
  .card.compact .thumb-wrap { aspect-ratio: auto; height: 100%; }

  @media (prefers-reduced-motion: reduce) {
    .card { transition: border-color var(--dur-fast) linear; }
    .card:hover { transform: none; box-shadow: none; }
  }
</style>
```

- [ ] **Step 2: Verify build (PreviewModal still exists and still loads — cleanup happens in Phase 4)**

```bash
pnpm run build
```

Expected: build completes. The old PreviewModal is still bundled but no longer wired from any card — we'll remove it in Phase 4.

---

### Task 10: Add MobileStoryStack

**Files:**
- Create: `sprint-gallery/src/components/MobileStoryStack.astro`
- Modify: `sprint-gallery/src/components/SprintPanel.astro`

- [ ] **Step 1: Create `sprint-gallery/src/components/MobileStoryStack.astro`**

```astro
---
import type { Prototype } from '@/lib/types';
interface Props { sprintSlug: string; prototypes: Prototype[]; }
const { sprintSlug, prototypes } = Astro.props;

const base = import.meta.env.BASE_URL;
---
<div class="stack" data-sprint-slug={sprintSlug}>
  <div class="bar" aria-hidden="true">
    {prototypes.map((_, i) => <span class="seg" data-index={i}></span>)}
  </div>
  <div class="track">
    {prototypes.map((p, i) => {
      const href = `${base}/prototypes/${sprintSlug}/${p.id}/`.replace(/\/+/g, '/');
      const thumb = p.thumbnail ? `${base}/${p.thumbnail}`.replace(/\/+/g, '/') : null;
      return (
        <a class="slide" href={href} data-index={i}
           style={`view-transition-name: proto-${sprintSlug}-${p.id};`}
           aria-label={`Open ${p.title}`}>
          {thumb
            ? <img src={thumb} alt={p.title} loading="lazy" />
            : <div class="placeholder">{p.title}</div>}
        </a>
      );
    })}
  </div>
</div>

<script>
  document.querySelectorAll<HTMLElement>('.stack').forEach((stack) => {
    const track = stack.querySelector<HTMLElement>('.track')!;
    const segs = stack.querySelectorAll<HTMLElement>('.seg');
    const slides = stack.querySelectorAll<HTMLElement>('.slide');
    if (!track || slides.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.index);
            segs.forEach((s, i) => s.classList.toggle('on', i <= idx));
          }
        });
      },
      { root: track, threshold: 0.6 },
    );
    slides.forEach((s) => io.observe(s));
    segs[0]?.classList.add('on');
  });
</script>

<style>
  .stack { display: none; }
  @media (max-width: 720px) {
    .stack { display: block; width: 100%; }
  }
  .bar {
    display: flex; gap: 3px; padding: 4px 4px 10px;
  }
  .bar .seg {
    flex: 1; height: 3px; background: rgba(255,255,255,0.18); border-radius: 2px;
    transition: background var(--dur-ui) var(--ease-out-quart);
  }
  .bar .seg.on { background: var(--accent); }
  .track {
    display: flex; gap: 10px; overflow-x: auto;
    scroll-snap-type: x mandatory; scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .track::-webkit-scrollbar { display: none; }
  .slide {
    flex: 0 0 82%; aspect-ratio: 9/16;
    scroll-snap-align: center;
    border-radius: var(--radius-card);
    overflow: hidden; background: var(--accent-grad);
    display: block;
  }
  .slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .placeholder {
    width: 100%; height: 100%; display: grid; place-items: center;
    color: rgba(255,255,255,0.9); font-weight: 600; padding: 16px;
    text-align: center; text-wrap: balance;
  }
</style>
```

- [ ] **Step 2: Wire MobileStoryStack into `SprintPanel.astro`**

Edit `sprint-gallery/src/components/SprintPanel.astro` — add import and conditional render.

At the top of the frontmatter (add after the existing PrototypeCard import):

```astro
import MobileStoryStack from './MobileStoryStack.astro';
```

In the template, replace the existing `<div class="side-grid">…</div>` block with:

```astro
      <div class="side-grid">
        {sideProtos.map((p) => <PrototypeCard sprintSlug={sprint.slug} proto={p} compact />)}
        {overflow > 0 && (
          <a class="more" href={detailHref}>+{overflow} more →</a>
        )}
      </div>
      <MobileStoryStack sprintSlug={sprint.slug} prototypes={sprint.prototypes} />
```

The `.side-grid` is already hidden at `max-width: 720px` (set in Task 6), so the MobileStoryStack occupies that space on mobile.

- [ ] **Step 3: Write mobile test `sprint-gallery/tests/e2e/mobile.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('mobile story stack', () => {
  test('horizontal snap track is visible', async ({ page }) => {
    await page.goto('/');
    const stack = page.locator('.stack').first();
    await expect(stack).toBeVisible();
    const overflowX = await stack.locator('.track').evaluate(
      (el) => getComputedStyle(el).scrollSnapType,
    );
    expect(overflowX).toMatch(/x mandatory/);
  });

  test('side grid is hidden on mobile', async ({ page }) => {
    await page.goto('/');
    const grid = page.locator('.side-grid').first();
    await expect(grid).toBeHidden();
  });
});
```

- [ ] **Step 4: Run test and expect PASS**

```bash
pnpm run test:e2e -- mobile
```

Expected: `2 passed` (mobile project only — 2 tests × 2 projects is fine).

- [ ] **Step 5: Commit Phase 3**

```bash
git add sprint-gallery/src/components/SprintPanel.astro \
        sprint-gallery/src/components/MobileStoryStack.astro \
        sprint-gallery/src/components/PrototypeCard.astro \
        sprint-gallery/src/components/Timeline.astro \
        sprint-gallery/src/pages/index.astro \
        sprint-gallery/tests/e2e/home.spec.ts \
        sprint-gallery/tests/e2e/mobile.spec.ts
git rm sprint-gallery/src/components/SprintEntry.astro
git commit -m "feat(gallery): snap stream + panel layout

- SprintPanel replaces SprintEntry; hero on right, meta+side grid on left
- index.astro becomes a vertical snap stream (scroll-snap-type: y mandatory)
- Timeline rail becomes a scrubber via IntersectionObserver; aria tablist
- PrototypeCard is now an <a> with view-transition-name (wired in phase 4)
- MobileStoryStack adds horizontal story swipe under 720px
- Side grid hidden on mobile"
```

---

## Phase 4 — Commit 3: Preview Route & Device Shell

### Task 11: Create PreviewShell component

**Files:**
- Create: `sprint-gallery/src/components/PreviewShell.astro`

- [ ] **Step 1: Write `sprint-gallery/src/components/PreviewShell.astro`**

```astro
---
import type { Prototype } from '@/lib/types';
interface Props { sprintSlug: string; proto: Prototype; }
const { sprintSlug, proto } = Astro.props;
const base = import.meta.env.BASE_URL;
const iframeSrc = `${base}/${proto.entry}`.replace(/\/+/g, '/');
const homeHref = `${base}/`.replace(/\/+/g, '/');
const detailHref = `${base}/sprints/${sprintSlug}/`.replace(/\/+/g, '/');
const vtName = `proto-${sprintSlug}-${proto.id}`;
---
<div class="backdrop"></div>
<main class="shell" role="dialog" aria-modal="true" aria-label={`${proto.title} preview`}>
  <header class="bar">
    <a class="back" href={detailHref} aria-label="Back to sprint detail">← {sprintSlug}</a>
    <span class="title">{proto.title}</span>
    <a class="close" href={homeHref} aria-label="Close preview" data-close>ESC</a>
  </header>
  <div class="device" style={`view-transition-name: ${vtName};`}>
    <iframe
      src={iframeSrc}
      title={`${proto.title} prototype`}
      loading="eager"
      referrerpolicy="no-referrer"
    ></iframe>
  </div>
  <footer class="hint">ESC · 뒤로가기 · 배경 탭 모두 같은 복귀 동작</footer>
</main>

<script>
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') history.back();
  };
  document.addEventListener('keydown', onKey);

  const backdrop = document.querySelector('.backdrop');
  backdrop?.addEventListener('click', () => history.back());

  const close = document.querySelector<HTMLAnchorElement>('[data-close]');
  close?.addEventListener('click', (e) => {
    e.preventDefault();
    history.back();
  });

  const iframe = document.querySelector<HTMLIFrameElement>('.device iframe');
  iframe?.addEventListener('error', () => {
    const device = document.querySelector('.device');
    if (!device) return;
    device.innerHTML = `
      <div class="iframe-fallback">
        <p>프로토타입을 불러오지 못했습니다.</p>
        <a href="${iframe.src}" target="_blank" rel="noopener">새 탭에서 열기 ↗</a>
      </div>`;
  });
</script>

<style>
  .backdrop {
    position: fixed; inset: 0;
    background: var(--accent-grad);
    opacity: 0.18;
    z-index: 0;
    cursor: pointer;
  }
  .shell {
    position: relative; z-index: 1;
    display: grid; grid-template-rows: auto 1fr auto;
    min-height: 100svh; padding: 16px 16px 24px;
    backdrop-filter: blur(14px) saturate(1.1);
    background: color-mix(in srgb, var(--bg) 78%, transparent);
  }
  .bar {
    display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
    padding: 8px 4px 14px;
    font-family: var(--font-mono); font-size: var(--fs-label);
    color: var(--text-dim);
  }
  .bar .back { justify-self: start; }
  .bar .title {
    justify-self: center; color: var(--text);
    font-family: var(--font-sans); font-size: var(--fs-small);
    font-weight: 500;
  }
  .bar .close {
    justify-self: end;
    padding: 4px 10px; border: 1px solid var(--border);
    border-radius: var(--radius-chip);
    transition: background var(--dur-ui) var(--ease-out-quart),
                border-color var(--dur-ui) var(--ease-out-quart);
  }
  .bar a:hover { color: var(--text); border-color: var(--accent); }

  .device {
    justify-self: center; align-self: center;
    width: min(430px, 92vw);
    aspect-ratio: 9 / 19.5;
    border-radius: var(--radius-device);
    border: 2px solid var(--border);
    background: var(--bg);
    box-shadow: 0 40px 80px rgba(0,0,0,0.55), 0 0 0 8px rgba(255,255,255,0.02);
    overflow: hidden;
  }
  .device iframe {
    width: 100%; height: 100%; border: 0; display: block;
    background: var(--accent-grad);
  }
  .iframe-fallback {
    width: 100%; height: 100%;
    display: grid; place-items: center; gap: 12px;
    padding: 24px; text-align: center; color: var(--text-dim);
  }
  .iframe-fallback a { color: var(--accent); text-decoration: underline; }

  .hint {
    text-align: center; font-family: var(--font-mono); font-size: var(--fs-label);
    color: var(--text-faint); padding-top: 14px;
  }

  @media (max-width: 720px) {
    .device { width: 100vw; max-width: none; border-radius: 0; border: none; }
    .shell { padding: 12px 0 16px; }
    .bar { padding: 8px 14px 14px; }
  }
</style>
```

---

### Task 12: Add preview route

**Files:**
- Create: `sprint-gallery/src/pages/prototypes/[sprint]/[proto].astro`

- [ ] **Step 1: Write failing preview test `sprint-gallery/tests/e2e/preview.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('preview route', () => {
  test('direct navigation renders iframe for existing prototype', async ({ page }) => {
    await page.goto('/prototypes/ugc-platform-002/app-001/');
    const iframe = page.locator('.device iframe');
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute('src');
    expect(src).toMatch(/prototypes\/ugc-platform-002\/app\/app-001\/prototype\.html$/);
  });

  test('ESC key navigates back', async ({ page }) => {
    await page.goto('/');
    await page.goto('/prototypes/ugc-platform-002/app-001/');
    await page.keyboard.press('Escape');
    await page.waitForURL(/\/$|zzem-orchestrator\/?$/);
    expect(page.url()).toMatch(/zzem-orchestrator\/?$/);
  });

  test('clicking a home hero navigates to preview URL', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.panel .hero').first();
    const href = await hero.getAttribute('href');
    await hero.click();
    await page.waitForURL(href!);
    await expect(page.locator('.device iframe')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run and expect FAIL (route does not exist)**

```bash
pnpm run test:e2e -- preview
```

Expected: all 3 tests FAIL — 404s on `/prototypes/...`.

- [ ] **Step 3: Create `sprint-gallery/src/pages/prototypes/[sprint]/[proto].astro`**

```astro
---
import Layout from '@/components/Layout.astro';
import PreviewShell from '@/components/PreviewShell.astro';
import { collectSprints } from '@/lib/collect-sprints';
import { SPRINTS_DIR } from '@/lib/paths';

export async function getStaticPaths() {
  const sprints = await collectSprints(SPRINTS_DIR);
  const paths: Array<{ params: { sprint: string; proto: string }; props: any }> = [];
  for (const s of sprints) {
    for (const p of s.prototypes) {
      paths.push({
        params: { sprint: s.slug, proto: p.id },
        props: { sprintSlug: s.slug, proto: p, sprintTitle: s.title },
      });
    }
  }
  return paths;
}

const { sprintSlug, proto, sprintTitle } = Astro.props as {
  sprintSlug: string;
  proto: import('@/lib/types').Prototype;
  sprintTitle: string;
};
---
<Layout title={`${proto.title} · ${sprintTitle} · ZZEM Sprints`}>
  <PreviewShell sprintSlug={sprintSlug} proto={proto} />
</Layout>
```

- [ ] **Step 4: Run test and expect PASS**

```bash
pnpm run test:e2e -- preview
```

Expected: `3 passed`.

---

### Task 13: Wire [slug].astro to shared-element receiver

**Files:**
- Modify: `sprint-gallery/src/pages/sprints/[slug].astro`

- [ ] **Step 1: Replace `sprint-gallery/src/pages/sprints/[slug].astro` (full file)**

```astro
---
import Layout from '@/components/Layout.astro';
import PrototypeCard from '@/components/PrototypeCard.astro';
import { collectSprints } from '@/lib/collect-sprints';
import { SPRINTS_DIR } from '@/lib/paths';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

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

const prdRaw = await readOptional(sprint.docs.prd);
const reportRaw = await readOptional(sprint.docs.report);
const prdHtml = prdRaw ? await marked.parse(prdRaw) : null;
const reportHtml = reportRaw ? await marked.parse(reportRaw) : null;
const hero = sprint.prototypes.find((p) => p.hero) ?? sprint.prototypes[0];
const heroThumb = hero?.thumbnail ? `${base}/${hero.thumbnail}`.replace(/\/+/g, '/') : null;
const heroHref = hero ? `${base}/prototypes/${sprint.slug}/${hero.id}/`.replace(/\/+/g, '/') : base;
const heroVt = hero ? `proto-${sprint.slug}-${hero.id}` : undefined;
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
    <a class="hero-media" href={heroHref} aria-label={`Open ${hero.title}`}
       style={heroVt ? `view-transition-name: ${heroVt};` : undefined}>
      {heroThumb
        ? <img src={heroThumb} alt={hero.title} />
        : <div class="placeholder">{hero.title}</div>}
    </a>
  )}

  {sprint.prototypes.length > 0 && (
    <section>
      <h2>Prototypes</h2>
      <div class="grid">
        {sprint.prototypes.map((p) => <PrototypeCard sprintSlug={sprint.slug} proto={p} />)}
      </div>
    </section>
  )}

  {prdHtml && (
    <section>
      <h2>PRD</h2>
      <article class="doc prose" set:html={prdHtml} />
    </section>
  )}

  {reportHtml && (
    <section>
      <h2>Report</h2>
      <article class="doc prose" set:html={reportHtml} />
    </section>
  )}
</Layout>

<style>
  .back { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-dim); }
  .back:hover { color: var(--accent); }
  .hero-header { margin: 32px 0 16px; }
  .hero-header h1 { margin: 0 0 8px; font-size: var(--fs-display); line-height: var(--lh-display); letter-spacing: var(--ls-display); }
  .meta { display: flex; flex-wrap: wrap; gap: 10px; font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-dim); }
  .status { padding: 2px 8px; border-radius: var(--radius-chip); border: 1px solid var(--border); }
  .status-completed { color: var(--ok); border-color: color-mix(in srgb, var(--ok) 40%, transparent); }
  .status-in-progress { color: var(--accent); border-color: var(--accent-soft); }
  .tag { color: var(--text-dim); }

  .hero-media {
    display: block;
    margin: 16px 0 32px; aspect-ratio: 16/10;
    background: var(--accent-grad); border: 1px solid var(--border);
    border-radius: var(--radius-card); overflow: hidden;
  }
  .hero-media img { width: 100%; height: 100%; object-fit: cover; }
  .hero-media .placeholder {
    width: 100%; height: 100%; display: grid; place-items: center;
    color: rgba(255,255,255,0.9); font-weight: 600; font-size: var(--fs-h2);
    padding: 24px; text-align: center; text-wrap: balance;
  }

  section { margin: 40px 0; }
  h2 { font-size: var(--fs-h2); line-height: var(--lh-h2); letter-spacing: var(--ls-h2); margin: 0 0 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }

  .doc {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-card);
    padding: 24px 28px;
    color: var(--text);
    font-size: var(--fs-body); line-height: var(--lh-body);
  }
  .prose :global(h1) { font-size: var(--fs-h1); letter-spacing: var(--ls-h1); margin-top: 0; }
  .prose :global(h2) { font-size: var(--fs-h2); letter-spacing: var(--ls-h2); margin: 1.6em 0 0.6em; }
  .prose :global(h3) { font-size: var(--fs-h3); margin: 1.4em 0 0.5em; }
  .prose :global(p) { margin: 0.8em 0; color: var(--text-dim); }
  .prose :global(ul), .prose :global(ol) { margin: 0.6em 0; padding-left: 1.4em; color: var(--text-dim); }
  .prose :global(li) { margin: 0.25em 0; }
  .prose :global(strong) { color: var(--text); }
  .prose :global(a) { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
  .prose :global(code) {
    font-family: var(--font-mono); font-size: 0.88em;
    background: var(--surface-hover); border: 1px solid var(--border);
    padding: 1px 5px; border-radius: 4px; color: var(--text);
  }
  .prose :global(pre) {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 8px; padding: 14px 16px;
    overflow-x: auto; font-size: 12px; line-height: 1.5;
    margin: 1em 0;
  }
  .prose :global(pre code) { background: transparent; border: none; padding: 0; font-size: inherit; }
  .prose :global(blockquote) {
    margin: 1em 0; padding: 0.4em 1em;
    border-left: 3px solid var(--accent);
    background: color-mix(in srgb, var(--accent) 6%, transparent);
    color: var(--text-dim); border-radius: 0 6px 6px 0;
  }
</style>
```

- [ ] **Step 2: Delete `sprint-gallery/src/components/PreviewModal.tsx`**

```bash
rm src/components/PreviewModal.tsx
```

- [ ] **Step 3: Remove `PreviewModal` usage from any remaining page (should already be none, verify)**

```bash
grep -rn PreviewModal src/ && echo FAIL || echo OK
```

Expected: `OK` (no matches).

- [ ] **Step 4: Run full test suite**

```bash
pnpm run test && pnpm run test:e2e
```

Expected: all tests PASS.

- [ ] **Step 5: Commit Phase 4**

```bash
git add sprint-gallery/src/components/PreviewShell.astro \
        sprint-gallery/src/pages/prototypes/ \
        sprint-gallery/src/pages/sprints/[slug].astro \
        sprint-gallery/tests/e2e/preview.spec.ts
git rm sprint-gallery/src/components/PreviewModal.tsx
git commit -m "feat(gallery): preview shell route

- New route /prototypes/[sprint]/[proto]/ prerendered via getStaticPaths
- PreviewShell renders a device frame + iframe with ESC/back/backdrop dismiss
- iframe load failure → 'Open in new tab' fallback
- Sprint detail hero now links to preview URL with view-transition-name
- PreviewModal.tsx removed (replaced by the route-based shell)"
```

---

## Phase 5 — Commit 4: View Transitions & Motion

### Task 14: Motion helpers (TDD with vitest)

**Files:**
- Create: `sprint-gallery/src/lib/motion.ts`
- Create: `sprint-gallery/src/lib/motion.test.ts`

- [ ] **Step 1: Write failing unit tests `sprint-gallery/src/lib/motion.test.ts`**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DUR, EASE, prefersReducedMotion, pickDuration, pickEase } from './motion';

describe('motion tokens', () => {
  it('declares the four canonical durations in ms', () => {
    expect(DUR.fast).toBe(100);
    expect(DUR.ui).toBe(140);
    expect(DUR.springSoft).toBe(220);
    expect(DUR.springHandoff).toBe(320);
  });

  it('declares the four canonical easing curves', () => {
    expect(EASE.easeOutQuart).toMatch(/^cubic-bezier\(/);
    expect(EASE.springSoft).toMatch(/^cubic-bezier\(/);
    expect(EASE.springHandoff).toMatch(/^cubic-bezier\(/);
    expect(EASE.linearFast).toBe('linear');
  });
});

describe('prefersReducedMotion', () => {
  beforeEach(() => {
    (globalThis as any).matchMedia = vi.fn((q: string) => ({
      matches: q.includes('reduce'),
      media: q, addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      onchange: null, dispatchEvent: () => false,
    }));
  });

  it('returns true when media query matches reduce', () => {
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe('pickDuration / pickEase', () => {
  it('returns original when reduced-motion is false', () => {
    (globalThis as any).matchMedia = vi.fn(() => ({ matches: false }));
    expect(pickDuration('springHandoff')).toBe(320);
    expect(pickEase('springHandoff')).toMatch(/cubic-bezier/);
  });

  it('collapses to fast/linear under reduced-motion', () => {
    (globalThis as any).matchMedia = vi.fn(() => ({ matches: true }));
    expect(pickDuration('springHandoff')).toBe(100);
    expect(pickEase('springHandoff')).toBe('linear');
  });
});
```

- [ ] **Step 2: Run test and expect FAIL**

```bash
pnpm test motion
```

Expected: `FAIL` — `motion.ts` does not exist.

- [ ] **Step 3: Create `sprint-gallery/src/lib/motion.ts`**

```typescript
/**
 * Motion primitives — durations and easings kept in lockstep with tokens.css.
 * All values are safe to use both in CSS (via var(--...)) and in JS animations.
 */

export const DUR = {
  fast: 100,
  ui: 140,
  springSoft: 220,
  springHandoff: 320,
} as const;

export const EASE = {
  easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  springSoft: 'cubic-bezier(0.34, 1.35, 0.64, 1)',
  springHandoff: 'cubic-bezier(0.22, 1.5, 0.36, 1)',
  linearFast: 'linear',
} as const;

export type DurKey = keyof typeof DUR;
export type EaseKey = keyof typeof EASE;

export function prefersReducedMotion(): boolean {
  if (typeof matchMedia === 'undefined') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function pickDuration(key: DurKey): number {
  return prefersReducedMotion() ? DUR.fast : DUR[key];
}

export function pickEase(key: EaseKey): string {
  return prefersReducedMotion() ? EASE.linearFast : EASE[key];
}

/**
 * Thin wrapper over Element.animate that respects reduced-motion.
 * Falls back to no-op if the element is missing.
 */
export function animate(
  el: Element | null,
  keyframes: Keyframe[],
  opts: { duration: DurKey; ease: EaseKey; fill?: FillMode },
): Animation | null {
  if (!el) return null;
  return (el as HTMLElement).animate(keyframes, {
    duration: pickDuration(opts.duration),
    easing: pickEase(opts.ease),
    fill: opts.fill ?? 'none',
  });
}
```

- [ ] **Step 4: Run test and expect PASS**

```bash
pnpm test motion
```

Expected: `3 files passed` (or similar). All assertions green.

---

### Task 15: transitions.css + ViewTransitions injection

**Files:**
- Create: `sprint-gallery/src/styles/transitions.css`
- Modify: `sprint-gallery/src/components/Layout.astro`

- [ ] **Step 1: Create `sprint-gallery/src/styles/transitions.css`**

```css
/* View Transitions defaults for the whole site. */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 140ms;
  animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
}

/* Any element with view-transition-name starting with proto- gets the spring handoff. */
::view-transition-old(*),
::view-transition-new(*) {
  animation-duration: 320ms;
  animation-timing-function: cubic-bezier(0.22, 1.5, 0.36, 1);
}

/* Sprint hero shared-element — softer. */
::view-transition-old(sprint-hero),
::view-transition-new(sprint-hero) {
  animation-duration: 220ms;
  animation-timing-function: cubic-bezier(0.34, 1.35, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 100ms !important;
    animation-timing-function: linear !important;
  }
}
```

- [ ] **Step 2: Update `sprint-gallery/src/components/Layout.astro`**

Replace the file contents with:

```astro
---
import '../styles/tokens.css';
import '../styles/transitions.css';
import { ViewTransitions } from 'astro:transitions';
import TopBar from './TopBar.astro';
const { title = 'ZZEM Sprints' } = Astro.props;
---
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css" />
    <ViewTransitions />
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

    <div id="route-announcer" aria-live="polite" aria-atomic="true"
         style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;"></div>

    <script>
      // aria-live announcer on route changes.
      document.addEventListener('astro:after-swap', () => {
        const region = document.getElementById('route-announcer');
        if (!region) return;
        const t = document.title;
        region.textContent = '';
        setTimeout(() => { region.textContent = t; }, 20);
      });
    </script>

    <style>
      main { max-width: var(--max-width); margin: 0 auto; padding: 32px 24px 120px; }
    </style>
  </body>
</html>
```

- [ ] **Step 3: Add shared-element transition name to the home→detail hero path**

Edit `sprint-gallery/src/components/SprintPanel.astro`: add a second `view-transition-name` on the hero anchor as a fallback for the home→detail hop. (The preview-route hop already uses `proto-<slug>-<id>` set in Task 6.)

In the `.hero` anchor, update the inline `style`:

```astro
       style={`view-transition-name: proto-${sprint.slug}-${hero.id};`}
```

This is already present — no change needed. Verify by opening the file and confirming the style attribute exists.

- [ ] **Step 4: Run full suite**

```bash
pnpm run test && pnpm run test:e2e
```

Expected: all tests PASS.

---

### Task 16: Reduced-motion E2E test

**Files:**
- Create: `sprint-gallery/tests/e2e/reduced-motion.spec.ts`

- [ ] **Step 1: Write test**

```typescript
import { test, expect } from '@playwright/test';

test.use({
  colorScheme: 'dark',
  reducedMotion: 'reduce',
});

test.describe('prefers-reduced-motion', () => {
  test('home → preview → back still works', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.panel .hero').first();
    const href = await hero.getAttribute('href');
    await hero.click();
    await page.waitForURL(href!);
    await expect(page.locator('.device iframe')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForURL(/zzem-orchestrator\/?$/);
  });

  test('card hover transform is suppressed', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.panel .hero').first();
    await card.hover();
    await page.waitForTimeout(200);
    const transform = await card.evaluate((el) => getComputedStyle(el).transform);
    expect(transform === 'none' || transform === '').toBe(true);
  });
});
```

- [ ] **Step 2: Run and expect PASS (CSS rules already include the reduced-motion guard)**

```bash
pnpm run test:e2e -- reduced-motion
```

Expected: `2 passed`.

---

### Task 17: Accessibility scan

**Files:**
- Create: `sprint-gallery/tests/e2e/a11y.spec.ts`

- [ ] **Step 1: Write test**

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('axe a11y scan', () => {
  const routes = ['/', '/sprints/ugc-platform-002/', '/prototypes/ugc-platform-002/app-001/'];

  for (const path of routes) {
    test(`no critical/serious violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      const critical = results.violations.filter((v) =>
        ['critical', 'serious'].includes(v.impact ?? ''),
      );
      if (critical.length > 0) {
        console.log(JSON.stringify(critical, null, 2));
      }
      expect(critical).toEqual([]);
    });
  }
});
```

- [ ] **Step 2: Run and expect PASS**

```bash
pnpm run test:e2e -- a11y
```

Expected: `3 passed`. If any fail, the printed JSON names the violation — fix in the offending component before commit.

---

### Task 18: Commit Phase 5 (view transitions + motion)

- [ ] **Step 1: Commit**

```bash
git add sprint-gallery/src/lib/motion.ts \
        sprint-gallery/src/lib/motion.test.ts \
        sprint-gallery/src/styles/transitions.css \
        sprint-gallery/src/components/Layout.astro \
        sprint-gallery/tests/e2e/reduced-motion.spec.ts \
        sprint-gallery/tests/e2e/a11y.spec.ts
git commit -m "feat(gallery): view transitions + motion system

- <ViewTransitions /> wired into Layout.astro
- transitions.css defines default root crossfade + spring-handoff for named elements
- motion.ts exposes DUR/EASE tokens mirroring CSS + reduced-motion helpers
- aria-live announcer updates on astro:after-swap
- Reduced-motion + axe a11y E2E coverage"
```

---

## Phase 6 — CI & Finalization

### Task 19: Wire Playwright into CI

**Files:**
- Modify: `.github/workflows/gallery.yml`

- [ ] **Step 1: Add Playwright install + test steps**

Open `.github/workflows/gallery.yml`. Immediately after the existing `Install Chromium for Puppeteer` step, append:

```yaml
      - name: Install Playwright browsers
        working-directory: sprint-gallery
        run: pnpm exec playwright install --with-deps chromium

      - name: E2E tests
        working-directory: sprint-gallery
        run: pnpm run test:e2e
```

Place them between the existing `Install Chromium for Puppeteer` and `Test` steps so E2E runs before vitest, keeping the existing ordering intact.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/gallery.yml
git commit -m "ci(gallery): run playwright e2e on every build"
```

---

### Task 20: Final manual verification & PR

- [ ] **Step 1: Build and preview locally**

```bash
cd sprint-gallery
pnpm run build
pnpm run preview
```

- [ ] **Step 2: Manual checklist** — open `http://localhost:4321/zzem-orchestrator/` and verify:

  - Home: vertical snap between sprints works on scroll
  - Rail: active dot updates as panels scroll into view; clicking a rail node jumps to that panel
  - Hero click → preview: card visibly animates into the device frame (requires Chrome/Edge 111+; Firefox falls back to cross-fade)
  - ESC in preview: returns to home with reverse transition
  - Direct nav to `/prototypes/ugc-platform-002/app-001/` works
  - `/sprints/ugc-platform-002/` still loads with all PRD content
  - Theme toggle still flips dark/light
  - ⌘K search palette still works
  - Resize to ≤720px: rail hidden, horizontal story track appears in each panel
  - Dev tools → Rendering → emulate `prefers-reduced-motion: reduce`: transitions collapse to crossfade, hover transforms suppressed

- [ ] **Step 3: Full test suite passes**

```bash
pnpm run test && pnpm run test:e2e
```

Expected: all green.

- [ ] **Step 4: Push branch and open PR**

```bash
cd /Users/zachryu/.superset/worktrees/zzem-orchestrator/chore/enhance-prototype
git push -u origin feat/gallery-ux-redesign
gh pr create --base main --title "Gallery UX redesign: seamless snap stream + shared-element preview" --body "$(cat <<'EOF'
## Summary
- Sprint gallery is now a vertical snap stream; each sprint is one panel with a hero, meta, summary, and side grid.
- Prototype previews move out of the modal and onto their own route (`/prototypes/<slug>/<id>/`) so they can be shared as deep links.
- View Transitions API animates card → preview as a single shared element; Firefox falls back to cross-fade automatically.
- Typography moves to Pretendard Variable (Korean-first) with a larger readable scale (15/1.75 body).
- Motion system formalized: four curves (ease-out 140, spring-soft 220, spring-handoff 320, linear-fast 100) mirrored in CSS tokens and `motion.ts`.
- Mobile becomes a first-class story-swipe experience.
- No runtime JS dependencies added.

## Spec
`docs/superpowers/specs/2026-04-23-gallery-ux-redesign-design.md`

## Test plan
- [ ] `pnpm test` + `pnpm test:e2e` green locally
- [ ] Manual: home scroll snap + rail sync
- [ ] Manual: hero click in Chrome → visible shared-element transition
- [ ] Manual: same flow in Firefox → cross-fade fallback, functionality intact
- [ ] Manual: direct deep link to `/prototypes/ugc-platform-002/app-001/` renders preview
- [ ] Manual: legacy link `/sprints/ugc-platform-002/` still loads
- [ ] Manual: DevTools reduced-motion emulation → linear fallback

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: After merge — post-deploy verification**

Once the PR merges and `gallery.yml` finishes, open:

1. `https://zach-wrtn.github.io/zzem-orchestrator/`
2. `https://zach-wrtn.github.io/zzem-orchestrator/sprints/ugc-platform-002/`
3. `https://zach-wrtn.github.io/zzem-orchestrator/prototypes/ugc-platform-002/app-001/`

All three must load within ~2s and exhibit the behaviors from Step 2.

- [ ] **Step 6: Update memory**

Update `~/.claude/projects/-Users-zachryu-dev-work-zzem-orchestrator/memory/feedback_prototype_viewer.md` to record the new viewer architecture (snap stream, shared-element preview, new URL shape).

---

## Rollback

If any post-deploy verification fails:

```bash
git checkout main
git revert <merge-commit-sha>
git push origin main
```

GitHub Actions re-runs `gallery.yml`; the site returns to pre-redesign state in ~90 seconds.
