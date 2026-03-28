## Context

Both `calendar-day` and `calendar-week` render fixed-height HTML tables for print layout. The engine produces inline HTML that Puppeteer renders to PDF, so total block height is determined by the number of rows × row height. All-day events are currently either ignored (week) or jammed into the first time slot (day), losing the visual distinction they deserve.

The constraint is hard: blocks must not grow and push content onto the next page. Any space added at the top (all-day section) must be reclaimed from the bottom (time range).

## Goals / Non-Goals

**Goals:**
- Display all-day events in a dedicated section above the time grid in both block types
- Stack multiple all-day events vertically (one per row) within that section
- Preserve total block height by trimming the visible time range from the end when the all-day section grows beyond 2 rows

**Non-Goals:**
- No config option for this behavior — it is always automatic
- No overflow or multi-page support (that is a separate change)
- No horizontal packing of all-day events (always one event per row)
- No change to how timed events render

## Decisions

### Decision 1: All-day rows are prepended to the table body, not a separate element

HTML tables with `rowspan` need careful bookkeeping. The simplest approach that keeps the existing table structure intact is to prepend fixed-height `<tr>` rows at the start of `<tbody>` — one per all-day event (day view) or per "max all-day depth across any column" (week view). These rows have the same height as a regular slot row and contain inline-styled event cells.

**Alternative considered:** A separate `<table>` above the main table. Rejected because column widths would not align between the two tables, which looks wrong in print.

### Decision 2: Trim formula — 1 slot per all-day event beyond 2

`trimSlots = Math.max(0, allDayRowCount - 2)`

- `calendar-day`: each slot = 30 min, so the effective `hourEnd` shrinks by `trimSlots × 0.5` hours (implemented by reducing total slot count)
- `calendar-week`: each slot = 1 hour, so `hourEnd` shrinks by `trimSlots` hours

The free threshold of 2 means up to 2 all-day events are shown with no time-range penalty. This matches the user's expectation that "two entries should fit in a row".

**Alternative considered:** Shrink by a fixed 30 min regardless of count. Rejected because it breaks for 3+ all-day events.

### Decision 3: Week view — rows = max all-day depth of any column

In the week view, different days may have different numbers of all-day events. The all-day section height is the maximum across all 7 days so every column has the same number of rows. Days with fewer all-day events simply have empty cells in the extra rows. Trimming is based on this same maximum.

**Alternative considered:** Per-day rowspan merging. Rejected — adds significant complexity for minimal visual gain in print.

### Decision 4: All-day row height = same as regular slot height

Reusing `slot_height_mm` keeps the height accounting trivial: every row (all-day or timed) is the same height, so `totalRows × slotHeight` is constant.

## Risks / Trade-offs

- **Many all-day events eat visible hours** → If a day has 8+ all-day events, 6 hours are trimmed off the end. For most calendars this is unlikely, but it's the correct trade-off given the no-grow constraint.
- **Week view all-day section wastes space for sparse days** → A day with 0 all-day events will have empty rows if any other day has events. Accepted: consistent row count is necessary for table layout.

## Migration Plan

No schema changes. No config changes. Purely a rendering change inside `calendar-day.ts` and `calendar-week.ts`. Existing rendered newspapers will look different once deployed, but no data migration is needed.
