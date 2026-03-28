## Why

The newspaper calendar blocks (`calendar-day` and `calendar-week`) have no proper treatment for full-day events: the week block ignores them entirely, and the day block shows them at the top of the time grid in a single slot rather than in a dedicated all-day section. This makes full-day events easy to miss and disrupts the visual hierarchy of a printed newspaper page.

## What Changes

- Add a dedicated **all-day section** above the time grid in both `calendar-day` and `calendar-week` blocks
- Full-day events are stacked vertically in this section (one per row), not squeezed into a time slot
- Up to 2 full-day event rows are shown without affecting the time grid
- For each full-day event beyond 2, the visible time range shrinks by 30 minutes from the end (e.g. 3 events → end hour trims by 30 min) — keeping the total block height fixed and preventing page overflow
- The all-day section is part of the block layout, not an addition to it; the calendar does not grow taller

## Capabilities

### New Capabilities

*(none — this is a rendering improvement to existing blocks)*

### Modified Capabilities

- `newspaper-pdf-engine`: Calendar-day and calendar-week blocks gain a dedicated all-day event section with adaptive time-range trimming to preserve fixed block height

## Impact

- `src/modules/newspaper/engine/blocks/calendar-day.ts` — add all-day header rows, apply time-range trimming logic
- `src/modules/newspaper/engine/blocks/calendar-week.ts` — add all-day header row(s) above time grid, apply time-range trimming logic
- No schema/config changes required; behavior is automatic based on events present
- No new dependencies
