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

## Plan

1. **Database migration** — add `page_index integer NOT NULL DEFAULT 0` to `newspaper_blocks`; add `header` to `block_type` enum
2. **Types** — add `page_index?: number` to `EditionBlock`; add `page_index: number` to `Block` in grid editor
3. **Actions** — `addBlock` reads `page_index` from formData; `moveBlockToCell` accepts + persists `page_index`; overlap checks filter by same page; `generateEdition` includes `page_index` in snapshot
4. **Grid editor** — track `pageCount` in local state; render pages as vertically stacked grids inside one `DndContext`; droppable IDs encode page (`cell-${page}-${row}-${col}`); per-page "Remove Page" button (only last page, only when empty); "Add Page" button after last page
5. **Preview** — `EditionBlock` carries `page_index`; group blocks by page; each group after page 0 gets `break-before: page` (print) + on-screen divider
6. **Header widget** — `header` block type with optional location/tagline config; `fetchData` fetches weather if location set; preview renders masthead row

## Acceptance Criteria
- [x] `newspaper_blocks` has `page_index` column (migration applied)
- [x] Grid editor shows pages stacked with add/remove page controls
- [x] Blocks can be placed on any page independently
- [x] Edition preview groups blocks by page with print page breaks
- [x] `NewspaperHeader` is a proper optional block (not auto-injected)
- [x] Existing single-page newspapers work unchanged (page_index defaults to 0)

## Summary

Added multi-page support to the newspaper builder. Key changes:

- **Migration** (`add_page_index_to_newspaper_blocks`): added `page_index integer NOT NULL DEFAULT 0` to `newspaper_blocks`; added `header` to the `block_type` enum
- **Header/Masthead widget** (`src/modules/newspaper/lib/widgets/header/`): new widget with optional weather and tagline; renders the newspaper masthead as a placeable block; registered in the widget registry
- **Actions** (`actions.ts`): `addBlock` reads `page_index` from formData; `moveBlockToCell` accepts `pageIndex` param and persists it; overlap checks are now page-scoped; `generateEdition` includes `page_index` in the content snapshot
- **Grid editor** (`newspaper-grid-editor.tsx`): tracks `pageCount` (derived from blocks + optional extra pages); pages render as vertically stacked grids inside one `DndContext`; droppable cell IDs encode page (`cell-{page}-{row}-{col}`); each page has its own "Add Block" button; "Add Page" button appends an empty canvas; last empty page can be removed
- **Preview** (`newspaper-preview.tsx`): blocks grouped by `page_index`; pages after 0 get `breakBefore: page` for print; on-screen page dividers shown; masthead auto-renders on page 0 only if no header block is present

Completed: 2026-03-09
