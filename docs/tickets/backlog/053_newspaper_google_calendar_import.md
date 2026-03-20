# 053 — Newspaper Google Calendar Import

## Goal

Allow users to import Google Calendar events (from the connected accounts via ticket 020) into a template's `CalendarEntry[]` pool, so calendar blocks in the newspaper display real events without manual entry.

## Background

See `docs/story-newspaper.md`. Depends on ticket 020 (Google Calendar OAuth + sync), ticket 047 (engine types), and ticket 048 (visual editor with calendar entry manager).

## Behaviour

Two modes:

### 1. Static import (snapshot)
User clicks "Import from Google Calendar" in the Calendar Entry Manager (ticket 048 UI). Fetches events from `google_calendar_events` table for a selected date range and appends them to `config.calendar_entries`. Entries are embedded in the saved config JSON — they don't update automatically.

Use case: user wants to review/edit entries before printing.

### 2. Dynamic injection at render time (scheduler)
When a schedule runs (ticket 049), the `runSchedule()` helper automatically fetches `google_calendar_events` for the relevant date range and merges them into `config.calendar_entries` before calling `render()`. The saved config template does NOT store these entries — they are injected fresh each time.

A `calendar_week` or `calendar_day` block can opt into this with:
```typescript
{
  type: 'calendar-week',
  use_google_calendar: true,   // new flag — inject events at render time
  ...
}
```

When `use_google_calendar: true` and the user has connected Google accounts, the renderer injects events automatically. If no Google accounts are connected, the flag is silently ignored.

## Static Import UI

In the Calendar Entry Manager sheet (ticket 048):

- "Import from Google Calendar" button
- Opens a sub-dialog:
  - Date range picker (default: next 7 days)
  - Checkbox list of connected Google accounts (from `google_accounts` table)
  - "Import" button
- On confirm: fetches from `google_calendar_events` (filtered by date range + selected accounts), maps to `CalendarEntry[]`, appends to `config.calendar_entries`
- Show count: "Imported 12 events" toast

## Dynamic Injection (Scheduler)

In `runSchedule()` (ticket 049), after loading the template config:

```typescript
// For each page/block that has use_google_calendar: true,
// determine the date range needed, fetch events, merge into config.calendar_entries
const needsCalendar = configNeedsGoogleCalendar(config);
if (needsCalendar) {
  const dateRange = getCalendarDateRange(config);  // derives min/max date from calendar blocks
  const events = await fetchGoogleCalendarEvents(instanceId, userId, dateRange);
  config.calendar_entries = mergeCalendarEntries(config.calendar_entries, events);
}
```

Helper: `src/modules/newspaper/engine/fetchers/calendar.ts`

## Data Mapping

`google_calendar_events` row → `CalendarEntry`:

| Source field | Target field |
|-------------|-------------|
| `title` | `title` |
| `description` | `description` |
| `start_at` | `start_at` |
| `end_at` | `end_at` |
| `all_day` | `all_day` |
| `color` | `color` |
| `calendar_id` | `calendar` (use friendly name if available, else raw ID) |
| `google_event_id` | `id` (prefix with `gcal_`) |

## Deduplication

When merging static entries (from config) with dynamically injected Google events, deduplicate by `id` — Google events have `id` starting with `gcal_`. Static entries without a `gcal_` prefix are preserved as-is.

## Acceptance Criteria

- [ ] "Import from Google Calendar" button appears in Calendar Entry Manager when at least one Google account is connected
- [ ] Date range + account selection dialog works correctly
- [ ] Imported events appear in `config.calendar_entries` and are saved with the template
- [ ] `use_google_calendar: true` flag available on calendar-week and calendar-day blocks
- [ ] Scheduler injects Google Calendar events at render time when flag is set
- [ ] Static and dynamic entries are deduplicated correctly
- [ ] If no Google accounts connected, import button is hidden / flag is ignored gracefully
