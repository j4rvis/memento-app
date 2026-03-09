# 036 — Recurring Todos

## Goal
Allow todos to repeat on a schedule so that when a recurring todo is completed, a new copy is automatically created with the next due date.

## Schema Changes

### `todos` table

```sql
ALTER TABLE todos
  ADD COLUMN recurrence JSONB;
```

Recurrence shape:
```ts
interface TodoRecurrence {
  rule: 'daily' | 'weekly' | 'monthly' | 'weekdays' | 'custom'
  interval?: number        // e.g. every 2 weeks (default 1)
  days_of_week?: number[]  // 0=Sun … 6=Sat, used for 'custom' rule
  end_date?: string        // ISO date string; stop generating after this date
}
```

`recurrence: null` = non-recurring (default, no change to existing todos).

## Implementation Notes

### Next-Due-Date Computation

A shared utility `src/modules/todos/lib/recurrence.ts`:

```ts
export function getNextDueDate(
  currentDueDate: string | null,
  recurrence: TodoRecurrence,
  completedAt: Date,
): Date | null
```

Rules:
- `daily`: add `interval` days to `currentDueDate` (or `completedAt` if no due date)
- `weekly`: add `interval * 7` days
- `monthly`: add `interval` months (preserve day of month, cap at end of month)
- `weekdays`: next weekday (Mon–Fri) after `currentDueDate`
- `custom`: next date matching any of `days_of_week` after `currentDueDate`
- If the computed date is after `end_date`, return `null` (no new todo generated)

### Auto-Create on Completion

When a recurring todo is marked complete, create the next instance. Two options:

**Option A — Server action** (preferred, simpler): In the `toggleTodo` server action, after marking the todo complete, check `recurrence`. If set, compute the next due date and insert a new todo with the same fields (`title`, `project_id`, `priority`, `recurrence`, etc.) but `completed: false` and the new `due_date`.

**Option B — DB trigger**: A `AFTER UPDATE ON todos` trigger that fires when `completed` changes to `true`. More robust but harder to test. Implement as Option A first; trigger can be added later.

### UI: Recurrence Picker

Add a "Repeat" field to the todo create/edit form:
- Dropdown: None, Daily, Weekdays, Weekly, Monthly, Custom
- When "Custom" selected: day-of-week checkboxes (Mon–Sun)
- "Every N [days/weeks/months]" interval input (shown for Daily/Weekly/Monthly)
- "End date" date picker (optional)
- UI collapsed/hidden when "None" selected

### List Display

Show a repeat icon (`RotateCw` from Lucide) on todo items where `recurrence` is not null, next to the due date. Tooltip: the recurrence description (e.g. "Repeats weekly").

### Recurrence Description

A utility `describeRecurrence(recurrence: TodoRecurrence): string` for tooltip and display:
- `daily` → "Repeats daily"
- `weekdays` → "Repeats on weekdays"
- `weekly` → "Repeats every week"
- `monthly` → "Repeats every month"
- `custom` with days → "Repeats on Mon, Wed, Fri"

## Files to Update
- `src/modules/todos/components/TodoForm.tsx` (or equivalent) — add recurrence picker
- `src/modules/todos/components/TodoItem.tsx` — add repeat icon
- `src/app/(app)/i/[slug]/todos/actions.ts` — update `toggleTodo` to spawn next instance
- `supabase/migrations/` — add `recurrence` column

## New Files
```
src/modules/todos/lib/recurrence.ts
supabase/migrations/YYYYMMDD_todos_recurrence.sql
```

## Acceptance Criteria
- [ ] `recurrence` JSONB column added to `todos` via migration
- [ ] Completing a recurring todo automatically creates the next instance with the correct due date
- [ ] Repeat icon shown on recurring todos in the list
- [ ] Recurrence picker in the create/edit form supports all rule types
- [ ] `end_date` respected — no new todo created after the end date
- [ ] Non-recurring todos (recurrence null) are unaffected
- [ ] Next-due-date logic has unit tests covering all rule types
