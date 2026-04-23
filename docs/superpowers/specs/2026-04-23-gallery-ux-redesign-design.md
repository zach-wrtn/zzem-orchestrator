# Sprint Gallery — UX Redesign Design Spec

**Date:** 2026-04-23
**Status:** Approved for implementation planning
**Owner:** zach-wrtn
**Supersedes visual/interaction portions of:** `2026-04-15-sprint-gallery-design.md` (data model and deploy pipeline unchanged)

## Summary

Redesign the Sprint Gallery UX from a Linear-changelog stream with modal previews into a **seamless snap-stream** where each sprint is a vertical snap-panel and prototype cards expand into fullscreen previews via shared-element View Transitions. Visuals move to a warm off-black palette with coral accent, Pretendard-first Korean typography with a larger readable scale, and a four-curve motion system (140ms default, 220/320ms spring hand-offs, 100ms reduced-motion fallback). Preview previously lived inside a modal; it becomes its own route (`/prototypes/<slug>/<id>/`), unlocking slack/notion deep-linking to a specific prototype.

## Goals

- Eliminate the "click → modal feels detached" friction by turning the prototype card itself into the preview (shared-element transition).
- Raise Korean text readability — Pretendard Variable font stack, 15px/1.75 body, 68ch line length, word-break: keep-all.
- Make the site feel motion-aware without adding a JS animation library (Astro built-in ViewTransitions + CSS + Web Animations API only).
- Preserve all existing deep links (`/`, `/sprints/<slug>/`). Add one new public URL (`/prototypes/<slug>/<id>/`).
- Mobile becomes a first-class experience, not a degraded desktop: horizontal story-style swipe between prototypes, vertical snap between sprints.
- Keep information density for the 70% internal audience; reserve "showcase" energy for the hero of each sprint panel (30% use case).

## Non-Goals

- No change to the underlying data model (`collect-sprints.ts`, `sprint-config.yaml`).
- No change to `capture-screenshots.ts` / `copy-prototypes.ts` build pipeline.
- No authentication, CMS, or authoring UI.
- No multi-mode toggle ("Showcase" vs "Console"); single coherent experience.
- No bundle-size-heavy animation libraries (Framer Motion, GSAP rejected).

## Audience & Priority

70% internal team (information density, deep-link sharing, keyboard navigation) · 30% exec/lead showcase (hero impact, first-scroll delight). This weighting rules out a dual-mode approach (maintaining two designs double the cost for the 30% side) and confirms a single experience that is dense by default but cinematic at the hero of each sprint panel.

## Information Architecture & Key Screens

### Home (`/`)

Vertical snap stream (`scroll-snap-type: y mandatory`). Each sprint is one `SprintPanel`. A panel contains:
- Hero prototype (enlarged card) — primary visual of the sprint
- Sprint meta (title, date range, status, tags)
- 2-line summary (PRD first paragraph)
- Side grid of up to 5 remaining prototypes
- "+N more" chip if the sprint has > 6 prototypes (links to detail)

Left rail is a scrubber, not a table of contents. An `IntersectionObserver` on each panel marks the corresponding rail node active. Clicking a rail node `scrollIntoView({ behavior: 'smooth' })`.

### Sprint detail (`/sprints/<slug>/`)

Deep-read surface for PRD / Report / Retrospective markdown. Hero prototype carries the shared-element transition from the home panel. Full prototype grid below the hero. This URL is what exists today and is preserved so any Notion/Slack link continues to resolve.

### Prototype preview (`/prototypes/<slug>/<id>/`) — NEW

Fullscreen `PreviewShell`: iPhone-class device chrome centered in a coral→violet gradient backdrop with backdrop blur. The iframe loads the existing `prototype.html` (unchanged). ESC, browser back, and background tap all dismiss, and the transition reverses. Because this is a real URL (not a modal), any prototype can be pasted into Slack and opens directly — this is the primary new affordance for the 70% internal audience.

### Mobile

Same three surfaces, oriented 90°:
- Vertical swipe = between sprint panels (snap-y)
- Horizontal swipe = between prototypes within a sprint (story pattern, snap-x, progress bar at top)
- Tap on a prototype = device-frame fullscreen (same `PreviewShell`)

Rendered only under `@media (max-width: 720px)` via `MobileStoryStack`; desktop continues to use the side grid.

## Visual System

### Color tokens

Warm off-black base, single coral accent, one gradient used only for showcase moments and the preview backdrop.

| token | value | role |
|---|---|---|
| `--bg` | `#0F0D0C` | page background |
| `--surface` | `#14110F` | card fill |
| `--surface-hi` | `#1B1512` | hover/active fill |
| `--border` | `#2A231D` | dividers, chips |
| `--text` | `#EDEDEF` | primary |
| `--text-dim` | `#B4ADA5` | body |
| `--text-faint` | `#8B857E` | labels, meta |
| `--accent` | `#FF7A63` | coral — single accent |
| `--accent-grad` | `linear-gradient(135deg, #FF7A63, #4B2F88)` | hero/preview backdrop only |
| `--accent-soft` | `rgba(255,122,99,0.14)` | chip fills, focus rings |
| `--ok` / `--warn` / `--danger` | `#7AC79A` / `#E5A458` / `#E57373` | status tokens |

Light theme is the same ramp inverted with `bg: #FBF7F2` (warm cream). `prefers-color-scheme` auto-detect + manual toggle (existing `ThemeToggle`).

Contrast: text/bg ≥ 7:1 (AAA), accent/surface ≥ 4.7:1 (AA). Focus ring: 2px coral + 2px offset.

### Typography

Language-specific font responsibility — Pretendard first so Korean always resolves to Pretendard; Inter handles Latin. JetBrains Mono is Latin-only; Korean labels fall back to sans (no monospace Korean).

```
--font-sans: 'Pretendard Variable', 'Pretendard', 'Inter', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
```

Pretendard delivered via subset CDN (~60KB): `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css`.

Scale:

| role | size / line-height | weight | usage |
|---|---|---|---|
| display | 48 / 1.02 | 700 | hero title, 1× per page |
| h1 | 32 / 1.2 | 600 | sprint/detail page title |
| h2 | 20 / 1.35 | 600 | section title |
| h3 | 16 / 1.4 | 600 | card title |
| lead | 17 / 1.65 | 400 | panel summary, section lead |
| body | 15 / 1.75 | 400 | PRD paragraphs, default text |
| small | 13 / 1.6 | 400 | captions |
| label (mono) | 12 / 1.4 | 500 | meta, dates, tags (Latin only) |

Korean readability tooling: `word-break: keep-all`, `overflow-wrap: break-word`, `text-wrap: balance` on headings, `font-variant-numeric: tabular-nums` on numbers, `-webkit-font-smoothing: antialiased`, `text-size-adjust: 100%`, body `max-width: 68ch`.

### Radius & spacing

Radius scale: 4 (input) · 8 (tag) · 12 (card) · 22 (device frame) · 999 (pill).
Spacing steps: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px.

### Elevation

Three steps only. Hover and active use coral-tinted shadows, not neutral grey — this is where A's precision and C's warmth meet.

- `e0` resting — no shadow
- `e1` hover — `0 2px 8px rgba(0,0,0,0.35)`
- `e2` active — `0 14px 32px rgba(255,122,99,0.22), 0 2px 8px rgba(0,0,0,0.5)`

## Motion & Transition System

### Four curves, one per job

| curve | duration | use |
|---|---|---|
| `ease-out-quart` | 140ms | default UI — hover, reveal, text color change |
| `spring-soft` (overshoot 1.03) | 220ms | card hover lift, theme toggle swap |
| `spring-handoff` (overshoot 1.05) | 320ms | prototype card expand, preview open, modal open |
| `linear-fast` | 100ms | `prefers-reduced-motion: reduce` fallback |

Spring curves are expressed as `cubic-bezier()` where feasible and as Web Animations API `linear()` timing when overshoot is required.

### Implementation

- Astro's built-in `<ViewTransitions />` component enables route transitions for every page swap.
- `transition:name="proto-<slug>-<id>"` is set on the `PrototypeCard` anchor AND on the `PreviewShell`'s device-frame container. The browser matches and animates automatically. Same-name matching also handles the home ↔ detail hero.
- `ESC`, background tap, and `popstate` all trigger `history.back()` so the browser replays the reverse transition naturally.
- iframe `src` is injected on `astro:after-swap` (t ≈ 160ms into the transition), hidden behind the device-frame gradient plate so the card-to-iframe swap never flashes white.

### Scroll & hover

- Home vertical stream: `scroll-snap-type: y mandatory`, `scroll-snap-stop: always`.
- Rail activation: one `IntersectionObserver` on all panels updates `data-active` on the rail node with threshold 0.55.
- Card hover: `transform: translateY(-4px)` + 0.4deg tilt + coral box-shadow, all on `spring-soft 220ms`.
- Theme toggle: icon crossfade + color swap on `spring-soft 220ms`.

### Reduced-motion fallback

All curves collapse to `linear-fast 100ms`. Shared-element transitions fall back to cross-fade 80ms. Hover transforms drop; only color changes remain.

### Dependency cost

**Zero** runtime JS added. Astro ViewTransitions is already part of Astro; CSS + Web Animations API handle the rest.

## Components & File Structure

```
sprint-gallery/src/
├── pages/
│   ├── index.astro                          REFACTOR — snap stream
│   ├── sprints/[slug].astro                 REFACTOR — shared-element receiver
│   └── prototypes/[sprint]/[proto].astro    NEW — fullscreen preview route
├── components/
│   ├── Layout.astro                         REFACTOR — <ViewTransitions />, Pretendard
│   ├── TopBar.astro                         REFACTOR — scroll-aware logo
│   ├── Timeline.astro                       REFACTOR — IntersectionObserver scrubber
│   ├── SprintPanel.astro                    NEW — replaces SprintEntry
│   ├── SprintEntry.astro                    DELETE
│   ├── PrototypeCard.astro                  REFACTOR — transition:name, spring hover
│   ├── PreviewShell.astro                   NEW — device frame + iframe
│   ├── PreviewModal.tsx                     DELETE
│   ├── SearchPalette.tsx                    KEEP — style refresh only
│   ├── ThemeToggle.tsx                      KEEP
│   └── MobileStoryStack.astro               NEW — horizontal story swipe
├── lib/
│   ├── collect-sprints.ts                   KEEP
│   ├── paths.ts                             KEEP
│   ├── types.ts                             KEEP
│   └── motion.ts                            NEW — spring curves, WAAPI helpers, reduced-motion
└── styles/
    ├── tokens.css                           REPLACE (full)
    └── transitions.css                      NEW — ::view-transition-* + reduced-motion
```

### Component responsibilities

- **SprintPanel** — renders one snap panel (hero card + meta + summary + side grid + "+N more"). Does not know how hero is chosen; consumes `hero: true` as precomputed by `collect-sprints.ts`.
- **PrototypeCard** — does not know how it expands. It is an `<a href="/prototypes/...">` with `transition:name`; the browser handles the rest.
- **PreviewShell** — does not know how the user got here. Reads the URL, renders device chrome + iframe, and responds to `popstate`.
- **Timeline** — does not know the sprint data model. Receives `{slug, title, startDate, status}[]`; emits only DOM events via rail clicks.
- **motion.ts** — pure functions only. No DOM dependency except as parameter.
- **MobileStoryStack** — renders only below 720px. Desktop ignores it.

## Routes & Data Flow

### URL map

| URL | status | role |
|---|---|---|
| `/` | existing | home snap stream |
| `/sprints/<slug>/` | existing | detail — PRD/Report reader |
| `/prototypes/<slug>/<id>/` | **NEW** | fullscreen preview, shareable |
| `/prototypes/<slug>/app/<id>/prototype.html` | existing | raw iframe source (unchanged) |

All routes are prerendered at build time via `getStaticPaths`.

### Transition matching

One `transition:name` is reused across surfaces so the same DOM element carries the user between them:

- `proto-<slug>-<id>` — on the `PrototypeCard` in home/detail AND on the `PreviewShell` device frame. Card ↔ hero ↔ device frame is one element.
- `sprint-hero-<slug>` — on the hero card in home AND on the hero image in detail. Home ↔ detail is one element.

Forward transitions are driven by `<a>` navigation. Reverse transitions are driven by `history.back()` (ESC, background tap, browser back) and replay automatically.

## Edge Cases

| case | handling |
|---|---|
| Thumbnail missing | Falls through existing capture pipeline; if still missing, show `accent-grad` plate with balanced-wrap prototype title. |
| Sprint has >6 prototypes | Panel shows hero + 5 side cards + `+N more` chip linking to detail. |
| Long summary | Panel clamps to 2 lines with fade; detail shows full text. |
| Long sprint title | Display scale with `text-wrap: balance`; rail label truncates past 16 chars with `…`. |
| View Transitions unsupported (Firefox) | Astro falls back to cross-fade automatically; shared-element is lost but navigation works. |
| Reduced-motion | All curves → `linear-fast 100ms`; shared-element → cross-fade 80ms; hover transforms off. |
| iframe load failure | `PreviewShell` observes `onerror` and shows "Open in new tab" fallback link. |
| Legacy deep link | `/sprints/<slug>/` URL is preserved; no redirects needed. |
| iOS snap momentum | `scroll-snap-type: y mandatory` + `-webkit-overflow-scrolling: touch`; if many sprints cause jitter, relax to `proximity`. |

## Accessibility

- Keyboard navigation: `↑/↓` moves between panels via the rail tablist (`role="tablist"`), `Enter` opens hero, `ESC` closes preview.
- Focus management: entering `PreviewShell` traps focus on the close control; leaving restores focus to the source card.
- Skip link: "Skip timeline navigation" present on home (WCAG 2.4.1).
- Contrast: text/bg AAA, accent/surface AA (enforced by the token set).
- iframe labeling: `title={\`${proto.title} prototype\`}` on every `PreviewShell` iframe.
- Route change announcements: Astro `astro:after-swap` updates a `aria-live="polite"` region with "Viewing prototype: X".

## Testing & Acceptance Criteria

### Test matrix

| layer | tool | coverage |
|---|---|---|
| Unit | vitest | existing `collect-sprints` tests plus new `motion.ts` pure-function tests |
| Visual regression | puppeteer + pixelmatch | 4 route snapshots (home, detail, preview, mobile 360w); extends existing `capture-screenshots.ts` pipeline; fail over 0.3% diff |
| E2E | playwright (NEW devDep) | golden flow — home → hero click → preview enter → ESC → return; runs on Chromium |
| A11y | `@axe-core/playwright` | 3 routes scanned; critical + serious violations = 0 |
| Cross-browser | manual | Firefox cross-fade fallback verified once, recorded in PR |
| Reduced-motion | playwright emulation | E2E variant with `prefers-reduced-motion: reduce` set |
| Performance | lighthouse (manual first, CI later) | home LCP < 1.5s, CLS < 0.02 |
| Deep-link | manual | `/sprints/ugc-platform-002/` resolves post-merge from actual Notion/Slack entry |

### Acceptance criteria

**Visual**
- Home stream, detail, preview match the approved mockups at the structural and hierarchical level.
- Color, radius, type scale match the tokens 1:1.
- Three core motion behaviors (card hover, theme toggle, preview expand) exhibit spring timing.

**Functional**
- Card → preview visibly animates as one element (shared element).
- `ESC` / background tap / browser-back replay the reverse transition to the origin card.
- Every legacy `/sprints/<slug>/` URL resolves; no external link is broken.
- Direct navigation to `/prototypes/<slug>/<id>/` renders the preview; browser-back returns to `/`.
- `⌘K` search behavior is unchanged (only styling updated).

**Accessibility**
- Full keyboard path: home → preview → return.
- `axe-core` scan: 0 critical, 0 serious.
- `prefers-reduced-motion: reduce` removes spring and replaces with cross-fade.
- Focus trap on preview; focus restoration on exit.

**Performance**
- Runtime JS bundle increase < 2KB.
- Home LCP < 1.5s local preview.
- Pretendard loads as the dynamic-subset only (~60KB).

**Compatibility**
- Chrome, Edge, Safari 18+: shared-element active.
- Firefox: cross-fade fallback, behaviorally identical.
- iOS Safari 17+: snap-y and device frame render correctly.

## Rollout Plan

### Branch & commits

Single feature branch `feat/gallery-ux-redesign`. Four sequential commits, each individually reviewable and rollback-able:

1. **`chore(gallery): new tokens + type scale`** — replace `tokens.css`, inject Pretendard CDN in `Layout.astro`. Existing components inherit new values via CSS vars. Low risk. Visual-regression baseline is captured once from `main` before the branch starts; every subsequent commit's PR is diffed against that baseline, not commit-to-commit.
2. **`feat(gallery): snap stream + panel layout`** — add `SprintPanel`, delete `SprintEntry`, rewrite `index.astro` as snap stream, refactor `Timeline` to use IntersectionObserver, add `MobileStoryStack`. Medium risk — biggest layout shift.
3. **`feat(gallery): preview route + device shell`** — add `/prototypes/[sprint]/[proto].astro`, add `PreviewShell`, convert `PrototypeCard` from button-opens-modal to `<a>` with `transition:name`, delete `PreviewModal`. Medium risk — introduces new URL.
4. **`feat(gallery): view transitions + motion`** — add `<ViewTransitions />`, add `transitions.css`, add `motion.ts`, wire reduced-motion fallback, add aria-live announcement. Low risk — additive.

### Deploy & verify

- Merge triggers existing `gallery.yml` workflow; GitHub Pages publishes in ~90s.
- Post-deploy manual verification: load `/`, `/sprints/ugc-platform-002/`, `/prototypes/ugc-platform-002/app-001/`.
- Rollback: `git revert <merge-sha>` → redeploy (~1 minute for a static site).

### Memory updates

Update `feedback_prototype_viewer.md` with the new viewer architecture (snap stream, shared-element preview, new URL shape) so future sprints know this is the target pattern.

## Cost & Dependencies

- **Runtime dependencies added:** 0
- **DevDependencies added:** `playwright`, `@playwright/test`, `@axe-core/playwright`, `pixelmatch`
- **CDN:** Pretendard Variable dynamic-subset (~60KB gzip)
- **Estimated effort:** ~2 weeks, dominated by motion fine-tuning and cross-browser verification

## Open Questions

None at this stage. All six design sections approved interactively via the brainstorming visual companion.
