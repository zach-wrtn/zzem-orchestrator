# Sprint Gallery — Design Spec

**Date:** 2026-04-15
**Status:** Approved for implementation planning
**Owner:** zach-wrtn

## Summary

Deploy a historical, sprint-by-sprint browsable gallery of all prototypes produced by the ZZEM sprint orchestrator to GitHub Pages. UX modeled on Linear's changelog — a vertical timeline with a left-side date/sprint rail and a main column containing the sprint entry, hero prototype, PRD summary, and a grid of prototype cards. Previews use a hybrid pattern: static screenshot thumbnails on initial load, with click-to-expand modal iframes for live interaction.

## Goals

- Single source of truth for viewing every sprint's prototype output, organized chronologically
- Fast to browse even with dozens of sprints (thumbnail-first, lazy iframe)
- Zero manual deploy step — new sprints appear after a merge to `main`
- Low maintenance: sprint metadata lives next to the sprint artifacts (`sprint-config.yaml`)

## Non-Goals

- Not a general-purpose CMS; it only renders sprint artifacts produced by the orchestrator
- Not a design-handoff tool (Figma covers that)
- No authoring UI; metadata is edited as YAML/Markdown in the repo
- No authentication; the repo is public and the site is public

## Architecture

### Stack

- **Framework:** Astro (static output)
  - MDX for rendering `PRD.md`, `REPORT.md`, `retrospective/*`
  - Build-time filesystem glob for sprint discovery
  - Island architecture — only the iframe preview modal and ⌘K palette ship JS
- **Hosting:** GitHub Pages via `actions/deploy-pages`
- **Thumbnail capture:** Puppeteer (Chromium headless) in CI, hash-keyed cache

### Repo Layout

```
sprint-gallery/                    # new directory at repo root
├── src/
│   ├── pages/
│   │   ├── index.astro            # changelog timeline home
│   │   └── sprints/[slug].astro   # per-sprint detail page
│   ├── components/
│   │   ├── Timeline.astro
│   │   ├── SprintEntry.astro
│   │   ├── PrototypeCard.astro
│   │   ├── PreviewModal.tsx       # interactive island
│   │   └── SearchPalette.tsx      # ⌘K island
│   ├── lib/
│   │   └── collect-sprints.ts     # build-time filesystem scan
│   └── styles/tokens.css
├── public/
│   ├── prototypes/                # copied from sprint-orchestrator/sprints/*/prototypes/
│   └── thumbnails/                # puppeteer-generated PNGs, hash-named
├── scripts/
│   ├── capture-thumbnails.ts      # puppeteer runner with cache
│   └── copy-prototypes.ts         # copies prototype HTML into public/
├── astro.config.mjs
└── package.json
```

### Data Model

```ts
type Sprint = {
  slug: string                      // folder name, e.g. "free-tab-diversification"
  title: string                     // from sprint-config.yaml, fallback: slug humanized
  startDate: string                 // ISO date, from sprint-config.yaml or first commit
  endDate: string                   // ISO date, from REPORT.md commit or latest commit
  status: 'completed' | 'in-progress' | 'archived'
  summary: string                   // first paragraph of PRD.md (2–3 lines)
  tags: string[]
  prototypes: Prototype[]
  docs: {
    prd?: string
    report?: string
    retrospective?: string
  }
}

type Prototype = {
  id: string                        // subfolder name under prototypes/
  title: string                     // <title> of entry HTML, fallback: id humanized
  entry: string                     // relative path to entry HTML
  thumbnail: string                 // path to cached PNG under public/thumbnails/
  screens?: string[]                // additional screens if manifest present
}
```

### Build Pipeline

Invoked by `.github/workflows/gallery.yml` on push to `main` and on manual dispatch:

1. Checkout + pnpm install
2. `scripts/copy-prototypes.ts` — mirror `sprint-orchestrator/sprints/*/prototypes/` into `sprint-gallery/public/prototypes/`
3. `scripts/capture-thumbnails.ts` — for each prototype entry HTML, compute input hash; if cached PNG exists skip; else launch Puppeteer (1440x900 viewport), screenshot, save to `public/thumbnails/<hash>.png`
4. `astro build` — reads filesystem via `collect-sprints.ts`, renders timeline + detail pages
5. Upload `dist/` as Pages artifact, deploy

### Data Flow

```
sprint-orchestrator/sprints/*/
  ├── sprint-config.yaml  ─┐
  ├── PRD.md               ├─► collect-sprints.ts ──► Sprint[] ──► Astro pages
  ├── REPORT.md            │                                         │
  ├── retrospective/       │                                         ▼
  └── prototypes/<id>/ ────┴─► copy-prototypes.ts ──► public/ ──► iframe src
                                  │
                                  └─► capture-thumbnails.ts ──► public/thumbnails/
```

## UI

### Home `/` — Changelog Timeline

- **Left rail (sticky):** year/quarter headings with dot markers per sprint, scroll-synced via IntersectionObserver
- **Main column:** each sprint rendered as a large entry
  - Title (sprint name, humanized) + date range + status badge
  - Hero media: the prototype marked `hero: true` in `sprint-config.yaml`, or the first prototype if unset, rendered as a large 16:10 thumbnail
  - PRD summary (2–3 lines, collapsed; click to expand full MDX)
  - Tags chips
  - Prototype grid (3-up on desktop, 1-up on mobile)
  - Document links row: PRD, Report, Retrospective
- **Top bar:** logo/title left, ⌘K search right, theme toggle

### Sprint Detail `/sprints/<slug>`

- Hero section (title, dates, status, hero prototype)
- Tabs or stacked sections: Overview (PRD summary), Prototypes (full grid), Report, Retrospective — each section MDX rendered
- Persistent "back to timeline" link

### Hybrid Preview Interaction

1. Card shows static PNG thumbnail with prototype title
2. Hover → dim overlay + "Preview" CTA + "Open in new tab" icon
3. Click card → modal opens, iframe loads prototype entry HTML (sandbox attr), ESC closes
4. Icon click → opens prototype in new tab directly (bypass modal)

### Search (⌘K)

Raycast-style command palette: fuzzy match across sprint title, tags, prototype title. Results navigate to the timeline anchor or sprint detail.

### Design Tokens

- Background: `#08090A` (dark) / `#FFFFFF` (light)
- Text: neutral gray scale
- Accent: `#5E6AD2` (Linear purple)
- Fonts: Inter (UI), JetBrains Mono (metadata/dates)
- Radii: 12px cards, 8px thumbnails
- Theme: dark by default, toggle persists via localStorage, respects `prefers-color-scheme` on first load

## Error Handling & Edge Cases

- **Missing prototype entry HTML** — card shows "No preview available" placeholder, no iframe
- **Puppeteer capture failure (timeout/crash)** — log warning, use SVG placeholder; CI succeeds
- **Missing `sprint-config.yaml`** — auto-generate from folder name + git log; emit build warning
- **iframe load failure** — modal shows "Open in new tab" fallback button
- **Pages size approaching 1GB limit** — `copy-prototypes.ts` logs total size per sprint; manual cleanup when needed
- **`approval-status.yaml` with `approved: false`** — hidden by default; `?show=all` query param overrides (future)

## Testing

- Unit: `collect-sprints.ts` against fixture directories (missing config, malformed yaml, multi-prototype)
- Build smoke: GitHub Actions runs `astro build` on PRs that touch `sprint-gallery/` or `sprint-orchestrator/sprints/`
- Visual: manual check of deployed Pages site after first merge; no automated visual regression initially
- Thumbnail cache invalidation verified by changing a prototype HTML and confirming hash change triggers recapture

## Open Items / Backfill

- `sprint-config.yaml` schema extension — add the following fields:
  ```yaml
  title: "Free Tab Diversification"
  startDate: "2026-04-09"
  endDate: "2026-04-14"
  status: "completed"          # completed | in-progress | archived
  tags: ["ugc", "free-tab"]
  prototypes:
    - id: "main-app"
      hero: true
      title: "Free Tab main flow"
  ```
  Applied to `free-tab-diversification` as part of implementation; template updated at `sprint-orchestrator/templates/sprint-config.yaml`.
- Custom domain: deferred; default Pages URL `https://zach-wrtn.github.io/zzem-orchestrator/` is fine initially

## Decisions

| Area | Decision |
|---|---|
| Stack | Astro + MDX, static output |
| Hosting | GitHub Pages via Actions `deploy-pages` |
| Location | new `sprint-gallery/` directory at repo root |
| UX reference | Linear changelog (timeline + hero + cards) |
| Preview | hybrid — PNG thumbnail, click-to-iframe modal |
| Accent color | Linear purple `#5E6AD2` |
| Theme | dark by default, light toggle |
| Thumbnails | Puppeteer in CI, hash-keyed cache |
| Metadata | `sprint-config.yaml` single source, filesystem fallback |
| CI trigger | push to `main` + manual dispatch |
| Approval gating | show all sprints by default; `approval-status.yaml` honored later |
