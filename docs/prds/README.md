# PRDs

> **Moved to the standalone KB repo.**

Product PRDs are canonical in [`zach-wrtn/knowledge-base`](https://github.com/zach-wrtn/knowledge-base)
under the `products/` axis, organized in two layers:

## Two-Layer Model

| Layer | Path | Source of truth | Cardinality |
|-------|------|-----------------|-------------|
| **Overview** | `products/{product}/prd.md` | Hand-authored | 1 per product |
| **Feature PRD** | `products/active-prds/{notion-id}.md` | Notion mirror (auto-synced) | N per product |

- **Overview** (`products/{product}/prd.md`) — product-level summary, active-PRD index,
  scope/boundaries, sprint links. Its optional `active_prds[]` frontmatter array lists
  the Notion ids of currently 진행 중 feature PRDs mirrored under `active-prds/`.
- **Feature PRD mirror** (`products/active-prds/{notion-id}.md`) — full feature PRD body
  synced from Notion. Many per product (e.g., `ugc-platform` has 3 phases).

| Product | Overview path |
|---|---|
| ai-webtoon | `products/ai-webtoon/prd.md` |
| free-tab | `products/free-tab/prd.md` |
| ugc-platform | `products/ugc-platform/prd.md` |

## Read via skill

```
zzem-kb:read type=prd product=<product>        # overview
zzem-kb:read type=events product=<product>     # event spec
```

Feature PRD mirrors are referenced by Notion id from the overview's `active_prds[]`
frontmatter; read directly with the `Read` tool at the resolved path.

## Sync from Notion

```
zzem-kb:sync-prds-from-notion     # Notion DB → products/notion-prds.yaml snapshot
zzem-kb:sync-active-prds          # 진행 중 PRD body → products/active-prds/{notion-id}.md
```

See also: `.claude/skills/sprint/knowledge-base.md` for the full KB protocol.
