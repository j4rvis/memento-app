# 022 — Calendar Widget System

## Goal
Build a calendar widget for the Newspaper feature that renders printable calendar templates — empty grids the user fills in by hand after printing. Data sources (todos, Google Calendar) are optional overlays on top of the template.

## Core Concept
The primary use case is a **printable blank calendar** — clean grids with correct dates, day labels, and time slots, designed to be filled in by hand. Any pre-populated data (from todos or Google Calendar) is an optional enhancement. The widget must look great and be fully useful with zero external integrations.

## Dependencies
- **Requires ticket 019** (grid positioning data model)
- Google Calendar (ticket 020) is **optional** — widgets work without it

## Config Schema

```ts
interface CalendarWidgetConfig {
  view: 'daily' | 'week' | 'month'
  // Template options
  start_hour?: number        // for daily view, default 8
  end_hour?: number          // for daily view, default 22
  show_week_numbers?: boolean // default false
  first_day?: 'monday' | 'sunday' // default monday
  // Optional data overlays (all optional, all default off)
  show_todos?: boolean        // overlay todos with due dates
  show_google?: boolean       // overlay Google Calendar events (requires ticket 020)
  google_account_ids?: string[]
  calendar_ids?: string[]
}
```

## View Modes

### `daily` — single day planner
Best for 1×2 or 2×2. A time grid for a single day (today at generation time):
- Hour rows from `start_hour` to `end_hour`, each with a blank line to write on
- Optional half-hour subdivisions
- A small notes area at the bottom
- Example: 08:00 ________ / 08:30 ________ / 09:00 ________

### `week` — 7-column week template
Best for 2×2. Mon–Sun columns, each column has:
- Day name + date at the top
- A few ruled lines to write events/notes
- Optional hour labels on the left

### `month` — month calendar template
Best for 2×2. Standard month grid:
- Correct day numbers for the month at generation time
- Each cell has blank space to write in
- Clean borders, day names header row

## Size Recommendation Matrix

| View | Recommended Size |
|------|-----------------|
| daily | 1×2, 2×2 |
| week | 2×2 |
| month | 1×2, 2×2 |

## Print Design Principles
- Use thin, light borders — visible but not ink-heavy
- Font sizes optimised for print (not screen DPI)
- Avoid background colors (except very light shading for headers)
- Time labels and day names in a muted/lighter weight
- Generous line height for handwriting space
- The `NewspaperPreview` page already targets print — no extra print CSS needed

## Data Overlays (optional)

When data overlays are enabled, pre-populate the calendar cells with small text entries. These are additive — the blank lines for handwriting remain.

### Todos overlay (`show_todos: true`)
Query todos with due dates in the relevant date range. Display as small chips/lines inside the correct day cell or time slot.

### Google overlay (`show_google: true`)
Query `google_calendar_events` (requires ticket 020). Display as small chips/lines alongside todo entries. **If no Google accounts are connected, this setting is silently ignored.**

## Components

### `src/modules/newspaper/components/widgets/CalendarWidget.tsx`
Top-level dispatcher:
```tsx
<CalendarWidget config={config} data={data} colSpan={block.col_span} rowSpan={block.row_span} />
```

### Sub-components
- `CalendarDaily.tsx` — hourly planner grid
- `CalendarWeek.tsx` — 7-column week template
- `CalendarMonth.tsx` — month grid template
- `CalendarEventEntry.tsx` — shared small entry for data overlays (todos/Google events)

## Edition Generation
At generation time, `generateEdition`:
1. Resolves the relevant date range from the view type + current date
2. If `show_todos: true` — fetches todos with due dates in range
3. If `show_google: true` and Google accounts are connected — fetches `google_calendar_events`
4. Snapshots all of this (including the resolved dates) into the edition `content` JSONB

The calendar renders purely from the snapshot — correct dates are baked in at generation time.

## Block Type
Reuse the existing `calendar` block type enum value. The new config schema is backward-compatible: old blocks with just `days_ahead` render as a `daily` view with todos overlay.

## Acceptance Criteria
- [ ] `daily` view renders a clean hourly time grid with correct date and blank lines
- [ ] `week` view renders Mon–Sun with correct dates and writing space
- [ ] `month` view renders correct month grid with all day numbers
- [ ] All views look good printed (light borders, handwriting-friendly spacing)
- [ ] Views work at all recommended size variants without overflow
- [ ] Todos overlay correctly places entries in the right day/time slots
- [ ] Google overlay works when accounts are connected, silently skipped when not
- [ ] Edition snapshot bakes in the resolved dates at generation time
- [ ] Backward compatible with existing `calendar` blocks
