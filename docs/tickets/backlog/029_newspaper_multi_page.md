# 029 — Newspaper Multi-Page Support

## Goal
Allow newspapers to span multiple pages, each with its own independent grid canvas. Pages render sequentially in the preview with proper print page breaks between them.

## Background
Currently all blocks live on a single grid canvas. A4 format gives 2×4 = 8 cells. Once those are full there's no overflow. Multi-page support lets users build longer editions (e.g. page 1 = headlines + weather, page 2 = articles, page 3 = todos/calendar).

## Database

Add a `page_index` column (integer, default 0, NOT NULL) to `newspaper_blocks`. No new table needed — blocks already know their grid position; page_index just identifies which canvas they belong to.

```sql
ALTER TABLE newspaper_blocks ADD COLUMN page_index integer NOT NULL DEFAULT 0;
```

Update RLS policies if needed (they're instance-based, no change expected).

## Grid Editor Changes

- The editor renders pages **vertically stacked**, each as a separate grid canvas
- Between pages: a visual divider with a "Page N" label and an "Add Page" / "Remove Page" button
- Dragging blocks between pages: drag-and-drop target cells on adjacent pages (or simpler: cut/paste via context menu)
- "Add Page" appends a new empty canvas at the end
- "Remove Page" is only allowed if the page has no blocks (or moves blocks to previous page)
- Page count is derived from `max(page_index) + 1` across all blocks — no separate pages table needed

## Preview Changes

- Group `edition.content` blocks by `page_index` (stored in the edition snapshot)
- Render each group inside a `<div>` with `print:break-before-page` (except page 0)
- On screen: a horizontal rule / "— Page N —" divider between pages
- The masthead (title + date) only appears once at the top of page 0

## Edition Snapshot Changes

`generateEdition` already snapshots all blocks. Add `page_index` to each block's snapshot entry so the preview knows how to group them.

## `NewspaperHeader` Widget

With multi-page support the `NewspaperHeader` widget (currently unused after the auto-header revert) becomes useful: users can place it explicitly on page 1 as a block. This requires:
- Adding `header` to the `block_type` enum in a migration
- Registering `HeaderWidgetDef` in the widget registry
- `fetchData` for header: fetches weather if a location is configured
- Config: optional `{ location?: string, tagline?: string }`
- Preview: renders the full masthead row (day, date, weather, tagline)

## New Files
- Migration: `add_page_index_to_newspaper_blocks`
- (If header widget): migration to add `header` to `block_type` enum
- `src/modules/newspaper/lib/widgets/header/index.ts`, `config.tsx`, `preview.tsx`, `thumbnail.tsx`

## Files to Update
- `src/modules/newspaper/components/newspaper-grid-editor.tsx` — multi-page canvas UI
- `src/modules/newspaper/components/newspaper-preview.tsx` — page grouping + print breaks
- `src/app/(app)/i/[slug]/newspaper/actions.ts` — pass `page_index` in `addBlock`, `generateEdition` snapshot

## Acceptance Criteria
- [ ] `newspaper_blocks` has `page_index` column (migration applied)
- [ ] Grid editor shows pages stacked with add/remove page controls
- [ ] Blocks can be placed on any page independently
- [ ] Edition preview groups blocks by page with print page breaks
- [ ] `NewspaperHeader` is a proper optional block (not auto-injected)
- [ ] Existing single-page newspapers work unchanged (page_index defaults to 0)
