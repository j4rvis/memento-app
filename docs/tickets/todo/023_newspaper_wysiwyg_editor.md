# 023 — Newspaper WYSIWYG Grid Editor

## Goal
Replace the current linear block list editor with a visual drag-and-drop grid editor that shows blocks in their actual newspaper layout positions, allowing direct manipulation of block placement and spans.

## Dependencies
- **Requires ticket 019** (grid positioning data model)

## Background
Currently the editor shows blocks as a vertical list with up/down move buttons. The new editor renders the actual 2-column grid (A4 or A5), lets users drag blocks between cells, resize spans, and see a live preview of the layout.

## Editor Layout

The editor page (`/i/[slug]/newspaper/[id]`) splits into two panels on large screens:
- **Left panel (editor):** interactive grid with drag-and-drop
- **Right panel (preview):** live preview of the newspaper layout

On mobile: tab between "Editor" and "Preview".

## Grid Editor Component (`NewspaperGridEditor`)

### Visual Grid
Render the grid as a CSS Grid matching the paper format:
- A4: `grid-template-columns: 1fr 1fr; grid-template-rows: repeat(4, minmax(120px, auto))`
- A5: `grid-template-columns: 1fr 1fr; grid-template-rows: repeat(2, minmax(180px, auto))`

Each block occupies its `grid_col`/`grid_row` position with `col_span`/`row_span` applied via `grid-column` and `grid-row` CSS.

Empty cells show a dashed "Add block here" placeholder.

### Drag and Drop
Use `@dnd-kit/core` + `@dnd-kit/sortable` (already familiar pattern or use native HTML5 drag events):
- Drag a block card to a different cell
- Server action updates `grid_col` + `grid_row`
- Optimistic UI: update local state immediately, revert on error

Alternative (simpler): click-to-select + arrow keys or click-destination to move (no external DnD library needed).

**Decision:** Implement with `@dnd-kit/core` for proper drag UX. If complexity is too high, fall back to click-to-move.

### Span Controls
Each block card has span controls (visible on hover/focus):
- Width toggle: 1 col ↔ 2 cols (only if block is in col 0 and col 1 is free)
- Height controls: +/- row span buttons

Span changes trigger `updateBlock` server action with new span values. Validate no overlap before saving.

### Block Cards
Each block in the grid shows:
- Block type icon + title
- Edit button (opens edit sheet/modal)
- Delete button (with confirm)
- Drag handle

### Empty Cell Placeholders
Clicking an empty cell opens "Add Block" dialog pre-filled with that position.

## Server Actions (updates to `newspaper/actions.ts`)

| Action | Change |
|--------|--------|
| `updateBlock` | Add `grid_col`, `grid_row`, `col_span`, `row_span` params |
| `moveBlockToCell` | New action: move block to specific cell, validate no overlap |
| `addBlock` | Accept optional `grid_col`, `grid_row`; auto-place if omitted |

### Overlap Validation
Server-side: before saving a position, verify no existing block occupies any of the target cells. Return error if conflict.

Client-side: visually highlight conflicting cells during drag.

## Paper Format + Fill Direction Controls

In the newspaper settings panel (or editor toolbar):
- **Format** selector: A4 / A5 (changing format may require repositioning blocks that fall outside the new grid)
- **Fill direction** selector: Column-first / Row-first (affects auto-placement of new blocks)

When switching from A4 → A5, any blocks in rows 2–3 (0-indexed) need to be either repositioned or flagged for user action.

## Live Preview Panel

Server component re-rendered via `router.refresh()` after each change, or implemented as a client component that receives block data as props and renders the layout.

The preview renders the same CSS grid as the editor but with actual block content (widget thumbnails or simplified previews), not drag handles.

## Toolbar
- "Generate Edition" button (existing functionality)
- "Add Block" button (opens dialog for block type + auto-placement)
- Undo/redo (optional, stretch goal)

## Mobile Considerations
- On mobile: tab UI with "Editor" and "Preview" tabs
- Editor tab shows blocks as a sortable list (fallback) or simplified grid
- Full drag-and-drop grid works best on desktop

## New Files
- `src/modules/newspaper/components/NewspaperGridEditor.tsx` — main editor
- `src/modules/newspaper/components/BlockCard.tsx` — grid cell block card
- `src/modules/newspaper/components/GridCell.tsx` — empty cell placeholder
- `src/modules/newspaper/components/SpanControls.tsx` — col/row span UI
- `src/modules/newspaper/components/AddBlockDialog.tsx` — dialog (replaces current form)
- `src/modules/newspaper/lib/grid.ts` — grid utility functions (overlap check, auto-place, format constants)

## Files to Update
- `src/app/(app)/i/[slug]/newspaper/[id]/page.tsx` — use new editor layout
- `src/modules/newspaper/components/` — retire `AddBlockForm`, `BlockEditor`
- `src/app/(app)/i/[slug]/newspaper/[id]/actions.ts` — add new actions

## Acceptance Criteria
- [ ] Grid renders correctly for both A4 and A5 formats
- [ ] Blocks appear at their correct grid positions with correct spans
- [ ] Drag-and-drop moves blocks and persists to DB
- [ ] Span controls work for both col and row spanning
- [ ] Overlap validation prevents invalid placements
- [ ] Empty cells show "Add block here" placeholder
- [ ] Clicking empty cell opens Add Block dialog with pre-filled position
- [ ] Format switcher works (A4 ↔ A5)
- [ ] Live preview panel updates after changes
- [ ] Mobile shows usable fallback UI
