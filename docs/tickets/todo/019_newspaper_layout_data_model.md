# 019 — Newspaper Layout Data Model

## Goal
Extend the database schema to support a WYSIWYG grid-based newspaper layout with configurable paper format, fill direction, and block positioning (row/column spanning).

## Background
Currently `newspapers` has no layout configuration, and `newspaper_blocks` uses a simple `sort_order` integer. The new layout model requires:
- Paper format (A4 = 2 columns × 4 rows, A5 = 2 columns × 2 rows)
- Fill direction (column-first or row-first)
- Each block placed at a specific grid position with row/column spanning

## Schema Changes

### `newspapers` table — add `layout_config` JSONB column

```jsonc
{
  "format": "A4",          // "A4" | "A5"
  "fill_direction": "column" // "column" | "row"
}
```

Defaults:
- `format`: `"A4"`
- `fill_direction`: `"column"`

### `newspaper_blocks` table — add positioning columns

| Column | Type | Notes |
|--------|------|-------|
| `grid_col` | integer | 0-based column index (0 or 1) |
| `grid_row` | integer | 0-based row index (0–3 for A4, 0–1 for A5) |
| `col_span` | integer | Columns the block spans (1 or 2), default 1 |
| `row_span` | integer | Rows the block spans (1–4), default 1 |

The `sort_order` column is **retained** as a fallback ordering mechanism when auto-filling the grid.

## Grid Definitions

| Format | Columns | Rows | Total Cells |
|--------|---------|------|-------------|
| A4     | 2       | 4    | 8           |
| A5     | 2       | 2    | 4           |

## Migration Tasks
1. Add `layout_config JSONB NOT NULL DEFAULT '{"format":"A4","fill_direction":"column"}'` to `newspapers`
2. Add `grid_col INTEGER`, `grid_row INTEGER`, `col_span INTEGER NOT NULL DEFAULT 1`, `row_span INTEGER NOT NULL DEFAULT 1` to `newspaper_blocks`
3. Backfill existing blocks: assign `grid_col`/`grid_row` based on current `sort_order` (left-to-right, top-to-bottom, A4 format)
4. Add CHECK constraints: `col_span IN (1,2)`, `row_span BETWEEN 1 AND 4`, `grid_col IN (0,1)`, `grid_row BETWEEN 0 AND 3`

## TypeScript Types to Add

In `src/lib/supabase/types.ts` (auto-generated) — plus manual types in `src/modules/newspaper/lib/types.ts`:

```ts
export type PaperFormat = 'A4' | 'A5'
export type FillDirection = 'column' | 'row'

export interface LayoutConfig {
  format: PaperFormat
  fill_direction: FillDirection
}

export interface GridPosition {
  grid_col: number
  grid_row: number
  col_span: number
  row_span: number
}
```

## Actions to Update
- `updateNewspaper` — accept and persist `layout_config` fields
- `addBlock` — accept optional grid position; if omitted, auto-place using fill algorithm
- `updateBlock` — accept grid position updates
- `moveBlock` — **deprecate** in favour of grid drag-and-drop (can keep for now)

## Auto-fill Algorithm (server-side helper)
When a block is added without explicit position, find the next available cell by scanning in fill_direction order (column-first: top→bottom, left→right; row-first: left→right, top→bottom), respecting existing block spans.

## Acceptance Criteria
- [ ] Migration applies cleanly on production
- [ ] Existing newspapers retain their blocks in correct visual order after backfill
- [ ] TypeScript types regenerated and updated
- [ ] `updateNewspaper` can change format and fill_direction
- [ ] `addBlock` auto-places new blocks without overlap
- [ ] CHECK constraints prevent invalid positions
