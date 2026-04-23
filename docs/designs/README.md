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

**Read frontmatter, not body.** Every `.mdx` file has Zod-validated frontmatter that describes the component machine-readably: `name`, `key`, `category`, `tokens`, `variants`, `states`, `relatedComponents`. The MDX body is supplementary prose for humans.

Note: the URL-param field is named `key` (not `slug`), because Astro 4 reserves `slug` as a built-in field on content collection entries. URL shape is still `/system/components/<key>/`.

Schemas: `sprint-gallery/src/content/config.ts`.

## For humans

Open the deployed browser: `https://zach-wrtn.github.io/zzem-orchestrator/system/`. Foundations have per-category renderers (swatch grid for color, specimen table for typography, curve players for motion, etc.); components have iframe demos with variant pill toggles.

## For contributors

**Adding a component:**
1. Create `components/<key>.mdx` with frontmatter per `src/content/config.ts` schema (Zod will fail your build if you miss fields).
2. Create `components/<key>.demo.html` — standalone HTML, no external CSS. The file reads `URLSearchParams(location.search).get('variant')` if it declares variants.
3. `pnpm run build` — Astro auto-generates the route.

**Adding a foundation:** same shape, renderer slot-in by `key` enum value (add to `src/components/system/[Key]Foo.astro` + wire in `src/pages/system/foundations/[key].astro` renderers map).

## Tokens

Token values live in the external `wds-tokens` repo (private, `github.wrtn.club/pepper/wds-tokens`, DTCG format). Because CI has no access to that host, the synced JSONs are **committed as a snapshot** at `sprint-gallery/src/content/tokens/`. When `wds-tokens` changes:

1. Run `pnpm run sync:tokens` locally (defaults to `~/dev/work/wds-tokens`, override via `WDS_TOKENS_DIR`).
2. Inspect the diff, commit, open a PR.

Reference tokens by dotted path in MDX frontmatter (`wds.color.purple.500`); the renderers resolve them via `src/lib/token-resolve.ts`. Missing references render as a `missing` badge — `pnpm run test:e2e -- a11y` scans for these in light + dark themes.
