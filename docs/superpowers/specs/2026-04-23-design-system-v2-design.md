# Design System v2 — Design Spec

**Date:** 2026-04-23
**Status:** Approved for implementation planning
**Owner:** zach-wrtn
**Successor work after:** `2026-04-23-gallery-ux-redesign-design.md` (PR #20)

## Summary

Restructure `docs/designs/` from a single 336-line `component-patterns.md` into agent-consumable Astro Content Collections (MDX + Zod frontmatter) and render those collections as a visual design-system browser at `/system/` on the sprint-gallery site. Tokens stay in the external `wds-tokens` repo (DTCG JSON) and are synced in at build time. Patterns (7 screen-level compositions) get a scaffold but no content in MVP — the MVP ports Foundations entirely + 5 atomic components (Button, Card, Chip, BottomNav, BottomSheet).

## Goals

- Single source of truth, two renderers: `docs/designs/*.mdx` + `wds-tokens/*.json` consumed by both design-engineer subagents (frontmatter only) and humans (visual browser).
- Schema-validated frontmatter via Astro Content Collections + Zod — drift between agent spec and visual renderer is a build failure.
- Per-category URLs: `/system/foundations/:key`, `/system/components/:name`, `/system/patterns/:name` — everything deep-linkable like PR #20's `/prototypes/<slug>/<id>/`.
- MVP discipline: Foundations done in full (6 files); 5 atomic components done in full; 8 compositional patterns scaffolded as empty, documented as post-MVP.
- Zero runtime dependencies added. Astro Content Collections is built in; Zod comes with it.

## Non-Goals

- No changes to the `wds-tokens` repo. It remains the authoritative value source.
- No interactive props panel (Storybook-like). Visual browser is reference, not playground.
- No migration of screen-level patterns in MVP. Those 7 patterns (Feed Grid, Profile Header, Settings, Profile Edit, Other User Profile, Home Screen, Detail View) land post-MVP.
- No Icon foundation in MVP. `wds-tokens/primitive/icon.json` exists but icons need Figma-rendered SVGs, which is out of scope here; icon handling is a deferred foundation.
- No rewrite of existing gallery routes (`/`, `/sprints/<slug>/`, `/prototypes/<slug>/<id>/`).
- No Figma write-back or code-to-Figma sync.

## Audience

Agents (design-engineer during Phase 3 prototype generation, be-engineer for token reference) AND humans (FE engineers verifying patterns, designers reviewing rendered system) with equal weight. Single `docs/designs/*.mdx` file serves both — frontmatter for agents, MDX body for humans, and the `/system/` site for visual review.

## Architecture

### Layered data model

```
wds-tokens/ (external repo)                        ← authoritative VALUES
  primitive/{color,typography,spacing,radius,motion,elevation,icon}.json
  semantic/{light,dark,typography}.json
  component/{button,card,chip,...}.json            ← DTCG $type/$value format

docs/designs/ (repo root)                          ← authoritative PATTERNS
  README.md                                         ← structure + agent guide
  _archive/component-patterns-2026-04-09.md        ← legacy monolith
  foundations/                                      ← 6 MDX files in MVP
    color.mdx, typography.mdx, spacing.mdx, radius.mdx, motion.mdx, elevation.mdx
  components/                                       ← 5 MDX + 5 demo HTML in MVP
    button.mdx + button.demo.html
    card.mdx + card.demo.html
    chip.mdx + chip.demo.html
    bottom-nav.mdx + bottom-nav.demo.html
    bottom-sheet.mdx + bottom-sheet.demo.html
  patterns/                                         ← empty in MVP
    .gitkeep

sprint-gallery/src/content/                        ← consumed by Astro
  config.ts                                         ← Zod schemas for 3 collections
  foundations → ../../../docs/designs/foundations   ← committed symlink
  components  → ../../../docs/designs/components    ← committed symlink
  patterns    → ../../../docs/designs/patterns     ← committed symlink
  tokens/                                           ← gitignored; sync-tokens.ts fills
    primitive-color.json, primitive-spacing.json, ...
```

### Content collection schemas

```typescript
// sprint-gallery/src/content/config.ts
import { defineCollection, z } from 'astro:content';

export const collections = {
  foundations: defineCollection({
    type: 'content',
    schema: z.object({
      name: z.string(),
      key: z.enum(['color','typography','spacing','radius','motion','elevation']),
      description: z.string(),
      tokenSource: z.string(),           // e.g., 'primitive-color.json'
      order: z.number().default(99),
    }),
  }),

  components: defineCollection({
    type: 'content',
    schema: z.object({
      name: z.string(),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      category: z.enum(['layout','nav','surface','control','feedback']),
      status: z.enum(['stable','draft']).default('draft'),
      figmaFrame: z.string().url().optional(),
      tokens: z.array(z.string()).default([]),
      variants: z.array(z.object({
        name: z.string(),
        purpose: z.string(),
      })).default([]),
      states: z.array(z.object({
        name: z.string(),
        rule: z.string(),
      })).default([]),
      relatedComponents: z.array(z.string()).default([]),
      demoFile: z.string().optional(),
    }),
  }),

  patterns: defineCollection({
    type: 'content',
    schema: z.object({
      name: z.string(),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      purpose: z.string(),
      usesComponents: z.array(z.string()).default([]),
      figmaFrame: z.string().url().optional(),
    }),
  }),
};
```

### Token sync

`sprint-gallery/scripts/sync-tokens.ts` — runs as a prebuild step.
- Source: `~/dev/work/wds-tokens/` (configurable via `WDS_TOKENS_DIR`).
- Target: `sprint-gallery/src/content/tokens/*.json` (gitignored).
- Flat copy with prefix: `primitive-color.json`, `semantic-light.json`, `component-button.json`.
- Missing source → `console.warn` and `exit 0` (CI resilience).
- `pnpm build` sequence becomes: `sync:tokens && capture:screenshots && copy:prototypes && astro build`.

### Token reference resolver

`sprint-gallery/src/lib/token-resolve.ts` — flattens the synced tokens into a lookup map at import time.

```typescript
export function resolveToken(ref: string): ResolvedToken | null;
// 'wds.color.neutral.50' → { value: '#F7F8F9', source: 'primitive-color.json' }
// Returns null on miss (callers render "missing token" badge).
```

## Routes & Rendering

### Route map

```
/system                              — home grid (6 foundations + 5 components)
/system/foundations                  — list page (6 cards)
/system/foundations/:key             — foundation detail
/system/components                   — list page (5 cards, filter by category)
/system/components/:name             — component detail
/system/patterns                     — empty state in MVP ("Patterns coming soon")
/system/patterns/:name               — not yet routed in MVP
```

All routes prerendered via `getStaticPaths` from the collections.

### Foundation rendering — per-key specialized

```typescript
const renderers = {
  color: SwatchGrid,       // 3-layer stratified swatch grid
  typography: TypeSpecimen, // 10 scale specimen with Pretendard
  spacing: SpacingScale,    // horizontal bars with pixel counts
  radius: RadiusScale,      // square-to-pill progression
  motion: MotionPlayer,     // curve preview + "play" button triggers demo animation
  elevation: ElevationStack, // stacked shadows
};
```

Each foundation page: MDX body (guide prose) first, then the renderer pulls values from `src/content/tokens/${tokenSource}`.

### Component rendering — standard template

Component detail page sections: ComponentHeader → Preview (ComponentDemo iframe) → Anatomy (MDX body) → Variants (table) → States (list) → Tokens Used (resolved values) → Related.

`ComponentDemo.astro`:
- `<iframe srcdoc={...}>` loaded from `demoFile` contents (read at build time).
- Device frame reuse from `PreviewShell` — same 430-class width on desktop, full-bleed under 720px.
- `variants` become pill toggles above the iframe; clicking updates iframe's `?variant=<name>` query. Demo files read the query at runtime and apply variant-specific styles.
- `prefers-reduced-motion` propagates to iframe (inherited CSS media query).

### Shared-element transitions

`/system/components` card → `/system/components/button` detail uses `view-transition-name="system-component-${slug}"` on both surfaces. Same mechanism as PR #20's prototype preview transition.

### Navigation

- **Left sidebar** (sticky) — tree: Foundations / Components / Patterns, expanded by default. Hidden under 720px (hamburger toggle in TopBar).
- **Top breadcrumb** — `System / <Section> / <Entry>`.
- **`SearchPalette` extension** (existing ⌘K) — Components and Foundations added to search index alongside sprints and prototypes. Single palette covers everything.
- **TopBar link** — "System" entry next to the existing ⌘K button.

## Migration Plan

### MVP content

**Foundations (6 files):**
- `color.mdx`, `typography.mdx`, `spacing.mdx`, `radius.mdx`, `motion.mdx`, `elevation.mdx`
- Each contains a short guide (what this layer is, when to touch it) and frontmatter pointing to the corresponding `primitive-*.json`.

**Components (5 files + 5 demos):**

| File | Sourced from legacy | Atomic status |
|---|---|---|
| `button.mdx` | distilled from sections 3, 4, 5, 10 | yes |
| `card.mdx` | distilled from section 1 (card unit) + section 9 (generating/failed states absorbed here) | yes |
| `chip.mdx` | distilled from section 7 (category pills) + section 3 (tab indicator) | yes |
| `bottom-nav.mdx` | section 2 verbatim | yes |
| `bottom-sheet.mdx` | section 10 verbatim | yes |

Each component MDX:
- Frontmatter per schema above (name, slug, category, status, tokens, variants, states, demoFile)
- MDX body: `## Anatomy` / `## Usage` / `## Why it looks this way`
- Sibling `.demo.html`: standalone HTML page demonstrating the component with inline `<style>` (no token indirection — Figma-faithful hex values for reference stability).

**Patterns:** `.gitkeep` only. `/system/patterns` route renders an empty state listing the 7 deferred patterns with a note that they're post-MVP.

### Legacy file handling

`docs/designs/component-patterns.md` → moved to `docs/designs/_archive/component-patterns-2026-04-09.md` with a prepended "Moved" banner linking to the new structure. The monolith is preserved for historical diff but no longer authoritative.

### New README

`docs/designs/README.md` — structure overview, agent usage guide ("frontmatter is structured spec, body is human guide"), deep link to deployed `/system/`, contribution pointer ("add a new component as `<slug>.mdx` + `<slug>.demo.html`").

### Symlink setup

Three symbolic links, committed to git:
- `sprint-gallery/src/content/foundations` → `../../../docs/designs/foundations`
- `sprint-gallery/src/content/components`  → `../../../docs/designs/components`
- `sprint-gallery/src/content/patterns`    → `../../../docs/designs/patterns`

Rationale: `docs/designs/` is the path agents and memory already reference; moving content into `sprint-gallery/src/` breaks that. Symlinks preserve the source-of-truth location while giving Astro what it expects. Git stores symlinks as text (target path) — portable on macOS/Linux dev machines and CI (ubuntu-latest).

### Template / skill / memory updates (in-PR)

- `sprint-orchestrator/templates/*` referencing `docs/designs/component-patterns.md` → updated to point at `docs/designs/README.md` and `/system/`.
- Memory `reference_component_patterns.md` — description + body updated to describe MDX collection.
- Memory `feedback_prototype_quality.md` — "component-patterns.md 필수 참조" → "`docs/designs/components/*.mdx` + `/system/` 브라우저 필수 참조".

## Testing & Acceptance

### Test matrix (reuses existing infrastructure)

| layer | tool | coverage |
|---|---|---|
| Unit | vitest | `token-resolve.ts` (hit, miss, nested paths); `sync-tokens.ts` dry-run |
| Schema | Zod at build time | All collection entries validate; broken frontmatter fails build |
| E2E routes | Playwright | `/system`, `/system/foundations/color`, `/system/foundations/typography`, `/system/components/button`, `/system/components/bottom-sheet` render with expected sections |
| E2E demo | Playwright | `ComponentDemo` iframe renders; variant pill click updates iframe query; reduced-motion propagates |
| A11y | `@axe-core/playwright` | 5 new routes, critical + serious violations = 0. Extends the existing `a11y.spec.ts` route array |
| Visual regression | puppeteer + pixelmatch | `/system` home + 1 foundation + 1 component — baseline captured from this branch |
| Build validation | `validate-tokens.ts` | Every `components[*].tokens` ref resolves via `resolveToken`; unresolved refs → `console.warn` (not fail in MVP) |

### Acceptance criteria

**Visual**
- `/system` home renders 6 Foundations + 5 Components cards with correct counts.
- Each foundation route renders its dedicated renderer (`SwatchGrid` for color, `TypeSpecimen` for typography, etc.).
- Each component route renders header + demo iframe + MDX body + variants table + tokens list.
- `/system/patterns` renders empty state.

**Functional**
- Zod schema failure blocks `pnpm build` with a readable error.
- `pnpm sync:tokens` populates `src/content/tokens/*.json` from `wds-tokens`.
- Deep link to `/system/components/button` works from fresh load (no client-side routing dependency).
- `⌘K` search finds components and foundations by name.
- Shared-element transition animates between `/system/components` list card and detail page in Chrome/Edge/Safari 18+.

**Accessibility**
- Full keyboard nav: TopBar → SearchPalette → select "Button" → lands on `/system/components/button`.
- axe scan: 0 critical, 0 serious on all 5 new routes.
- Reduced-motion: shared-element transition collapses to cross-fade; `MotionPlayer` disables auto-play.

**Performance**
- JS bundle increase < 5KB.
- `/system` LCP < 1.5s local preview.
- Token JSON total (synced) < 100KB.

**Compatibility**
- Chrome/Edge 111+, Safari 18+: shared-element active.
- Firefox: cross-fade fallback, behaviorally identical.

## Rollout

### Single feature branch — `feat/design-system-v2`

Four sequential commits, each independently reviewable:

1. **`chore(design): scaffold content collections + Zod schema + symlinks`**
   - `sprint-gallery/src/content/config.ts` with three collections.
   - Three symlinks under `sprint-gallery/src/content/`.
   - `.gitignore` addition for `src/content/tokens/`.
   - Empty `docs/designs/{foundations,components,patterns}/` directories with `.gitkeep`.
   - Build still succeeds (no routes yet).

2. **`feat(design): foundations + sync-tokens + renderers`**
   - `sync-tokens.ts` + `token-resolve.ts` + unit tests.
   - 6 `foundations/*.mdx` files.
   - `SwatchGrid`, `TypeSpecimen`, `SpacingScale`, `RadiusScale`, `MotionPlayer`, `ElevationStack` renderers.
   - `/system/foundations/:key` route.
   - `/system/foundations` list page.

3. **`feat(design): 5 components + demos + renderers`**
   - 5 `components/*.mdx` files + 5 `.demo.html` files.
   - `ComponentDemo`, `VariantTable`, `StatesList`, `TokensList`, `RelatedList` components.
   - `/system/components/:name` route.
   - `/system/components` list page.

4. **`feat(design): /system home + nav + search + archive legacy`**
   - `/system` home (Foundations + Components grid).
   - `/system/patterns` empty state route.
   - Left sidebar nav component.
   - `SearchPalette` extended to index components and foundations.
   - TopBar "System" link.
   - `docs/designs/component-patterns.md` → `_archive/` with Moved banner.
   - `docs/designs/README.md` written.
   - Memory + template pointer updates.

### Deploy & verify

- Merge triggers `gallery.yml`; GH Pages deploys in ~90s.
- Manual post-deploy: load `/system/`, `/system/foundations/color`, `/system/components/button`.
- Rollback: `git revert <merge-sha>`.

## Cost & Dependencies

- **Runtime dependencies added:** 0
- **DevDependencies added:** 0 (vitest, playwright, axe, pixelmatch already present)
- **External:** requires `wds-tokens` repo present at `~/dev/work/wds-tokens/` (or `WDS_TOKENS_DIR` env) for `sync:tokens` to populate content. Local preview without it shows "tokens not synced" state — graceful.
- **Estimated effort:** ~1 week, dominated by renderer polish and E2E coverage.

## Follow-ups (explicit, not in this PR)

- Port 7 screen-level patterns (`patterns/feed-grid.mdx`, `profile-header.mdx`, `settings-screen.mdx`, `profile-edit.mdx`, `other-user-profile.mdx`, `home-screen.mdx`, `detail-view.mdx`). Each references existing atomic components via `usesComponents`.
- Add Icon foundation when an SVG pipeline for `Code Connect 아이콘` set (SettingStroke, MorehStroke, etc., ~22 icons) is defined.
- Promote `validate-tokens.ts` from warn to error.
- Per-variant `demoFile` (currently one demo file + query-string variant switching).
- MemeApp actual-implementation diff tab on component detail pages.
- `wds-tokens` DTCG parser strict mode (currently we tolerate any `$value`).

## Open Questions

None. All five design sections were approved interactively before this spec was written.
