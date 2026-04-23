# Design System v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `docs/designs/` into agent-consumable Astro Content Collections (MDX + Zod) and render them as a visual browser at `/system/` on the sprint-gallery site — MVP ports Foundations (6) + 5 atomic components.

**Architecture:** Three Zod-validated content collections (foundations, components, patterns) live in `docs/designs/` and are symlinked into `sprint-gallery/src/content/` so Astro can consume them. A `sync-tokens.ts` prebuild step copies `wds-tokens/` DTCG JSON into `src/content/tokens/` (gitignored). Each foundation has a dedicated renderer (`SwatchGrid`, `TypeSpecimen`, `SpacingScale`, etc.); each component has a generic detail page with an iframe demo + variants + tokens-used + states sections. `/system/` index plus `SearchPalette` extension integrate the new tree into the existing gallery site.

**Tech Stack:** Astro 4 Content Collections (built-in, with Zod), MDX, Pretendard + JetBrains Mono (already in stack), Puppeteer + Playwright for test tooling (already devDeps).

**Spec:** `docs/superpowers/specs/2026-04-23-design-system-v2-design.md`

---

## Prerequisites

Before starting, from the repo root:

```bash
git checkout main && git pull
git checkout -b feat/design-system-v2
# The spec commit 478870f needs to reach this branch. Easiest:
git cherry-pick 478870f
```

Working directory for most tasks: `sprint-gallery/`. Exceptions noted per task.

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `docs/designs/README.md` | Structure overview + agent guide |
| Move | `docs/designs/component-patterns.md` → `docs/designs/_archive/component-patterns-2026-04-09.md` | Preserve legacy with "Moved" banner |
| Create | `docs/designs/foundations/{color,typography,spacing,radius,motion,elevation}.mdx` | 6 foundation files |
| Create | `docs/designs/components/{button,card,chip,bottom-nav,bottom-sheet}.mdx` | 5 component files |
| Create | `docs/designs/components/{button,card,chip,bottom-nav,bottom-sheet}.demo.html` | 5 standalone demo files |
| Create | `docs/designs/patterns/.gitkeep` | Empty pattern dir |
| Create | `sprint-gallery/src/content/config.ts` | Zod schemas for 3 collections |
| Create | `sprint-gallery/src/content/foundations` → symlink to `../../../docs/designs/foundations` | Astro consumption |
| Create | `sprint-gallery/src/content/components` → symlink to `../../../docs/designs/components` | Astro consumption |
| Create | `sprint-gallery/src/content/patterns` → symlink to `../../../docs/designs/patterns` | Astro consumption |
| Modify | `sprint-gallery/.gitignore` | Ignore `src/content/tokens/` |
| Create | `sprint-gallery/scripts/sync-tokens.ts` | Copy wds-tokens → src/content/tokens/ |
| Create | `sprint-gallery/src/lib/token-resolve.ts` + `.test.ts` | Dotted-path token lookup |
| Create | `sprint-gallery/src/components/system/SwatchGrid.astro` | Color foundation renderer |
| Create | `sprint-gallery/src/components/system/TypeSpecimen.astro` | Typography foundation renderer |
| Create | `sprint-gallery/src/components/system/SpacingScale.astro` | Spacing foundation renderer |
| Create | `sprint-gallery/src/components/system/RadiusScale.astro` | Radius foundation renderer |
| Create | `sprint-gallery/src/components/system/MotionPlayer.astro` | Motion foundation renderer |
| Create | `sprint-gallery/src/components/system/ElevationStack.astro` | Elevation foundation renderer |
| Create | `sprint-gallery/src/components/system/ComponentDemo.astro` | Iframe srcdoc + variant pill |
| Create | `sprint-gallery/src/components/system/VariantTable.astro` | Variant list |
| Create | `sprint-gallery/src/components/system/StatesList.astro` | States list |
| Create | `sprint-gallery/src/components/system/TokensList.astro` | Tokens-used table |
| Create | `sprint-gallery/src/components/system/RelatedList.astro` | Related components list |
| Create | `sprint-gallery/src/components/system/SystemSidebar.astro` | Left nav tree |
| Create | `sprint-gallery/src/pages/system/index.astro` | `/system` home |
| Create | `sprint-gallery/src/pages/system/foundations/index.astro` | `/system/foundations` list |
| Create | `sprint-gallery/src/pages/system/foundations/[key].astro` | Foundation detail route |
| Create | `sprint-gallery/src/pages/system/components/index.astro` | `/system/components` list |
| Create | `sprint-gallery/src/pages/system/components/[slug].astro` | Component detail route |
| Create | `sprint-gallery/src/pages/system/patterns/index.astro` | `/system/patterns` empty state |
| Modify | `sprint-gallery/src/components/TopBar.astro` | Add "System" link |
| Modify | `sprint-gallery/src/components/SearchPalette.tsx` | Index foundations + components |
| Modify | `sprint-gallery/package.json` | `sync:tokens` script; `build` includes sync |
| Create | `sprint-gallery/tests/e2e/system.spec.ts` | E2E for 5 system routes + demo interaction |
| Modify | `sprint-gallery/tests/e2e/a11y.spec.ts` | Add 5 system routes to axe scan |
| Modify | `~/.claude/.../memory/feedback_prototype_quality.md` | Update reference from md to /system |
| Modify | `~/.claude/.../memory/reference_component_patterns.md` | Update to describe new structure |

---

## Phase 1 — Scaffold (Commit 1)

### Task 1: Collection directories + archive legacy

**Files:**
- Create: `docs/designs/foundations/.gitkeep`
- Create: `docs/designs/components/.gitkeep`
- Create: `docs/designs/patterns/.gitkeep`
- Create: `docs/designs/_archive/.gitkeep`
- Move: `docs/designs/component-patterns.md` → `docs/designs/_archive/component-patterns-2026-04-09.md`

- [ ] **Step 1: Create directories (repo root)**

```bash
mkdir -p docs/designs/foundations docs/designs/components docs/designs/patterns docs/designs/_archive
touch docs/designs/foundations/.gitkeep \
      docs/designs/components/.gitkeep \
      docs/designs/patterns/.gitkeep \
      docs/designs/_archive/.gitkeep
```

- [ ] **Step 2: Move legacy md + prepend "Moved" banner**

```bash
git mv docs/designs/component-patterns.md docs/designs/_archive/component-patterns-2026-04-09.md
```

Open `docs/designs/_archive/component-patterns-2026-04-09.md` and prepend these 7 lines at the very top (before the existing `# ZZEM Component Patterns`):

```markdown
> **Archived 2026-04-23.** This file is preserved for history. See `docs/designs/README.md` for the current structure and `/system/` on the deployed gallery for the rendered browser.
>
> Individual components are now MDX files under `docs/designs/components/`, foundations under `docs/designs/foundations/`.

---

```

- [ ] **Step 3: Verify**

```bash
ls docs/designs/
# Expected: _archive  components  foundations  patterns
ls docs/designs/_archive/
# Expected: component-patterns-2026-04-09.md  .gitkeep
```

---

### Task 2: Symlinks + gitignore

**Files:**
- Create (symlinks): `sprint-gallery/src/content/{foundations,components,patterns}`
- Modify: `sprint-gallery/.gitignore`

Working dir: `sprint-gallery/`.

- [ ] **Step 1: Ensure the parent dir exists**

```bash
mkdir -p src/content
```

- [ ] **Step 2: Create the 3 symlinks**

```bash
cd src/content
ln -s ../../../docs/designs/foundations foundations
ln -s ../../../docs/designs/components components
ln -s ../../../docs/designs/patterns patterns
cd ../..
```

- [ ] **Step 3: Verify symlinks resolve**

```bash
ls src/content/foundations  # shows .gitkeep (resolved through symlink)
ls src/content/components   # shows .gitkeep
ls src/content/patterns     # shows .gitkeep
```

- [ ] **Step 4: Append to `sprint-gallery/.gitignore` (create if missing)**

```
# Synced tokens (source: wds-tokens repo, populated by scripts/sync-tokens.ts)
src/content/tokens/
```

Verify the three symlinks are tracked by git as symlinks (not resolved):

```bash
git ls-files --stage src/content/foundations src/content/components src/content/patterns
# Expected: each line should start with 120000 (symlink mode)
```

If the symlinks show mode `100644` instead of `120000`, your git has `core.symlinks=false` — set `git config core.symlinks true` in this repo and re-add.

---

### Task 3: Zod schema config

**Files:**
- Create: `sprint-gallery/src/content/config.ts`

- [ ] **Step 1: Write `sprint-gallery/src/content/config.ts`**

```typescript
import { defineCollection, z } from 'astro:content';

const foundations = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    key: z.enum(['color', 'typography', 'spacing', 'radius', 'motion', 'elevation']),
    description: z.string(),
    tokenSource: z.string(),
    order: z.number().default(99),
  }),
});

const components = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    category: z.enum(['layout', 'nav', 'surface', 'control', 'feedback']),
    status: z.enum(['stable', 'draft']).default('draft'),
    figmaFrame: z.string().url().optional(),
    tokens: z.array(z.string()).default([]),
    variants: z.array(
      z.object({
        name: z.string(),
        purpose: z.string(),
      }),
    ).default([]),
    states: z.array(
      z.object({
        name: z.string(),
        rule: z.string(),
      }),
    ).default([]),
    relatedComponents: z.array(z.string()).default([]),
    demoFile: z.string().optional(),
  }),
});

const patterns = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    purpose: z.string(),
    usesComponents: z.array(z.string()).default([]),
    figmaFrame: z.string().url().optional(),
  }),
});

export const collections = { foundations, components, patterns };
```

- [ ] **Step 2: Verify build still succeeds with empty collections**

```bash
pnpm run build
```

Expected: `Complete!`. Astro will log `[content] Synced content` or similar. Empty collections are valid.

If the build fails with a schema error, confirm the `regex(/^[a-z0-9-]+$/)` matches nothing in empty collections (it only validates provided values).

---

### Task 4: Commit Phase 1

- [ ] **Step 1: Stage and commit**

```bash
git add docs/designs/ \
        sprint-gallery/src/content/ \
        sprint-gallery/.gitignore
git commit -m "chore(design): scaffold content collections + zod schema + symlinks

- Create docs/designs/{foundations,components,patterns} + _archive
- Move legacy component-patterns.md to _archive with 'Moved' banner
- Symlink sprint-gallery/src/content/{foundations,components,patterns}
  into docs/designs/ so Astro consumes the same files agents read
- Add Zod schemas for the three collections
- Ignore src/content/tokens/ (populated by sync-tokens.ts at build time)"
```

- [ ] **Step 2: Verify commit**

```bash
git show --stat HEAD | head -20
```

Expected: roughly 7-8 file changes, including the 3 symlinks.

---

## Phase 2 — Foundations (Commit 2)

### Task 5: sync-tokens.ts script + npm script

**Files:**
- Create: `sprint-gallery/scripts/sync-tokens.ts`
- Modify: `sprint-gallery/package.json`

- [ ] **Step 1: Write `sprint-gallery/scripts/sync-tokens.ts`**

```typescript
/**
 * Sync DTCG tokens from wds-tokens repo into src/content/tokens/.
 * Runs as a prebuild step; no-ops (warning) if the source repo is absent.
 *
 * Usage: pnpm run sync:tokens
 * Env:   WDS_TOKENS_DIR (default: ~/dev/work/wds-tokens)
 */
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';

const SRC = process.env.WDS_TOKENS_DIR ?? join(homedir(), 'dev', 'work', 'wds-tokens');
const TARGET = 'src/content/tokens';
const LAYERS = ['primitive', 'semantic', 'component'];

async function main() {
  if (!existsSync(SRC)) {
    console.warn(
      `sync-tokens: ${SRC} not found. Skipping (existing committed tokens, if any, stay intact).`,
    );
    return;
  }

  if (existsSync(TARGET)) await rm(TARGET, { recursive: true });
  await mkdir(TARGET, { recursive: true });

  let copied = 0;
  for (const layer of LAYERS) {
    const layerDir = join(SRC, layer);
    if (!existsSync(layerDir)) continue;
    const files = (await readdir(layerDir)).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const raw = await readFile(join(layerDir, file), 'utf8');
      const out = `${layer}-${basename(file, '.json')}.json`;
      await writeFile(join(TARGET, out), raw);
      copied++;
    }
  }
  console.log(`sync-tokens: copied ${copied} JSON file(s) from ${SRC} → ${TARGET}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Modify `sprint-gallery/package.json` `scripts` block**

Replace existing `scripts` block with:

```json
"scripts": {
  "dev": "astro dev",
  "build": "pnpm run sync:tokens && pnpm run capture:screenshots && pnpm run copy:prototypes && astro build",
  "preview": "astro preview",
  "copy:prototypes": "tsx scripts/copy-prototypes.ts",
  "capture:screenshots": "tsx scripts/capture-screenshots.ts",
  "sync:tokens": "tsx scripts/sync-tokens.ts",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

- [ ] **Step 3: Run sync and verify**

```bash
pnpm run sync:tokens
```

Expected stdout: `sync-tokens: copied N JSON file(s) from ... → src/content/tokens/` where N ≥ 15 (primitive 6 + semantic 3 + component 15 = 24 based on current wds-tokens).

```bash
ls src/content/tokens/ | head
# Expected: component-button.json  primitive-color.json  primitive-elevation.json  semantic-dark.json  semantic-light.json  ...
```

---

### Task 6: token-resolve.ts + unit tests

**Files:**
- Create: `sprint-gallery/src/lib/token-resolve.ts`
- Create: `sprint-gallery/src/lib/token-resolve.test.ts`

- [ ] **Step 1: Write failing tests `sprint-gallery/src/lib/token-resolve.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { resolveToken, loadTokenMap } from './token-resolve';

const fixturePath = 'src/content/tokens';

describe('loadTokenMap', () => {
  it('flattens all synced token files into a path-keyed map', async () => {
    const map = await loadTokenMap(fixturePath);
    // After `pnpm run sync:tokens`, primitive-color.json should contain wds.color.purple.500
    expect(map['wds.color.purple.500']).toBeDefined();
    expect(map['wds.color.purple.500'].value).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe('resolveToken', () => {
  it('returns the value for a valid dotted path', async () => {
    const map = await loadTokenMap(fixturePath);
    const result = resolveToken(map, 'wds.color.purple.500');
    expect(result?.value).toBe('#8752FA');
  });

  it('returns null for an unknown path', async () => {
    const map = await loadTokenMap(fixturePath);
    expect(resolveToken(map, 'wds.color.unicorn.42')).toBeNull();
  });

  it('records the source file for each resolved token', async () => {
    const map = await loadTokenMap(fixturePath);
    const result = resolveToken(map, 'wds.color.purple.500');
    expect(result?.source).toBe('primitive-color.json');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (module does not exist)**

```bash
pnpm test token-resolve
```

Expected: cannot find module. Good — implement next.

- [ ] **Step 3: Write `sprint-gallery/src/lib/token-resolve.ts`**

```typescript
/**
 * Flatten DTCG token JSON files into a dotted-path map and look values up.
 * DTCG shape: any object with "$value" is a leaf; path is built from parent keys.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

export interface ResolvedToken {
  value: string;
  source: string; // filename, e.g., 'primitive-color.json'
}

export type TokenMap = Record<string, ResolvedToken>;

function walk(node: unknown, path: string[], source: string, out: TokenMap): void {
  if (node === null || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  if ('$value' in obj) {
    out[path.join('.')] = { value: String(obj.$value), source };
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue; // skip $type, $description, etc.
    walk(v, [...path, k], source, out);
  }
}

export async function loadTokenMap(dir: string): Promise<TokenMap> {
  const map: TokenMap = {};
  try {
    const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const raw = await readFile(join(dir, f), 'utf8');
      const json = JSON.parse(raw);
      walk(json, [], basename(f), map);
    }
  } catch {
    // dir missing — return empty map
  }
  return map;
}

export function resolveToken(map: TokenMap, ref: string): ResolvedToken | null {
  return map[ref] ?? null;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm test token-resolve
```

Expected: `3 passed` (or more if you added assertions).

If the test `wds.color.purple.500 → #8752FA` fails, inspect `src/content/tokens/primitive-color.json` to confirm the actual hex. wds-tokens authors may have adjusted the value; update the test to match reality, noting it in your report.

---

### Task 7: Foundation MDX files (6)

**Files (all under `docs/designs/foundations/`):**
- Create: `color.mdx`
- Create: `typography.mdx`
- Create: `spacing.mdx`
- Create: `radius.mdx`
- Create: `motion.mdx`
- Create: `elevation.mdx`

- [ ] **Step 1: Write `docs/designs/foundations/color.mdx`**

```mdx
---
name: Color
key: color
description: ZZEM의 컬러 체계. 중성·퍼플·시맨틱 3계층.
tokenSource: primitive-color.json
order: 1
---

## 3-layer 구조

토큰은 세 계층: **primitive**(원시 hex) → **semantic**(의미 별칭, light/dark) → **component**(컴포넌트 슬롯). 컴포넌트에서는 primitive를 직접 참조하지 말고 semantic 또는 component 토큰을 경유해야 다크모드가 자동 동작한다.

## 사용 규칙

- 브랜드 퍼플(`wds.color.purple.500`)은 CTA·selected·accent 신호에만. 일반 텍스트 색으로 사용 금지.
- 에러·성공·경고는 `function_red_3`, `function_green_3`, `function_yellow_3` 같은 시맨틱 토큰만.
- 신규 뱃지 전용 `#0080c6`은 primitive에 없는 값 — 레거시이므로 새 사용 자제.
```

- [ ] **Step 2: Write `docs/designs/foundations/typography.mdx`**

```mdx
---
name: Typography
key: typography
description: Pretendard 기반 10-step scale. H2/Title/Subtitle/Body/Label.
tokenSource: primitive-typography.json
order: 2
---

## 서체

- **Pretendard Variable** — 한국어·라틴 모두 담당. Inter는 라틴 폴백.
- **JetBrains Mono** — 라틴 전용 (코드·라벨·메타). 한국어 라벨은 sans.

## 스케일

10-step: H2-32 / Title3-18 / Subtitle 2-6 / Body 4-7 / Label5-10. 각 스텝은 size + line-height + weight가 한 쌍. size만 선택하고 line-height를 직접 조합하지 말 것.

## 한국어 특화

- `word-break: keep-all` + `overflow-wrap: break-word` — 단어 중간 끊김 방지
- 헤딩에 `text-wrap: balance` — 줄바꿈 자연스러움
- 숫자는 `font-variant-numeric: tabular-nums` — 날짜·카운트 정렬
```

- [ ] **Step 3: Write `docs/designs/foundations/spacing.mdx`**

```mdx
---
name: Spacing
key: spacing
description: 4·8·12·16·24·32·48·64 base. 8의 배수 준수.
tokenSource: primitive-spacing.json
order: 3
---

## 원칙

간격은 4px base 8px 증분. 이 집합 외 값은 디자인 의도가 명확한 경우에만. 1px·0.5px은 경계선(hairline) 용도로만 허용.

## 용도별 가이드

- 인라인 요소 간격: 4~8
- 카드 내부 여백: 12~16
- 섹션 간 간격: 24~32
- 화면 상하 여백(safe area 제외): 48~64
```

- [ ] **Step 4: Write `docs/designs/foundations/radius.mdx`**

```mdx
---
name: Radius
key: radius
description: 4·8·12·22·999 — 카드 12, 기기 프레임 22, pill 999.
tokenSource: primitive-spacing.json
order: 4
---

## 스케일

- **4** — input, tag
- **8** — chip, badge
- **12** — card, button (일반)
- **16** — CTA button, 저장 버튼
- **22** — 기기 프레임
- **28** — 바텀시트 (상단만)
- **999** — pill, 아바타

## 원칙

사각형과 원의 중간 값(14·16·20)은 피한다 — 시스템 전체의 리듬이 깨진다.
```

- [ ] **Step 5: Write `docs/designs/foundations/motion.mdx`**

```mdx
---
name: Motion
key: motion
description: 4-curve system. ease-out 140 / spring-soft 220 / spring-handoff 320 / linear-fast 100.
tokenSource: primitive-motion.json
order: 5
---

## 4개 커브

- **ease-out-quart 140ms** — 기본 UI (hover, reveal, 색 변화)
- **spring-soft 220ms** — 카드 hover lift, 테마 토글
- **spring-handoff 320ms** — 프리뷰 확장, 모달 open
- **linear-fast 100ms** — `prefers-reduced-motion: reduce` 폴백

## 원칙

임의 커브 추가 금지. 이 4개로 모든 인터랙션 설명되어야 함. 새 느낌이 필요하면 duration만 조정.

## reduced-motion

모든 스프링 → linear-fast. shared-element transition → cross-fade 80ms. hover transform 제거, 색 변화만 유지.
```

- [ ] **Step 6: Write `docs/designs/foundations/elevation.mdx`**

```mdx
---
name: Elevation
key: elevation
description: 3-step depth. 그림자는 중립색이 아닌 accent-tinted.
tokenSource: primitive-elevation.json
order: 6
---

## 3-step

- **e0 resting** — 그림자 없음. 기본 상태.
- **e1 hover** — `0 2px 8px rgba(0,0,0,0.35)`. 중립 깊이.
- **e2 active** — `0 14px 32px rgba(255,122,99,0.22), 0 2px 8px rgba(0,0,0,0.5)`. coral-tinted glow.

## 철학

elevation은 위계 신호이지 시각 장식이 아니다. e2는 사용자가 선택·조작 중인 요소에만 — 동시에 여러 개 뜨지 않도록.
```

- [ ] **Step 7: Verify build**

```bash
pnpm run build
```

Expected: build completes; Astro logs foundation collection entries. No route yet, but the collection is now populated.

---

### Task 8: Foundation renderer components (6)

**Files (all under `sprint-gallery/src/components/system/`):**
- Create: `SwatchGrid.astro`
- Create: `TypeSpecimen.astro`
- Create: `SpacingScale.astro`
- Create: `RadiusScale.astro`
- Create: `MotionPlayer.astro`
- Create: `ElevationStack.astro`

- [ ] **Step 1: Write `sprint-gallery/src/components/system/SwatchGrid.astro`**

```astro
---
import { loadTokenMap } from '@/lib/token-resolve';
interface Props { tokenSource: string; }
const { tokenSource } = Astro.props;
const tokens = await loadTokenMap('src/content/tokens');
const entries = Object.entries(tokens)
  .filter(([, v]) => v.source === tokenSource)
  .filter(([k]) => k.startsWith('wds.color.'))
  .sort();

function groupKey(path: string): string {
  // 'wds.color.purple.500' → 'purple'
  return path.split('.')[2] ?? 'other';
}
const grouped = new Map<string, typeof entries>();
for (const e of entries) {
  const g = groupKey(e[0]);
  if (!grouped.has(g)) grouped.set(g, []);
  grouped.get(g)!.push(e);
}
---
<section class="swatch-section">
  {[...grouped.entries()].map(([group, items]) => (
    <div class="group">
      <h3>{group}</h3>
      <div class="row">
        {items.map(([path, tok]) => (
          <div class="swatch">
            <div class="chip" style={`background: ${tok.value};`}></div>
            <div class="label">
              <span class="key">{path.split('.').slice(2).join('.')}</span>
              <span class="val">{tok.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}
  {entries.length === 0 && (
    <p class="empty">
      No tokens found in <code>{tokenSource}</code>. Run <code>pnpm run sync:tokens</code>.
    </p>
  )}
</section>

<style>
  .swatch-section { display: flex; flex-direction: column; gap: 28px; }
  .group h3 { font-size: var(--fs-h3); margin: 0 0 12px; text-transform: capitalize; }
  .row { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
  .swatch {
    display: flex; flex-direction: column; gap: 8px;
    border: 1px solid var(--border); border-radius: var(--radius-card);
    padding: 10px; background: var(--surface);
  }
  .chip { aspect-ratio: 1/1; border-radius: 8px; border: 1px solid var(--border); }
  .label { display: flex; flex-direction: column; gap: 2px; }
  .key { font-family: var(--font-mono); font-size: 11px; color: var(--text); }
  .val { font-family: var(--font-mono); font-size: 10px; color: var(--text-dim); }
  .empty { color: var(--text-dim); font-family: var(--font-mono); }
</style>
```

- [ ] **Step 2: Write `sprint-gallery/src/components/system/TypeSpecimen.astro`**

```astro
---
import { loadTokenMap } from '@/lib/token-resolve';
interface Props { tokenSource: string; }
const { tokenSource } = Astro.props;
const tokens = await loadTokenMap('src/content/tokens');
const entries = Object.entries(tokens)
  .filter(([, v]) => v.source === tokenSource)
  .sort();
---
<section class="type-section">
  {entries.length > 0 ? (
    <table>
      <thead><tr><th>token</th><th>value</th><th>specimen</th></tr></thead>
      <tbody>
        {entries.map(([path, tok]) => (
          <tr>
            <td><code>{path}</code></td>
            <td>{tok.value}</td>
            <td class="specimen" style={`font-size: ${tok.value};`}>다람쥐 헌 쳇바퀴에 타고파 · AaBbCc</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p class="empty">No tokens in <code>{tokenSource}</code>. Run <code>pnpm run sync:tokens</code>.</p>
  )}
</section>

<style>
  .type-section table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: baseline; }
  th { font-family: var(--font-mono); font-size: 11px; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
  td code { font-family: var(--font-mono); font-size: 12px; color: var(--accent); }
  .specimen { color: var(--text); font-family: var(--font-sans); }
  .empty { color: var(--text-dim); }
</style>
```

- [ ] **Step 3: Write `sprint-gallery/src/components/system/SpacingScale.astro`**

```astro
---
import { loadTokenMap } from '@/lib/token-resolve';
interface Props { tokenSource: string; }
const { tokenSource } = Astro.props;
const tokens = await loadTokenMap('src/content/tokens');
const entries = Object.entries(tokens)
  .filter(([, v]) => v.source === tokenSource)
  .map(([k, v]) => [k, v, parseInt(String(v.value).replace('px', ''), 10)] as const)
  .filter(([, , px]) => Number.isFinite(px))
  .sort((a, b) => a[2] - b[2]);
---
<section>
  <div class="scale">
    {entries.map(([path, tok, px]) => (
      <div class="row">
        <span class="key">{path}</span>
        <span class="bar" style={`width: ${Math.min(px * 4, 520)}px; height: ${Math.min(px, 64)}px;`}></span>
        <span class="val">{tok.value}</span>
      </div>
    ))}
  </div>
  {entries.length === 0 && <p class="empty">No spacing tokens found.</p>}
</section>

<style>
  .scale { display: flex; flex-direction: column; gap: 8px; }
  .row { display: grid; grid-template-columns: 240px 1fr 60px; align-items: center; gap: 14px; padding: 6px 0; border-bottom: 1px dashed var(--border); }
  .key { font-family: var(--font-mono); font-size: 11px; color: var(--text); }
  .val { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); }
  .bar { background: var(--accent); border-radius: 3px; min-width: 4px; }
  .empty { color: var(--text-dim); }
</style>
```

- [ ] **Step 4: Write `sprint-gallery/src/components/system/RadiusScale.astro`**

```astro
---
interface Props { tokenSource: string; }
// Radii are in primitive-spacing.json per the foundation; we inline the canonical
// scale here because radii are a small fixed set that doesn't need tokens lookup.
const scale = [
  { key: 'radius-xs',     px: 4,   label: 'input, tag' },
  { key: 'radius-sm',     px: 8,   label: 'chip, badge' },
  { key: 'radius-md',     px: 12,  label: 'card, button' },
  { key: 'radius-lg',     px: 16,  label: 'CTA button' },
  { key: 'radius-device', px: 22,  label: 'device frame' },
  { key: 'radius-sheet',  px: 28,  label: 'bottom sheet top' },
  { key: 'radius-pill',   px: 999, label: 'pill, avatar' },
];
---
<section class="scale">
  {scale.map((r) => (
    <div class="row">
      <div class="sample" style={`border-radius: ${r.px}px;`}></div>
      <div class="meta">
        <span class="key">{r.key}</span>
        <span class="val">{r.px === 999 ? '999px (full)' : `${r.px}px`}</span>
        <span class="lbl">{r.label}</span>
      </div>
    </div>
  ))}
</section>

<style>
  .scale { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
  .row { display: flex; flex-direction: column; gap: 10px; padding: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-card); }
  .sample { width: 100%; aspect-ratio: 4/3; background: var(--accent-grad); }
  .meta { display: flex; flex-direction: column; gap: 2px; }
  .key { font-family: var(--font-mono); font-size: 12px; color: var(--text); }
  .val { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); }
  .lbl { font-size: 12px; color: var(--text-dim); }
</style>
```

- [ ] **Step 5: Write `sprint-gallery/src/components/system/MotionPlayer.astro`**

```astro
---
interface Props { tokenSource: string; }
const curves = [
  { key: 'ease-out-quart',  dur: 140, ease: 'cubic-bezier(0.25, 1, 0.5, 1)',     use: '기본 UI' },
  { key: 'spring-soft',     dur: 220, ease: 'cubic-bezier(0.34, 1.35, 0.64, 1)',  use: '카드 hover' },
  { key: 'spring-handoff',  dur: 320, ease: 'cubic-bezier(0.22, 1.5, 0.36, 1)',   use: '프리뷰 확장' },
  { key: 'linear-fast',     dur: 100, ease: 'linear',                             use: 'reduced-motion 폴백' },
];
---
<section class="curves">
  {curves.map((c) => (
    <div class="curve">
      <button class="stage" data-play style={`--d:${c.dur}ms; --e:${c.ease};`}>
        <span class="ball"></span>
      </button>
      <div class="meta">
        <span class="k">{c.key}</span>
        <span class="v">{c.dur}ms · <code>{c.ease}</code></span>
        <span class="u">{c.use}</span>
      </div>
    </div>
  ))}
</section>

<script>
  document.querySelectorAll<HTMLButtonElement>('[data-play]').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.classList.remove('go');
      void btn.offsetWidth;
      btn.classList.add('go');
    });
  });
</script>

<style>
  .curves { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
  .curve { display: flex; flex-direction: column; gap: 10px; padding: 14px; border: 1px solid var(--border); border-radius: var(--radius-card); background: var(--surface); }
  .stage {
    background: none; border: 1px dashed var(--border); border-radius: var(--radius-chip);
    position: relative; width: 100%; height: 56px; cursor: pointer; padding: 0;
  }
  .ball { position: absolute; left: 4px; top: 50%; width: 24px; height: 24px; transform: translateY(-50%); border-radius: 50%; background: var(--accent-grad); }
  .stage.go .ball { animation: slide var(--d) var(--e) forwards; }
  @keyframes slide {
    from { left: 4px; } to { left: calc(100% - 28px); }
  }
  .meta { display: flex; flex-direction: column; gap: 2px; }
  .k { font-family: var(--font-mono); font-size: 12px; color: var(--text); }
  .v { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-dim); }
  .u { font-size: 12px; color: var(--text-dim); }
  @media (prefers-reduced-motion: reduce) {
    .stage.go .ball { animation: none; left: calc(100% - 28px); }
  }
</style>
```

- [ ] **Step 6: Write `sprint-gallery/src/components/system/ElevationStack.astro`**

```astro
---
interface Props { tokenSource: string; }
const levels = [
  { key: 'e0 resting', shadow: 'none' },
  { key: 'e1 hover',   shadow: '0 2px 8px rgba(0,0,0,0.35)' },
  { key: 'e2 active',  shadow: '0 14px 32px rgba(255,122,99,0.22), 0 2px 8px rgba(0,0,0,0.5)' },
];
---
<section class="stack">
  {levels.map((l) => (
    <div class="item">
      <div class="sample" style={`box-shadow: ${l.shadow};`}></div>
      <span class="k">{l.key}</span>
      <span class="v"><code>{l.shadow}</code></span>
    </div>
  ))}
</section>

<style>
  .stack { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 32px; padding: 24px 0; }
  .item { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .sample { width: 120px; height: 120px; background: var(--surface); border-radius: var(--radius-card); border: 1px solid var(--border); }
  .k { font-family: var(--font-mono); font-size: 12px; color: var(--text); }
  .v code { font-family: var(--font-mono); font-size: 10px; color: var(--text-dim); max-width: 240px; display: inline-block; text-align: center; }
</style>
```

- [ ] **Step 7: Verify build (renderers exist but no route yet)**

```bash
pnpm run build
```

Expected: Complete! No new errors. No routes reference these components yet.

---

### Task 9: Foundation routes + list page + E2E + Phase 2 commit

**Files:**
- Create: `sprint-gallery/src/pages/system/foundations/index.astro`
- Create: `sprint-gallery/src/pages/system/foundations/[key].astro`
- Create: `sprint-gallery/tests/e2e/system.spec.ts`

- [ ] **Step 1: Write failing test `sprint-gallery/tests/e2e/system.spec.ts`**

Remember — use relative paths for `page.goto()` (baseURL already includes `/zzem-orchestrator/`).

```typescript
import { test, expect } from '@playwright/test';

test.describe('system foundations', () => {
  test('foundations list renders all 6 entries', async ({ page }) => {
    await page.goto('system/foundations/');
    const cards = page.locator('[data-foundation-card]');
    await expect(cards).toHaveCount(6);
  });

  test('color route renders swatch section', async ({ page }) => {
    await page.goto('system/foundations/color/');
    await expect(page.locator('.swatch-section')).toBeVisible();
    const swatches = page.locator('.swatch');
    const count = await swatches.count();
    expect(count).toBeGreaterThan(5);
  });

  test('typography route renders specimen table', async ({ page }) => {
    await page.goto('system/foundations/typography/');
    await expect(page.locator('.type-section table')).toBeVisible();
  });

  test('motion route has interactive play buttons', async ({ page }) => {
    await page.goto('system/foundations/motion/');
    const plays = page.locator('[data-play]');
    await expect(plays.first()).toBeVisible();
  });
});
```

- [ ] **Step 2: Run test, expect FAIL (routes missing)**

```bash
pnpm run test:e2e -- system
```

- [ ] **Step 3: Write `sprint-gallery/src/pages/system/foundations/[key].astro`**

```astro
---
import Layout from '@/components/Layout.astro';
import { getCollection } from 'astro:content';
import SwatchGrid from '@/components/system/SwatchGrid.astro';
import TypeSpecimen from '@/components/system/TypeSpecimen.astro';
import SpacingScale from '@/components/system/SpacingScale.astro';
import RadiusScale from '@/components/system/RadiusScale.astro';
import MotionPlayer from '@/components/system/MotionPlayer.astro';
import ElevationStack from '@/components/system/ElevationStack.astro';

export async function getStaticPaths() {
  const entries = await getCollection('foundations');
  return entries.map((entry) => ({
    params: { key: entry.data.key },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();

const renderers = {
  color: SwatchGrid,
  typography: TypeSpecimen,
  spacing: SpacingScale,
  radius: RadiusScale,
  motion: MotionPlayer,
  elevation: ElevationStack,
};
const Renderer = renderers[entry.data.key];
const base = import.meta.env.BASE_URL;
const backHref = `${base}/system/foundations/`.replace(/\/+/g, '/');
---
<Layout title={`${entry.data.name} · System`}>
  <nav class="crumb">
    <a href={`${base}/system/`.replace(/\/+/g, '/')}>System</a>
    <span> / </span>
    <a href={backHref}>Foundations</a>
    <span> / </span>
    <span class="cur">{entry.data.name}</span>
  </nav>
  <header class="head">
    <h1>{entry.data.name}</h1>
    <p class="sub">{entry.data.description}</p>
  </header>
  <article class="prose"><Content /></article>
  <Renderer tokenSource={entry.data.tokenSource} />
</Layout>

<style>
  .crumb { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-dim); margin: 24px 0 6px; }
  .crumb a { color: var(--text-dim); }
  .crumb a:hover { color: var(--accent); }
  .crumb .cur { color: var(--text); }
  .head h1 { font-size: var(--fs-h1); letter-spacing: var(--ls-h1); margin: 6px 0 6px; }
  .head .sub { color: var(--text-dim); max-width: 60ch; margin: 0 0 24px; }
  .prose { color: var(--text-dim); max-width: 68ch; margin: 0 0 32px; line-height: var(--lh-body); }
  .prose :global(h2), .prose :global(h3) { color: var(--text); margin: 1.4em 0 0.5em; }
  .prose :global(p) { margin: 0.8em 0; max-width: 68ch; }
  .prose :global(ul) { padding-left: 1.4em; }
  .prose :global(code) { font-family: var(--font-mono); font-size: 0.88em; background: var(--surface-hover); border: 1px solid var(--border); padding: 1px 5px; border-radius: 4px; color: var(--text); }
</style>
```

- [ ] **Step 4: Write `sprint-gallery/src/pages/system/foundations/index.astro`**

```astro
---
import Layout from '@/components/Layout.astro';
import { getCollection } from 'astro:content';
const entries = (await getCollection('foundations')).sort((a, b) => a.data.order - b.data.order);
const base = import.meta.env.BASE_URL;
---
<Layout title="Foundations · System">
  <nav class="crumb">
    <a href={`${base}/system/`.replace(/\/+/g, '/')}>System</a>
    <span> / </span>
    <span class="cur">Foundations</span>
  </nav>
  <header class="head">
    <h1>Foundations</h1>
    <p class="sub">Color · Typography · Spacing · Radius · Motion · Elevation.</p>
  </header>
  <div class="grid">
    {entries.map((e) => (
      <a class="card" data-foundation-card href={`${base}/system/foundations/${e.data.key}/`.replace(/\/+/g, '/')}>
        <span class="key">{e.data.key}</span>
        <span class="name">{e.data.name}</span>
        <span class="desc">{e.data.description}</span>
      </a>
    ))}
  </div>
</Layout>

<style>
  .crumb { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-dim); margin: 24px 0 6px; }
  .crumb a { color: var(--text-dim); }
  .crumb a:hover { color: var(--accent); }
  .crumb .cur { color: var(--text); }
  .head h1 { font-size: var(--fs-h1); letter-spacing: var(--ls-h1); margin: 6px 0 6px; }
  .head .sub { color: var(--text-dim); margin: 0 0 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
  .card {
    display: flex; flex-direction: column; gap: 6px;
    padding: 18px 20px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius-card);
    transition: transform var(--dur-spring-soft) var(--spring-soft), border-color var(--dur-spring-soft) var(--spring-soft);
  }
  .card:hover { transform: translateY(-2px); border-color: var(--accent); }
  .key { font-family: var(--font-mono); font-size: 11px; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.08em; }
  .name { font-size: var(--fs-h3); color: var(--text); font-weight: 600; }
  .desc { font-size: var(--fs-small); color: var(--text-dim); }
</style>
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
pnpm run test && pnpm run test:e2e -- system
```

Expected: vitest (now includes token-resolve tests) all pass; Playwright foundation tests all pass.

- [ ] **Step 6: Commit Phase 2**

```bash
git add sprint-gallery/scripts/sync-tokens.ts \
        sprint-gallery/package.json \
        sprint-gallery/src/lib/token-resolve.ts \
        sprint-gallery/src/lib/token-resolve.test.ts \
        sprint-gallery/src/components/system/ \
        sprint-gallery/src/pages/system/foundations/ \
        sprint-gallery/tests/e2e/system.spec.ts \
        docs/designs/foundations/
git commit -m "feat(design): foundations + sync-tokens + renderers

- sync-tokens.ts copies wds-tokens DTCG JSON into src/content/tokens/
  as a prebuild step; absent source is a warning, not a failure
- token-resolve flattens DTCG into a dotted-path map; TDD with vitest
- 6 foundation MDX files (color, typography, spacing, radius, motion,
  elevation) with Zod-validated frontmatter and agent-readable guides
- 6 per-category renderers: SwatchGrid, TypeSpecimen, SpacingScale,
  RadiusScale, MotionPlayer (interactive curves), ElevationStack
- /system/foundations list + /system/foundations/:key detail routes
- E2E coverage for list count, color swatches, typography table,
  motion play buttons"
```

---

## Phase 3 — Components (Commit 3)

### Task 10: Component MDX + demo HTML (5 × 2 = 10 files)

**Files (all under `docs/designs/components/`):**
- Create: `button.mdx` + `button.demo.html`
- Create: `card.mdx` + `card.demo.html`
- Create: `chip.mdx` + `chip.demo.html`
- Create: `bottom-nav.mdx` + `bottom-nav.demo.html`
- Create: `bottom-sheet.mdx` + `bottom-sheet.demo.html`

Each MDX entry below is the FULL file contents (frontmatter + body). Each demo HTML is standalone — no external CSS.

- [ ] **Step 1: `docs/designs/components/button.mdx`**

```mdx
---
name: Button
slug: button
category: control
status: stable
tokens:
  - wds.color.neutral.0
  - wds.color.neutral.900
  - wds.color.purple.500
  - wds.color.red.500
variants:
  - name: primary
    purpose: 기본 CTA. #262626 배경 + white 텍스트. "저장" · "확인" 등 주 완료 액션.
  - name: secondary
    purpose: 보조 액션. #f1f1f1 배경 + #262626 텍스트. "취소" · 프로필 공유 등.
  - name: destructive
    purpose: 파괴적 액션. #d92800 텍스트. 바텀시트 안 "삭제하기" 등.
states:
  - name: disabled
    rule: bg #f1f1f1, text opacity 0.5, pointer-events none
  - name: loading
    rule: 스피너 inline, 텍스트 숨김, aria-busy=true
relatedComponents: [bottom-sheet]
demoFile: ./button.demo.html
---

## Anatomy
버튼 터치 타겟 최소 44px (iOS HIG 준수). border-radius는 일반 12px, CTA·저장 16px, h-56 하단 고정은 16px.

## Usage
- **Primary는 한 화면에 하나만.** 완료·저장 같은 주요 액션 전용.
- **Secondary는 취소 또는 보조.** 듀얼 액션 시트에서 취소/확인 페어.
- **Destructive는 바텀시트 안에서만.** 인라인 리스트에 섞지 말 것.

## Why it looks this way
MY 프로필의 "프로필 편집"/"프로필 공유"는 둘 다 secondary(회색) — 브랜드 퍼플이 아닌 이유는 CTA 위계를 강조하지 않는 디자인 의도. 피드 상세의 "재생성" 버튼만 퍼플.
```

- [ ] **Step 2: `docs/designs/components/button.demo.html`**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 24px; background: #FFFFFF; font-family: 'Pretendard Variable', -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .row { display: flex; flex-direction: column; gap: 14px; align-items: center; }
  button {
    min-height: 44px; padding: 0 20px; border-radius: 12px; border: none;
    font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
  }
  button.primary { background: #262626; color: #FFF; }
  button.secondary { background: #F1F1F1; color: #262626; }
  button.destructive { background: transparent; color: #D92800; }
  button.disabled { background: #F1F1F1; color: rgba(38,38,38,0.5); pointer-events: none; }
</style>
</head>
<body>
<div class="row">
  <button class="primary">저장</button>
  <button class="secondary">취소</button>
  <button class="destructive">삭제하기</button>
  <button class="disabled">저장</button>
</div>
<script>
  // Variant query support: ?variant=primary|secondary|destructive
  const variant = new URLSearchParams(location.search).get('variant');
  if (variant) {
    document.querySelectorAll('button').forEach((b) => b.style.display = 'none');
    const show = document.querySelector(`button.${variant}`);
    if (show) show.style.display = 'inline-flex';
  }
</script>
</body>
</html>
```

- [ ] **Step 3: `docs/designs/components/card.mdx`**

```mdx
---
name: Card
slug: card
category: surface
status: stable
tokens:
  - wds.color.neutral.0
  - wds.color.neutral.900
variants:
  - name: feed
    purpose: 2열 피드 카드. 이미지 + 하단 그라디언트 오버레이 + 크리에이터 바.
  - name: template
    purpose: 신규 템플릿 작은 카드 (100×100).
  - name: ranking
    purpose: 실시간 랭킹 썸네일 (40×40 + 이름).
states:
  - name: new
    rule: 좌상단 pill "신규" (#0080c6 bg, Pretendard SemiBold 12 white).
  - name: generating
    rule: dark gradient overlay + "생성중..." + 회전 로고 스피너.
  - name: failed
    rule: dark gradient overlay + "생성 실패" + CancelStroke X 버튼.
relatedComponents: [chip]
demoFile: ./card.demo.html
---

## Anatomy
피드 카드는 1:1과 4:5 비율 교차 (Pinterest magazine). 카드 간격 1px (모자이크 느낌). border-radius 4px.

## Variants
- **feed** — 썸네일 + 하단 그라디언트 + 18px 아바타 + 닉네임(SemiBold 12 white) + 하트/좋아요 수(우측)
- **template** — 이미지 + 이름(Medium 12, 1줄 말줄임). 가로 스크롤 rail에 사용.
- **ranking** — 순위 번호 + 40px 썸네일 + 이름 + 타입 뱃지.

## States
피드 카드는 생성중/실패 상태를 자체적으로 표현 — 부모가 별도 처리 금지.
```

- [ ] **Step 4: `docs/designs/components/card.demo.html`**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 20px; background: #FFF; font-family: 'Pretendard Variable', sans-serif; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; }
  .grid { display: grid; grid-template-columns: repeat(2, 160px); gap: 1px; }
  .card {
    position: relative; background: linear-gradient(135deg, #FF7A63, #4B2F88);
    aspect-ratio: 1/1; border-radius: 4px; overflow: hidden;
  }
  .card.tall { aspect-ratio: 4/5; }
  .new-badge {
    position: absolute; top: 8px; left: 8px;
    background: #0080C6; color: #FFF; padding: 4px 8px;
    font-size: 12px; font-weight: 600; border-radius: 8px;
  }
  .overlay {
    position: absolute; left: 0; right: 0; bottom: 0; padding: 10px;
    background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
    color: #FFF;
  }
  .overlay .title { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
  .creator { display: flex; align-items: center; gap: 6px; font-size: 12px; }
  .creator .av { width: 18px; height: 18px; border-radius: 50%; background: #FFF; }
  .likes { position: absolute; right: 10px; bottom: 10px; color: #FFF; font-size: 12px; font-weight: 600; }
</style>
</head>
<body>
<div class="grid">
  <div class="card tall">
    <div class="new-badge">신규</div>
    <div class="overlay">
      <div class="title">AI Video Template</div>
      <div class="creator"><span class="av"></span><span>zzem_creator</span></div>
    </div>
    <div class="likes">♡ 42</div>
  </div>
  <div class="card">
    <div class="overlay">
      <div class="title">Dance Challenge</div>
      <div class="creator"><span class="av"></span><span>user_name</span></div>
    </div>
    <div class="likes">♡ 8.6K</div>
  </div>
</div>
<script>
  const variant = new URLSearchParams(location.search).get('variant');
  if (variant === 'template') document.querySelector('.grid').style.gridTemplateColumns = 'repeat(3, 100px)';
</script>
</body>
</html>
```

- [ ] **Step 5: `docs/designs/components/chip.mdx`**

```mdx
---
name: Chip
slug: chip
category: control
status: stable
tokens:
  - wds.color.purple.500
  - wds.color.neutral.200
variants:
  - name: filter
    purpose: 홈 카테고리 pill. border 1px #e8e8e8, padding 8px 14px, rounded-full.
  - name: tab
    purpose: 프로필 탭 underline (텍스트만, active시 2px 밑줄).
  - name: status
    purpose: 스프린트 status badge (in-progress/completed/archived).
states:
  - name: active
    rule: 필터=배경 #262626 + text white / 탭=하단 2px 밑줄 w-60px #262626.
  - name: new-dot
    purpose: 일부 필터 칩에 green NEW dot (우상단, 8px).
relatedComponents: []
demoFile: ./chip.demo.html
---

## Anatomy
Pill chip은 border-radius 9999px. height 32px 기준. text Pretendard Medium 13px.

## Usage
- **filter** — 가로 스크롤 rail에서 다중 선택. 한 번에 여러 활성 가능.
- **tab** — 프로필/상세뷰 섹션 전환용 단일 선택.
- **status** — 읽기 전용 식별 뱃지. 클릭 불가.
```

- [ ] **Step 6: `docs/designs/components/chip.demo.html`**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 20px; background: #FFF; font-family: 'Pretendard Variable', sans-serif; display: flex; flex-direction: column; gap: 16px; align-items: center; justify-content: center; min-height: 100vh; }
  .row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; max-width: 400px; }
  .chip {
    border-radius: 9999px; padding: 8px 14px; font-size: 13px; font-weight: 500;
    border: 1px solid #E8E8E8; background: #FFF; color: #262626;
    position: relative;
  }
  .chip.active { background: #262626; color: #FFF; border-color: #262626; }
  .chip .dot { position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; border-radius: 50%; background: #22C55E; }
</style>
</head>
<body>
<div class="row">
  <span class="chip active">추천</span>
  <span class="chip">비디오 생성</span>
  <span class="chip">이미지 생성<span class="dot"></span></span>
  <span class="chip">댄스 챌린지</span>
  <span class="chip">AI 포트레이트</span>
</div>
</body>
</html>
```

- [ ] **Step 7: `docs/designs/components/bottom-nav.mdx`**

```mdx
---
name: Bottom Nav
slug: bottom-nav
category: nav
status: stable
tokens:
  - wds.color.neutral.0
  - wds.color.neutral.900
  - wds.color.purple.500
variants:
  - name: three-tab
    purpose: 3-tab (홈 / 탐색 / MY). 아이콘만, 텍스트 라벨 없음.
states:
  - name: active
    rule: 채워진 아이콘 (Fill variant). color #262626.
  - name: inactive
    rule: outline 아이콘 (Stroke variant). color #8a8a8a.
  - name: badge-my
    rule: MY 탭 우상단 보라색 dot badge (8px, #8752fa).
relatedComponents: []
demoFile: ./bottom-nav.demo.html
---

## Anatomy
높이 pt-10 pb-26 px-12 (iOS safe area 고려). 상단 border 0.5px #f1f1f1. 3 탭 균등 분할.

## Why no labels
텍스트 라벨 없이 아이콘만 — ZZEM의 minimal design language. 아이콘이 universal하지 않다면 라벨 고려 대상이지만, 3개 핵심 탭은 유저가 금방 학습.

## Icon mapping
- 홈: 집 아이콘 (내부에 ZZEM 미니 로고)
- 탐색: 돋보기 (SearchStroke/Fill)
- MY: 사람 실루엣 (ProfileStroke/Fill)
```

- [ ] **Step 8: `docs/designs/components/bottom-nav.demo.html`**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 0; background: #F7F7F7; font-family: 'Pretendard Variable', sans-serif; display: flex; justify-content: center; align-items: flex-end; min-height: 100vh; }
  .device { background: #FFF; width: 390px; height: 844px; border: 1px solid #E0E0E0; border-radius: 40px; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; }
  nav { display: flex; justify-content: space-around; align-items: center; padding: 10px 12px 26px; background: #FFF; border-top: 0.5px solid #F1F1F1; }
  .tab { display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; cursor: pointer; padding: 6px 20px; }
  .icon { width: 28px; height: 28px; border-radius: 6px; background: #8a8a8a; opacity: 0.5; }
  .tab.active .icon { opacity: 1; background: #262626; }
  .badge { position: absolute; top: 2px; right: 14px; width: 8px; height: 8px; border-radius: 50%; background: #8752FA; }
</style>
</head>
<body>
<div class="device">
  <nav>
    <div class="tab active"><div class="icon"></div></div>
    <div class="tab"><div class="icon"></div></div>
    <div class="tab"><div class="icon"></div><div class="badge"></div></div>
  </nav>
</div>
</body>
</html>
```

- [ ] **Step 9: `docs/designs/components/bottom-sheet.mdx`**

```mdx
---
name: Bottom Sheet
slug: bottom-sheet
category: surface
status: stable
tokens:
  - wds.color.neutral.0
  - wds.color.neutral.900
  - wds.color.red.500
variants:
  - name: confirm
    purpose: 텍스트 + 듀얼 액션 버튼 (취소 + 확인). gap-6.
  - name: menu
    purpose: 아이콘 + 텍스트 리스트 (다운로드, 신고 등). py-16 per item.
  - name: image-source
    purpose: 프로필 사진 선택 (카메라/앨범/삭제). 위험 액션(삭제) red text.
states:
  - name: open
    rule: 딤 오버레이 rgba(0,0,0,0.4), sheet slide up from bottom.
  - name: dragging
    rule: 핸들 바(40x4, #a7a7a7) 터치 중 opacity 1.0 (기본 0.6).
relatedComponents: [button]
demoFile: ./bottom-sheet.demo.html
---

## Anatomy
surface_elevated(white) bg, rounded-28 (상단만), 핸들 바 40×4 #a7a7a7 상단 중앙.

## Dim overlay
배경 딤 rgba(0,0,0,0.4). 탭하면 시트 닫힘 (sheet 자체는 드래그 down도 닫힘 동작).

## Variant 차이
- **confirm** — 파괴적 동작 확인용. "이 사진을 삭제하시겠습니까?" 같은 패턴.
- **menu** — 액션 메뉴. 아이콘 inline, 위험 액션은 red text.
- **image-source** — 프로필 이미지 편집 시. 카메라/앨범 + 삭제(빨강) 3-아이템 세트.
```

- [ ] **Step 10: `docs/designs/components/bottom-sheet.demo.html`**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 0; background: rgba(0,0,0,0.4); font-family: 'Pretendard Variable', sans-serif; display: flex; justify-content: center; align-items: flex-end; min-height: 100vh; }
  .sheet {
    width: 100%; max-width: 430px; background: #FFF; border-radius: 28px 28px 0 0;
    padding: 12px 0 24px;
  }
  .handle { width: 40px; height: 4px; border-radius: 2px; background: #A7A7A7; margin: 0 auto 14px; }
  .item { display: flex; align-items: center; gap: 12px; padding: 16px 20px; font-size: 16px; color: #262626; cursor: pointer; }
  .item:hover { background: #F7F7F7; }
  .item.destructive { color: #D92800; }
  .icon { width: 24px; height: 24px; border-radius: 6px; background: #E2E2E2; }
  .actions { display: flex; gap: 6px; padding: 12px 16px 4px; }
  .actions button {
    flex: 1; padding: 14px; border-radius: 16px; border: none;
    font-family: inherit; font-size: 16px; font-weight: 600; cursor: pointer;
  }
  .actions .cancel { background: rgba(0,0,0,0.1); color: #262626; }
  .actions .confirm { background: #262626; color: #FFF; }
  .text { padding: 14px 20px 8px; font-size: 16px; color: #262626; font-weight: 500; text-align: center; }
</style>
</head>
<body>
<div class="sheet" id="sheet"></div>
<script>
  const variant = new URLSearchParams(location.search).get('variant') || 'menu';
  const sheet = document.getElementById('sheet');
  const handle = '<div class="handle"></div>';
  if (variant === 'menu') {
    sheet.innerHTML = handle +
      '<div class="item"><div class="icon"></div>다운로드</div>' +
      '<div class="item"><div class="icon"></div>의견보내기</div>' +
      '<div class="item destructive"><div class="icon"></div>신고하기</div>';
  } else if (variant === 'confirm') {
    sheet.innerHTML = handle +
      '<div class="text">이 사진을 삭제하시겠습니까?</div>' +
      '<div class="actions"><button class="cancel">취소</button><button class="confirm">삭제</button></div>';
  } else {
    sheet.innerHTML = handle +
      '<div class="item"><div class="icon"></div>카메라/앨범</div>' +
      '<div class="item destructive"><div class="icon"></div>사진 삭제</div>';
  }
</script>
</body>
</html>
```

- [ ] **Step 11: Verify build**

```bash
pnpm run build
```

Expected: Complete! Astro logs 5 components in the collection. No routes for them yet.

---

### Task 11: Component helper renderers + routes + E2E + Phase 3 commit

**Files:**
- Create: `sprint-gallery/src/components/system/ComponentDemo.astro`
- Create: `sprint-gallery/src/components/system/VariantTable.astro`
- Create: `sprint-gallery/src/components/system/StatesList.astro`
- Create: `sprint-gallery/src/components/system/TokensList.astro`
- Create: `sprint-gallery/src/components/system/RelatedList.astro`
- Create: `sprint-gallery/src/pages/system/components/index.astro`
- Create: `sprint-gallery/src/pages/system/components/[slug].astro`

- [ ] **Step 1: Write E2E test (append to `tests/e2e/system.spec.ts` inside the existing `test.describe`)**

```typescript
  test('components list renders 5 entries', async ({ page }) => {
    await page.goto('system/components/');
    const cards = page.locator('[data-component-card]');
    await expect(cards).toHaveCount(5);
  });

  test('button detail renders demo iframe + variants', async ({ page }) => {
    await page.goto('system/components/button/');
    await expect(page.locator('.component-demo iframe')).toBeVisible();
    const variants = page.locator('.variant-pill');
    const n = await variants.count();
    expect(n).toBeGreaterThan(1);
  });

  test('variant pill updates iframe query', async ({ page }) => {
    await page.goto('system/components/button/');
    const secondPill = page.locator('.variant-pill').nth(1);
    const pillText = (await secondPill.textContent())?.trim() || '';
    await secondPill.click();
    const src = await page.locator('.component-demo iframe').getAttribute('src');
    // srcdoc demos don't have src; we use data-variant attribute + script
    const dataVariant = await page.locator('.component-demo iframe').getAttribute('data-variant');
    expect(dataVariant?.toLowerCase()).toBe(pillText.toLowerCase());
  });

  test('tokens list shows resolved values', async ({ page }) => {
    await page.goto('system/components/button/');
    const rows = page.locator('.tokens-list li');
    const n = await rows.count();
    expect(n).toBeGreaterThan(0);
  });
```

Run tests — expect FAILs:
```bash
pnpm run test:e2e -- system
```

- [ ] **Step 2: Write `ComponentDemo.astro`**

```astro
---
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

interface Variant { name: string; purpose: string; }
interface Props {
  demoPath: string;       // relative to the MDX entry file, like './button.demo.html'
  mdxFile: string;        // absolute path to the MDX file, for resolving demoPath
  variants: Variant[];
}
const { demoPath, mdxFile, variants } = Astro.props;

const absDemo = resolve(dirname(mdxFile), demoPath);
const demoHtml = await readFile(absDemo, 'utf8');
const defaultVariant = variants[0]?.name ?? '';
---
<div class="component-demo">
  {variants.length > 0 && (
    <div class="pills">
      {variants.map((v, i) => (
        <button class="variant-pill" data-variant-name={v.name} aria-pressed={i === 0 ? 'true' : 'false'}>
          {v.name}
        </button>
      ))}
    </div>
  )}
  <div class="frame">
    <iframe
      srcdoc={demoHtml}
      data-variant={defaultVariant}
      title="Component demo"
      sandbox="allow-scripts"
      loading="lazy"
    ></iframe>
  </div>
</div>

<script>
  document.querySelectorAll<HTMLElement>('.component-demo').forEach((demo) => {
    const iframe = demo.querySelector<HTMLIFrameElement>('iframe');
    const pills = demo.querySelectorAll<HTMLButtonElement>('.variant-pill');
    const originalSrcdoc = iframe?.srcdoc ?? '';
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => p.setAttribute('aria-pressed', 'false'));
        pill.setAttribute('aria-pressed', 'true');
        if (!iframe) return;
        const v = pill.dataset.variantName ?? '';
        iframe.dataset.variant = v;
        // Re-inject srcdoc with variant in URL-like param via data-variant; the
        // demo script reads `URLSearchParams(location.search).get('variant')`
        // which won't fire inside srcdoc — we append a <script> tag to set it.
        const vDoc = originalSrcdoc.replace(
          '</body>',
          `<script>history.replaceState(null, '', '?variant=${v}');<\/script></body>`,
        );
        iframe.srcdoc = vDoc;
      });
    });
  });
</script>

<style>
  .component-demo { display: flex; flex-direction: column; gap: 12px; margin: 16px 0 28px; }
  .pills { display: flex; flex-wrap: wrap; gap: 6px; }
  .variant-pill {
    background: var(--surface); color: var(--text-dim);
    border: 1px solid var(--border); border-radius: var(--radius-pill);
    padding: 6px 12px; font-family: var(--font-mono); font-size: var(--fs-label);
    cursor: pointer; transition: all var(--dur-spring-soft) var(--spring-soft);
  }
  .variant-pill:hover { color: var(--text); border-color: var(--accent); }
  .variant-pill[aria-pressed="true"] {
    background: var(--accent-soft); color: var(--accent); border-color: var(--accent);
  }
  .frame {
    border-radius: var(--radius-device);
    background: var(--accent-grad);
    padding: 16px;
    box-shadow: 0 10px 32px rgba(0,0,0,0.35);
  }
  .frame iframe {
    width: 100%; height: 520px; border: 0;
    border-radius: var(--radius-card);
    background: #FFF;
  }
  @media (max-width: 720px) {
    .frame iframe { height: 420px; }
  }
</style>
```

- [ ] **Step 3: Write `VariantTable.astro`**

```astro
---
interface Variant { name: string; purpose: string; }
interface Props { variants: Variant[]; }
const { variants } = Astro.props;
---
<section class="variants">
  <h2>Variants</h2>
  <table>
    <thead><tr><th>name</th><th>purpose</th></tr></thead>
    <tbody>
      {variants.map((v) => (
        <tr><td><code>{v.name}</code></td><td>{v.purpose}</td></tr>
      ))}
    </tbody>
  </table>
</section>

<style>
  .variants { margin: 24px 0; }
  h2 { font-size: var(--fs-h2); margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--border); font-size: var(--fs-small); color: var(--text-dim); vertical-align: top; }
  th { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
  td code { font-family: var(--font-mono); color: var(--accent); }
</style>
```

- [ ] **Step 4: Write `StatesList.astro`**

```astro
---
interface State { name: string; rule: string; }
interface Props { states: State[]; }
const { states } = Astro.props;
---
<section class="states">
  <h2>States</h2>
  <dl>
    {states.map((s) => (
      <>
        <dt><code>{s.name}</code></dt>
        <dd>{s.rule}</dd>
      </>
    ))}
  </dl>
</section>

<style>
  .states { margin: 24px 0; }
  h2 { font-size: var(--fs-h2); margin: 0 0 12px; }
  dl { display: grid; grid-template-columns: 160px 1fr; gap: 6px 20px; margin: 0; }
  dt { font-family: var(--font-mono); color: var(--accent); font-size: var(--fs-small); }
  dd { color: var(--text-dim); font-size: var(--fs-small); margin: 0; }
</style>
```

- [ ] **Step 5: Write `TokensList.astro`**

```astro
---
import { loadTokenMap, resolveToken } from '@/lib/token-resolve';
interface Props { refs: string[]; }
const { refs } = Astro.props;
const map = await loadTokenMap('src/content/tokens');
const rows = refs.map((ref) => ({ ref, resolved: resolveToken(map, ref) }));
---
<section class="tokens">
  <h2>Tokens Used</h2>
  <ul class="tokens-list">
    {rows.map((r) => (
      <li>
        <code>{r.ref}</code>
        {r.resolved ? (
          <span class="val">
            <span class="chip" style={`background: ${r.resolved.value};`} aria-hidden="true"></span>
            {r.resolved.value}
          </span>
        ) : (
          <span class="miss">missing</span>
        )}
      </li>
    ))}
  </ul>
</section>

<style>
  .tokens { margin: 24px 0; }
  h2 { font-size: var(--fs-h2); margin: 0 0 12px; }
  .tokens-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
  .tokens-list li { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-chip); }
  .tokens-list code { font-family: var(--font-mono); color: var(--text); font-size: 12px; }
  .val { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); }
  .chip { width: 18px; height: 18px; border-radius: 4px; border: 1px solid var(--border); }
  .miss { color: var(--danger); font-family: var(--font-mono); font-size: 11px; }
</style>
```

- [ ] **Step 6: Write `RelatedList.astro`**

```astro
---
import { getCollection } from 'astro:content';
interface Props { slugs: string[]; }
const { slugs } = Astro.props;
const all = await getCollection('components');
const entries = slugs
  .map((s) => all.find((e) => e.data.slug === s))
  .filter(Boolean) as Awaited<ReturnType<typeof getCollection<'components'>>>;
const base = import.meta.env.BASE_URL;
---
{entries.length > 0 && (
  <section class="related">
    <h2>Related</h2>
    <div class="list">
      {entries.map((e) => (
        <a href={`${base}/system/components/${e!.data.slug}/`.replace(/\/+/g, '/')}>
          <span class="name">{e!.data.name}</span>
          <span class="cat">{e!.data.category}</span>
        </a>
      ))}
    </div>
  </section>
)}

<style>
  .related { margin: 24px 0; }
  h2 { font-size: var(--fs-h2); margin: 0 0 12px; }
  .list { display: flex; flex-wrap: wrap; gap: 10px; }
  a {
    display: flex; flex-direction: column; gap: 4px;
    padding: 12px 16px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius-card);
    transition: border-color var(--dur-ui) var(--ease-out-quart);
  }
  a:hover { border-color: var(--accent); }
  .name { font-weight: 600; color: var(--text); }
  .cat { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.06em; }
</style>
```

- [ ] **Step 7: Write `src/pages/system/components/[slug].astro`**

```astro
---
import Layout from '@/components/Layout.astro';
import { getCollection } from 'astro:content';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ComponentDemo from '@/components/system/ComponentDemo.astro';
import VariantTable from '@/components/system/VariantTable.astro';
import StatesList from '@/components/system/StatesList.astro';
import TokensList from '@/components/system/TokensList.astro';
import RelatedList from '@/components/system/RelatedList.astro';

export async function getStaticPaths() {
  const entries = await getCollection('components');
  return entries.map((entry) => ({
    params: { slug: entry.data.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();
const base = import.meta.env.BASE_URL;

// Resolve MDX file path for ComponentDemo to read sibling .demo.html.
// entry.id is the Astro-internal filename relative to the collection root
// (e.g., "button.mdx"), which is authoritative even if data.slug differs.
const projectRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const mdxFile = resolve(projectRoot, 'src/content/components', entry.id);
---
<Layout title={`${entry.data.name} · System`}>
  <nav class="crumb">
    <a href={`${base}/system/`.replace(/\/+/g, '/')}>System</a>
    <span> / </span>
    <a href={`${base}/system/components/`.replace(/\/+/g, '/')}>Components</a>
    <span> / </span>
    <span class="cur">{entry.data.name}</span>
  </nav>
  <header class="head" style={`view-transition-name: system-component-${entry.data.slug};`}>
    <div class="title-row">
      <h1>{entry.data.name}</h1>
      <div class="meta">
        <span class={`status ${entry.data.status}`}>{entry.data.status}</span>
        <span class="cat">{entry.data.category}</span>
      </div>
    </div>
    {entry.data.figmaFrame && (
      <a class="figma" href={entry.data.figmaFrame} target="_blank" rel="noopener">Open in Figma ↗</a>
    )}
  </header>

  {entry.data.demoFile && (
    <ComponentDemo demoPath={entry.data.demoFile} mdxFile={mdxFile} variants={entry.data.variants} />
  )}

  <article class="prose"><Content /></article>

  {entry.data.variants.length > 0 && <VariantTable variants={entry.data.variants} />}
  {entry.data.states.length > 0 && <StatesList states={entry.data.states} />}
  {entry.data.tokens.length > 0 && <TokensList refs={entry.data.tokens} />}
  {entry.data.relatedComponents.length > 0 && <RelatedList slugs={entry.data.relatedComponents} />}
</Layout>

<style>
  .crumb { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-dim); margin: 24px 0 6px; }
  .crumb a { color: var(--text-dim); }
  .crumb a:hover { color: var(--accent); }
  .crumb .cur { color: var(--text); }
  .head { margin: 6px 0 24px; }
  .title-row { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
  h1 { font-size: var(--fs-h1); letter-spacing: var(--ls-h1); margin: 6px 0; }
  .meta { display: flex; gap: 8px; }
  .status { font-family: var(--font-mono); font-size: var(--fs-label); padding: 2px 8px; border: 1px solid var(--border); border-radius: var(--radius-chip); color: var(--text-dim); }
  .status.stable { color: var(--ok); border-color: color-mix(in srgb, var(--ok) 40%, transparent); }
  .status.draft { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 40%, transparent); }
  .cat { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.06em; }
  .figma { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--accent); text-decoration: underline; display: inline-block; margin-top: 6px; }
  .prose { color: var(--text-dim); max-width: 68ch; line-height: var(--lh-body); margin: 24px 0; }
  .prose :global(h2), .prose :global(h3) { color: var(--text); margin: 1.4em 0 0.5em; }
  .prose :global(p) { margin: 0.8em 0; max-width: 68ch; }
  .prose :global(code) { font-family: var(--font-mono); font-size: 0.88em; background: var(--surface-hover); border: 1px solid var(--border); padding: 1px 5px; border-radius: 4px; color: var(--text); }
</style>
```

- [ ] **Step 8: Write `src/pages/system/components/index.astro`**

```astro
---
import Layout from '@/components/Layout.astro';
import { getCollection } from 'astro:content';
const entries = await getCollection('components');
const base = import.meta.env.BASE_URL;
---
<Layout title="Components · System">
  <nav class="crumb">
    <a href={`${base}/system/`.replace(/\/+/g, '/')}>System</a>
    <span> / </span>
    <span class="cur">Components</span>
  </nav>
  <header class="head">
    <h1>Components</h1>
    <p class="sub">{entries.length}개 atomic 컴포넌트 (Button · Card · Chip · BottomNav · BottomSheet).</p>
  </header>
  <div class="grid">
    {entries.map((e) => (
      <a class="card" data-component-card
         href={`${base}/system/components/${e.data.slug}/`.replace(/\/+/g, '/')}
         style={`view-transition-name: system-component-${e.data.slug};`}>
        <span class="cat">{e.data.category}</span>
        <span class="name">{e.data.name}</span>
        <span class={`status ${e.data.status}`}>{e.data.status}</span>
      </a>
    ))}
  </div>
</Layout>

<style>
  .crumb { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-dim); margin: 24px 0 6px; }
  .crumb a { color: var(--text-dim); }
  .crumb .cur { color: var(--text); }
  .head h1 { font-size: var(--fs-h1); letter-spacing: var(--ls-h1); margin: 6px 0 6px; }
  .head .sub { color: var(--text-dim); margin: 0 0 24px; max-width: 60ch; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
  .card {
    display: flex; flex-direction: column; gap: 8px;
    padding: 18px 20px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius-card);
    transition: transform var(--dur-spring-soft) var(--spring-soft), border-color var(--dur-spring-soft) var(--spring-soft);
  }
  .card:hover { transform: translateY(-2px); border-color: var(--accent); }
  .cat { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.08em; }
  .name { font-size: var(--fs-h3); color: var(--text); font-weight: 600; }
  .status { font-family: var(--font-mono); font-size: 10px; padding: 2px 7px; align-self: flex-start; border-radius: var(--radius-chip); border: 1px solid var(--border); }
  .status.stable { color: var(--ok); border-color: color-mix(in srgb, var(--ok) 40%, transparent); }
  .status.draft { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 40%, transparent); }
</style>
```

- [ ] **Step 9: Run tests, expect PASS**

```bash
pnpm run test:e2e -- system && pnpm run build
```

Expected: all system E2E tests pass; build Complete.

- [ ] **Step 10: Commit Phase 3**

```bash
git add docs/designs/components/ \
        sprint-gallery/src/components/system/ \
        sprint-gallery/src/pages/system/components/ \
        sprint-gallery/tests/e2e/system.spec.ts
git commit -m "feat(design): 5 components + demos + renderers

- MDX frontmatter-driven components: button, card, chip, bottom-nav,
  bottom-sheet. Each ships with a standalone .demo.html for iframe
  srcdoc preview; variants are switched via data-variant attr +
  srcdoc reinjection
- ComponentDemo wraps the demo in a device-frame gradient card
- VariantTable, StatesList, TokensList (with resolved values),
  RelatedList helper components
- /system/components list + /system/components/:slug detail routes
- view-transition-name on card ↔ detail for shared-element
- E2E coverage for list count, iframe visibility, variant toggle,
  tokens resolution"
```

---

## Phase 4 — Integration (Commit 4)

### Task 12: System home + patterns empty + sidebar

**Files:**
- Create: `sprint-gallery/src/pages/system/index.astro`
- Create: `sprint-gallery/src/pages/system/patterns/index.astro`
- Create: `sprint-gallery/src/components/system/SystemSidebar.astro`

- [ ] **Step 1: `sprint-gallery/src/components/system/SystemSidebar.astro`**

```astro
---
import { getCollection } from 'astro:content';
const foundations = (await getCollection('foundations')).sort((a, b) => a.data.order - b.data.order);
const components = (await getCollection('components')).sort((a, b) => a.data.name.localeCompare(b.data.name));
const base = import.meta.env.BASE_URL;
const p = (s: string) => `${base}/${s}`.replace(/\/+/g, '/');
---
<aside class="sys-sidebar" aria-label="System navigation">
  <section>
    <h4><a href={p('system/foundations/')}>Foundations</a></h4>
    <ul>
      {foundations.map((e) => (
        <li><a href={p(`system/foundations/${e.data.key}/`)}>{e.data.name}</a></li>
      ))}
    </ul>
  </section>
  <section>
    <h4><a href={p('system/components/')}>Components</a></h4>
    <ul>
      {components.map((e) => (
        <li><a href={p(`system/components/${e.data.slug}/`)}>{e.data.name}</a></li>
      ))}
    </ul>
  </section>
  <section>
    <h4><a href={p('system/patterns/')}>Patterns</a></h4>
    <p class="empty">coming soon</p>
  </section>
</aside>

<style>
  .sys-sidebar { position: sticky; top: 72px; padding-right: 16px; border-right: 1px solid var(--border); max-height: calc(100vh - 80px); overflow-y: auto; width: var(--rail-width); }
  section { margin-bottom: 24px; }
  h4 { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px; font-weight: 500; }
  h4 a { color: var(--text-faint); }
  h4 a:hover { color: var(--text); }
  ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
  li a { display: block; padding: 5px 8px; margin-left: -8px; border-radius: 6px; color: var(--text-dim); font-size: var(--fs-small); transition: background var(--dur-ui) var(--ease-out-quart), color var(--dur-ui) var(--ease-out-quart); }
  li a:hover { background: var(--surface); color: var(--text); }
  .empty { font-family: var(--font-mono); font-size: 11px; color: var(--text-faint); margin: 0; padding: 5px 8px 5px 0; }
  @media (max-width: 720px) { .sys-sidebar { display: none; } }
</style>
```

- [ ] **Step 2: `sprint-gallery/src/pages/system/index.astro`**

```astro
---
import Layout from '@/components/Layout.astro';
import SystemSidebar from '@/components/system/SystemSidebar.astro';
import { getCollection } from 'astro:content';
const foundations = (await getCollection('foundations')).sort((a, b) => a.data.order - b.data.order);
const components = await getCollection('components');
const base = import.meta.env.BASE_URL;
const p = (s: string) => `${base}/${s}`.replace(/\/+/g, '/');
---
<Layout title="System">
  <div class="layout">
    <SystemSidebar />
    <main>
      <header class="hero">
        <p class="eyebrow">ZZEM Design System</p>
        <h1>Foundations and components — single source of truth.</h1>
        <p class="sub">
          Design tokens live in <a href="https://github.com/wrtn-corp/wds-tokens" target="_blank" rel="noopener">wds-tokens</a>,
          patterns live in <code>docs/designs/</code>, and this browser renders both.
        </p>
      </header>

      <section>
        <div class="section-head">
          <h2>Foundations</h2>
          <a class="more" href={p('system/foundations/')}>See all →</a>
        </div>
        <div class="grid">
          {foundations.map((e) => (
            <a class="card" href={p(`system/foundations/${e.data.key}/`)}>
              <span class="key">{e.data.key}</span>
              <span class="name">{e.data.name}</span>
              <span class="desc">{e.data.description}</span>
            </a>
          ))}
        </div>
      </section>

      <section>
        <div class="section-head">
          <h2>Components</h2>
          <a class="more" href={p('system/components/')}>See all →</a>
        </div>
        <div class="grid">
          {components.map((e) => (
            <a class="card" href={p(`system/components/${e.data.slug}/`)}
               style={`view-transition-name: system-component-${e.data.slug};`}>
              <span class="cat">{e.data.category}</span>
              <span class="name">{e.data.name}</span>
              <span class={`status ${e.data.status}`}>{e.data.status}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  </div>
</Layout>

<style>
  .layout { display: grid; grid-template-columns: var(--rail-width) 1fr; gap: 48px; }
  @media (max-width: 720px) { .layout { grid-template-columns: 1fr; } }
  main { min-width: 0; }
  .hero { margin: 32px 0 40px; }
  .eyebrow { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-faint); letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 10px; }
  .hero h1 { font-size: var(--fs-display); line-height: var(--lh-display); letter-spacing: var(--ls-display); margin: 0 0 12px; max-width: 18ch; }
  .hero .sub { color: var(--text-dim); max-width: 60ch; margin: 0; line-height: var(--lh-lead); font-size: var(--fs-lead); }
  .hero a { color: var(--accent); text-decoration: underline; }
  section { margin: 32px 0; }
  .section-head { display: flex; justify-content: space-between; align-items: baseline; margin: 0 0 14px; }
  h2 { font-size: var(--fs-h2); margin: 0; }
  .more { font-family: var(--font-mono); font-size: var(--fs-small); color: var(--text-dim); }
  .more:hover { color: var(--accent); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
  .card {
    display: flex; flex-direction: column; gap: 6px;
    padding: 18px 20px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius-card);
    transition: transform var(--dur-spring-soft) var(--spring-soft), border-color var(--dur-spring-soft) var(--spring-soft);
  }
  .card:hover { transform: translateY(-2px); border-color: var(--accent); }
  .key, .cat { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.08em; }
  .name { font-size: var(--fs-h3); color: var(--text); font-weight: 600; }
  .desc { font-size: var(--fs-small); color: var(--text-dim); }
  .status { font-family: var(--font-mono); font-size: 10px; padding: 2px 7px; align-self: flex-start; border-radius: var(--radius-chip); border: 1px solid var(--border); }
  .status.stable { color: var(--ok); border-color: color-mix(in srgb, var(--ok) 40%, transparent); }
  .status.draft { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 40%, transparent); }
</style>
```

- [ ] **Step 3: `sprint-gallery/src/pages/system/patterns/index.astro`**

```astro
---
import Layout from '@/components/Layout.astro';
const base = import.meta.env.BASE_URL;
const deferred = [
  'Feed Grid', 'Profile Header', 'Settings Screen', 'Profile Edit',
  'Other User Profile', 'Home Screen', 'Detail View',
];
---
<Layout title="Patterns · System">
  <nav class="crumb">
    <a href={`${base}/system/`.replace(/\/+/g, '/')}>System</a>
    <span> / </span>
    <span class="cur">Patterns</span>
  </nav>
  <header class="head">
    <h1>Patterns</h1>
    <p class="sub">Screen-level compositions made of components. Coming post-MVP.</p>
  </header>
  <section class="deferred">
    <h2>Planned</h2>
    <ul>
      {deferred.map((p) => <li>{p}</li>)}
    </ul>
    <p class="note">
      Track the roadmap in <code>docs/superpowers/specs/2026-04-23-design-system-v2-design.md</code>
      § Follow-ups.
    </p>
  </section>
</Layout>

<style>
  .crumb { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-dim); margin: 24px 0 6px; }
  .crumb a { color: var(--text-dim); }
  .crumb .cur { color: var(--text); }
  .head h1 { font-size: var(--fs-h1); letter-spacing: var(--ls-h1); margin: 6px 0 6px; }
  .head .sub { color: var(--text-dim); margin: 0 0 32px; }
  .deferred ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; padding: 0; list-style: none; margin: 0 0 20px; }
  .deferred li { padding: 12px 14px; background: var(--surface); border: 1px dashed var(--border); border-radius: var(--radius-card); font-size: var(--fs-small); color: var(--text-dim); }
  .note { font-family: var(--font-mono); font-size: var(--fs-label); color: var(--text-faint); }
  .note code { color: var(--text-dim); }
</style>
```

- [ ] **Step 4: Verify routes**

```bash
pnpm run build
```

Expected: `/system/`, `/system/patterns/` additional routes built. Site now has 3 new top-level pages.

---

### Task 13: TopBar link + SearchPalette extension + E2E

**Files:**
- Modify: `sprint-gallery/src/components/TopBar.astro`
- Modify: `sprint-gallery/src/components/SearchPalette.tsx`
- Modify: `sprint-gallery/tests/e2e/system.spec.ts`
- Modify: `sprint-gallery/tests/e2e/a11y.spec.ts`

- [ ] **Step 1: Extend `TopBar.astro` with a "System" link**

Replace the `<div class="spacer"></div>` line with:

```astro
  <div class="spacer"></div>
  <a href={`${import.meta.env.BASE_URL}/system/`.replace(/\/+/g, '/')} class="sys-link">System</a>
```

Append to the existing `<style>` block (inside the `</style>` closing tag):

```css
  .sys-link {
    font-family: var(--font-mono); font-size: var(--fs-label);
    color: var(--text-dim); padding: 6px 10px; border-radius: var(--radius-chip);
    transition: color var(--dur-ui) var(--ease-out-quart);
  }
  .sys-link:hover { color: var(--accent); }
```

- [ ] **Step 2: Extend `SearchPalette.tsx`**

Current `SearchPalette` takes a `data` prop shaped `{ slug, title, tags, prototypes }[]`. Add optional system entries with `type` discriminator. First read current file to confirm exact shape, then extend.

Open `sprint-gallery/src/components/SearchPalette.tsx` and update the data type to allow an additional item type. Specifically:
- Add a new field `type?: 'sprint' | 'component' | 'foundation'` (default behavior stays `sprint`)
- Render entries with a small `[component]` / `[foundation]` label if type differs

Concretely, find the `interface` or type that describes an item (something like `SearchItem` or inline in props) and add:

```typescript
type: 'sprint' | 'component' | 'foundation';
href?: string; // direct URL for non-sprint items
```

Then update the click handler to navigate to `href` if present, else fall back to existing sprint navigation.

(If the current file doesn't define a clear interface, add one; keep the change minimal.)

Then in `src/pages/index.astro`, extend the `searchData` array with components and foundations:

```astro
---
import Layout from '@/components/Layout.astro';
import Timeline from '@/components/Timeline.astro';
import SprintPanel from '@/components/SprintPanel.astro';
import SearchPalette from '@/components/SearchPalette.tsx';
import { collectSprints } from '@/lib/collect-sprints';
import { SPRINTS_DIR } from '@/lib/paths';
import { getCollection } from 'astro:content';

const sprints = await collectSprints(SPRINTS_DIR);
const components = await getCollection('components');
const foundations = await getCollection('foundations');
const base = import.meta.env.BASE_URL;

const searchData = [
  ...sprints.map((s) => ({
    type: 'sprint' as const,
    slug: s.slug,
    title: s.title,
    tags: s.tags,
    prototypes: s.prototypes.map((p) => p.title),
  })),
  ...components.map((c) => ({
    type: 'component' as const,
    slug: c.data.slug,
    title: c.data.name,
    tags: [c.data.category, c.data.status],
    prototypes: [],
    href: `${base}/system/components/${c.data.slug}/`.replace(/\/+/g, '/'),
  })),
  ...foundations.map((f) => ({
    type: 'foundation' as const,
    slug: f.data.key,
    title: f.data.name,
    tags: [f.data.key],
    prototypes: [],
    href: `${base}/system/foundations/${f.data.key}/`.replace(/\/+/g, '/'),
  })),
];
---
<Layout title="ZZEM Sprints">
  <a href="#stream" class="skip-link">Skip timeline navigation</a>
  <div class="layout">
    <Timeline sprints={sprints} />
    <div class="stream" id="stream" tabindex="-1">
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

  .skip-link {
    position: absolute;
    left: 16px; top: -40px;
    background: var(--surface); color: var(--text);
    border: 1px solid var(--accent); border-radius: var(--radius-chip);
    padding: 8px 14px;
    font-family: var(--font-mono); font-size: var(--fs-label);
    z-index: 100;
    transition: top var(--dur-ui) var(--ease-out-quart);
  }
  .skip-link:focus {
    top: 12px;
    outline: 2px solid var(--accent); outline-offset: 2px;
  }

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

- [ ] **Step 3: Update `SearchPalette.tsx` to navigate to `href` when present**

Open the existing `sprint-gallery/src/components/SearchPalette.tsx`, locate the click / select handler, and change the navigation logic from hardcoded sprint URL to:

```tsx
const href = item.href ?? `${base}/sprints/${item.slug}/`.replace(/\/+/g, '/');
window.location.href = href;
```

Also add a small label next to items whose `type !== 'sprint'`:

```tsx
{item.type && item.type !== 'sprint' && (
  <span className="palette-type">{item.type}</span>
)}
```

(Exact class and styling depends on existing palette; keep it minimal — ~12 lines of edits total.)

- [ ] **Step 4: Add new E2E test cases to `tests/e2e/system.spec.ts`**

```typescript
  test('TopBar System link navigates to /system/', async ({ page }) => {
    await page.goto('');
    await page.locator('a.sys-link').click();
    await expect(page).toHaveURL(/\/system\/?$/);
  });

  test('/system home shows foundations + components sections', async ({ page }) => {
    await page.goto('system/');
    const sections = page.locator('main > section');
    await expect(sections).toHaveCount(2);
  });

  test('/system/patterns renders empty state with deferred list', async ({ page }) => {
    await page.goto('system/patterns/');
    const deferred = page.locator('.deferred li');
    await expect(deferred).toHaveCount(7);
  });
```

- [ ] **Step 5: Extend `tests/e2e/a11y.spec.ts` routes array**

Change the `routes` const from:

```typescript
const routes = ['', 'sprints/ugc-platform-002/', 'prototypes/ugc-platform-002/app-001/'];
```

to:

```typescript
const routes = [
  '',
  'sprints/ugc-platform-002/',
  'prototypes/ugc-platform-002/app-001/',
  'system/',
  'system/foundations/color/',
  'system/components/button/',
  'system/patterns/',
];
```

- [ ] **Step 6: Full suite**

```bash
pnpm run test && pnpm run test:e2e && pnpm run build
```

Expected: all green. If an axe violation surfaces on a new route, fix before committing — the earlier gallery redesign encountered and resolved many of these (mostly color-contrast), so the tokens carry correct defaults.

---

### Task 14: README + memory/template updates + Phase 4 commit

**Files:**
- Create: `docs/designs/README.md`
- Modify: `~/.claude/projects/-Users-zachryu-dev-work-zzem-orchestrator/memory/feedback_prototype_quality.md`
- Modify: `~/.claude/projects/-Users-zachryu-dev-work-zzem-orchestrator/memory/reference_component_patterns.md`
- Modify: `~/.claude/projects/-Users-zachryu-dev-work-zzem-orchestrator/memory/MEMORY.md` (if descriptions changed)
- Grep: `sprint-orchestrator/templates/` for references to `component-patterns.md`, update to point at new structure

- [ ] **Step 1: Write `docs/designs/README.md`**

```markdown
# docs/designs/

Single source of truth for ZZEM design patterns. Rendered at `/system/` on the deployed gallery.

## Layout

```
docs/designs/
├── README.md                        ← this file
├── _archive/
│   └── component-patterns-2026-04-09.md   ← legacy monolith, preserved for history
├── foundations/                     ← Zod collection 'foundations'
│   ├── color.mdx
│   ├── typography.mdx
│   ├── spacing.mdx
│   ├── radius.mdx
│   ├── motion.mdx
│   └── elevation.mdx
├── components/                      ← Zod collection 'components'
│   ├── button.mdx + button.demo.html
│   ├── card.mdx + card.demo.html
│   ├── chip.mdx + chip.demo.html
│   ├── bottom-nav.mdx + bottom-nav.demo.html
│   └── bottom-sheet.mdx + bottom-sheet.demo.html
└── patterns/                        ← Zod collection 'patterns' (empty in MVP)
    └── .gitkeep
```

## For agents

**Read frontmatter, not body.** Every `.mdx` file has Zod-validated frontmatter that describes the component machine-readably: `name`, `slug`, `category`, `tokens`, `variants`, `states`, `relatedComponents`. The MDX body is supplementary prose for humans.

Schemas: `sprint-gallery/src/content/config.ts`.

## For humans

Open the deployed browser: `https://zach-wrtn.github.io/zzem-orchestrator/system/`. Foundations have per-category renderers (swatch grid for color, specimen table for typography, curve players for motion, etc.); components have iframe demos with variant pill toggles.

## For contributors

**Adding a component:**
1. Create `components/<slug>.mdx` with frontmatter per `src/content/config.ts` schema (Zod will fail your build if you miss fields).
2. Create `components/<slug>.demo.html` — standalone HTML, no external CSS. The file reads `URLSearchParams(location.search).get('variant')` if it declares variants.
3. `pnpm run build` — Astro auto-generates the route.

**Adding a foundation:** same shape, renderer slot-in by `key` enum value (add to `src/components/system/[Key]Foo.astro` + wire in `src/pages/system/foundations/[key].astro` renderers map).

## Tokens

Token values live in the external `wds-tokens` repo (DTCG format). `sprint-gallery/scripts/sync-tokens.ts` copies them into `sprint-gallery/src/content/tokens/` at build time. Reference tokens by dotted path in MDX frontmatter (`wds.color.purple.500`); the renderers resolve them via `src/lib/token-resolve.ts`.
```

- [ ] **Step 2: Grep `sprint-orchestrator/templates/` for legacy references**

```bash
grep -rn "component-patterns.md" sprint-orchestrator/templates/ || echo "no references"
```

For each match, edit the file and change `docs/designs/component-patterns.md` to `docs/designs/README.md` (or `docs/designs/components/*.mdx` if the context specifically calls for per-component files). Keep the edit minimal — 1-2 lines per file typically.

- [ ] **Step 3: Update memory `feedback_prototype_quality.md`**

Open `~/.claude/projects/-Users-zachryu-dev-work-zzem-orchestrator/memory/feedback_prototype_quality.md`. Replace the phrase "component-patterns.md 필수 참조" with:

```
docs/designs/components/*.mdx 필수 참조 (구조화된 frontmatter) + 배포된 /system/ 브라우저 시각 확인
```

Adjust surrounding text as needed so it flows naturally. Keep the `Why:` and `How to apply:` structure intact.

- [ ] **Step 4: Update memory `reference_component_patterns.md`**

Open `~/.claude/projects/-Users-zachryu-dev-work-zzem-orchestrator/memory/reference_component_patterns.md`. Rewrite description + body to point at the new structure:

```markdown
---
name: component-patterns-v2
description: docs/designs/ = Zod-validated MDX collections (foundations, components, patterns). Rendered at /system/. wds-tokens가 토큰 값, docs/designs가 패턴.
type: reference
---

`docs/designs/` 하위 3개 collection. 각 엔트리는 Zod frontmatter(agent-consumable) + MDX body(human-readable).

- **foundations/** — color, typography, spacing, radius, motion, elevation. 각 `tokenSource`로 wds-tokens JSON 파일을 가리킴.
- **components/** — atomic UI (button, card, chip, bottom-nav, bottom-sheet in MVP). `variants`, `states`, `tokens` 프론트매터 + sibling `.demo.html`.
- **patterns/** — screen-level composition. MVP에 비어있음; follow-up에서 7개 패턴 포팅 예정 (Feed Grid, Profile Header, Settings Screen, Profile Edit, Other User Profile, Home Screen, Detail View).

시각 브라우저: `/system/`. Legacy `component-patterns.md`는 `_archive/`에 보존됨.

스키마: `sprint-gallery/src/content/config.ts`.
```

- [ ] **Step 5: Update `MEMORY.md` index line for reference_component_patterns**

Current line:
```
- [reference_component_patterns.md](reference_component_patterns.md) — Figma 역추출 컴포넌트 패턴 라이브러리 (docs/designs/component-patterns.md)
```

Replace with:
```
- [reference_component_patterns.md](reference_component_patterns.md) — docs/designs/ = 3 Zod MDX collections; rendered at /system/. wds-tokens = 토큰 값, docs/designs = 패턴.
```

- [ ] **Step 6: Commit Phase 4**

```bash
git add docs/designs/README.md \
        sprint-gallery/src/pages/system/ \
        sprint-gallery/src/components/system/SystemSidebar.astro \
        sprint-gallery/src/components/TopBar.astro \
        sprint-gallery/src/components/SearchPalette.tsx \
        sprint-gallery/src/pages/index.astro \
        sprint-gallery/tests/e2e/system.spec.ts \
        sprint-gallery/tests/e2e/a11y.spec.ts \
        sprint-orchestrator/templates/
git commit -m "feat(design): /system home + nav + search + archive legacy

- /system home with hero + Foundations grid + Components grid
- /system/patterns empty state listing 7 deferred compositions
- SystemSidebar left-nav with expanded tree of foundations + components
- TopBar 'System' link next to search
- SearchPalette extended to index components and foundations with
  direct href navigation; type label shown when not 'sprint'
- docs/designs/README.md documents the three-collection structure
- Template pointers updated from component-patterns.md to new paths
- Memory updates for reference_component_patterns and
  feedback_prototype_quality"
```

Memory file edits (steps 3, 4, 5) are outside the repo and not part of this git commit. Apply them separately as a manual step tracked via TodoWrite.

---

## Phase 5 — Finalization

### Task 15: Manual verify + PR

- [ ] **Step 1: Local build and preview**

```bash
cd sprint-gallery
pnpm run build && pnpm run preview
```

Open `http://localhost:4321/zzem-orchestrator/system/` and manually verify:
- `/system/` home shows Foundations (6) + Components (5) grids
- `/system/foundations/color` swatch grid renders with actual wds-tokens colors
- `/system/foundations/motion` ball slides across when "play" clicked
- `/system/components/button` shows iframe demo + variant pills (primary/secondary/destructive), clicking a pill updates the iframe
- `/system/components/button` Tokens Used section shows resolved hex values with small color chips
- `/system/patterns/` empty state with 7 deferred patterns
- TopBar "System" link navigates to `/system/` from any page
- `⌘K` search finds "Button", "Color", "UGC" side-by-side
- Mobile 720px: sidebar hidden; vertical stack of foundation + component cards

- [ ] **Step 2: Full suite**

```bash
pnpm run test && pnpm run test:e2e
```

Expected green.

- [ ] **Step 3: Push branch**

```bash
cd /Users/zachryu/.superset/worktrees/zzem-orchestrator/chore/enhance-prototype
git push -u origin feat/design-system-v2
```

- [ ] **Step 4: Open PR**

```bash
gh pr create --base main --title "Design System v2: Zod MDX collections + /system visual browser" --body "$(cat <<'EOF'
## Summary
- Restructures \`docs/designs/\` from a single \`component-patterns.md\` into three Zod-validated Astro Content Collections (foundations, components, patterns).
- Renders those collections at \`/system/\` on sprint-gallery with per-category foundation renderers and iframe-based component demos.
- External \`wds-tokens\` repo remains the authoritative token value source; \`scripts/sync-tokens.ts\` copies DTCG JSON into \`src/content/tokens/\` at build time.
- MVP ports Foundations (6) + 5 atomic components (Button, Card, Chip, BottomNav, BottomSheet); 7 screen-level patterns are documented as post-MVP follow-ups.
- Zero runtime JS dependencies added.

## Design docs
- Spec: \`docs/superpowers/specs/2026-04-23-design-system-v2-design.md\`
- Plan: \`docs/superpowers/plans/2026-04-23-design-system-v2.md\`

## Test plan
- [x] vitest green (token-resolve tests added)
- [x] Playwright E2E green (new \`system.spec.ts\` + extended \`a11y.spec.ts\`)
- [x] Build Complete (23+ pages — 6 foundations + 5 components + 3 system indices added)
- [ ] Manual: /system home, foundations/color swatches, foundations/motion play, components/button iframe + variant toggle, /system/patterns empty state
- [ ] Manual: TopBar System link + ⌘K finds component/foundation entries
- [ ] Manual: mobile 720px sidebar hidden + cards stack

## Post-merge follow-ups
- Port 7 screen-level patterns (Feed Grid, Profile Header, Settings Screen, Profile Edit, Other User Profile, Home Screen, Detail View).
- Promote \`validate-tokens.ts\` from warn to error (currently tolerant).
- Per-variant \`demoFile\` split (currently single demo + query-param switching).
- MemeApp actual-implementation diff tab on component detail pages.
- Icon foundation with SVG pipeline.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Post-merge canary**

After the PR merges and \`gallery.yml\` finishes:
1. `https://zach-wrtn.github.io/zzem-orchestrator/system/`
2. `https://zach-wrtn.github.io/zzem-orchestrator/system/foundations/color/`
3. `https://zach-wrtn.github.io/zzem-orchestrator/system/components/button/`

All three must resolve within ~2s and show the expected renderings.

---

## Rollback

```bash
git checkout main
git revert <merge-sha>
git push origin main
```

Static redeploy completes in ~90s. The `docs/designs/` reorganization is destructive (legacy md moved); revert restores the original file and removes the new content collections. No data loss — the legacy md content is identical to what was preserved in `_archive/`.
