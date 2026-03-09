# 031 — Habit Tracker Widget

## Goal
Add a printable habit tracker grid widget for the newspaper that renders a table of habit names vs. days with empty checkbox cells for hand-ticking. No app-level tracking data is stored — the widget is purely a print template generated with correct dates at edition time.

## Dependencies
- **Requires ticket 024** (widget registry)

## Schema Changes

Add `habit_tracker` to the `block_type` enum:

```sql
ALTER TYPE block_type ADD VALUE 'habit_tracker';
```

## Implementation Notes

### Widget Config Shape

```ts
interface HabitTrackerConfig {
  habits: string[]              // e.g. ["Exercise", "Read", "Meditate"]
  period: 'week' | 'month'
  show_streak: boolean          // renders a "Streak" column (empty, hand-filled)
  title?: string                // optional section title, defaults to "Habit Tracker"
}
```

### Rendering

At edition generation time, compute the column headers based on the edition's `created_at` date:

- **Weekly**: 7 columns Mon–Sun with dates (e.g. "Mon 2", "Tue 3", …) for the current ISO week
- **Monthly**: all days of the current month (e.g. 28, 29, 30, or 31 columns)

Render as an HTML table:
- Header row: empty habit label cell + day columns (abbreviated day name + date number)
- One row per habit: habit name in the first cell, then empty cells (each containing a small `☐` checkbox symbol or a thin-bordered empty square via CSS)
- Optional last column: "Streak ___" for hand-writing
- Print-optimised: `border-collapse: collapse`, thin 0.5pt borders, small font (8–9pt), cells ~1rem tall

For monthly view with many columns: use a smaller font and tighter cell padding; landscape orientation hint via `@page { size: A4 landscape }` in a scoped print style.

### Widget Definition

Register in the widget registry (`src/modules/newspaper/lib/widgets/registry.ts`):
- `supportedSizes`: 2×2, 2×3, 2×4 (wide formats only — the table needs horizontal space)
- `fetchData`: returns the computed column headers and config (no DB fetch needed)
- `thumbnailComponent`: static preview showing a mini grid with example habits

### Config Form

- Habit list: ordered list of text inputs with add/remove/reorder
- Period toggle: Week / Month
- Show streak: checkbox
- Title: optional text input

## New Files
```
src/modules/newspaper/lib/widgets/habit-tracker/index.ts
src/modules/newspaper/lib/widgets/habit-tracker/config.tsx
src/modules/newspaper/lib/widgets/habit-tracker/preview.tsx
src/modules/newspaper/lib/widgets/habit-tracker/thumbnail.tsx
supabase/migrations/YYYYMMDD_block_type_habit_tracker.sql
```

## Acceptance Criteria
- [ ] `habit_tracker` added to `block_type` enum via migration
- [ ] Widget registered in the widget registry
- [ ] Weekly mode shows correct Mon–Sun columns for the edition date
- [ ] Monthly mode shows all days of the correct month
- [ ] Empty cells render as printable checkboxes (symbol or CSS border)
- [ ] Optional streak column present when configured
- [ ] Config form supports adding, removing, and reordering habits
- [ ] Widget renders correctly at 2×2, 2×3, and 2×4 sizes
- [ ] Print styling produces clean output (no screen-only chrome)
