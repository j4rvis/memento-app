# 037 — Today's Focus View

## Goal
Add a dedicated focus view within the todos module that aggregates overdue todos, todos due today, and todos due tomorrow across all projects into a clean single-column layout.

## Background
Users with many projects must visit each project separately to check what needs attention. The focus view surfaces the most time-sensitive work in one place without requiring any data model changes.

## Schema Changes

None. All filtering is done in the existing `todos` query using `due_date` comparisons.

## Implementation Notes

### Route

`/i/[slug]/todos/focus` — a new page within the todos module, reusing the todos layout.

### Data Fetching

Server action or inline server component fetch:

```ts
const today = new Date()
const todayStr = format(today, 'yyyy-MM-dd')
const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd')

// Query: todos where completed = false AND due_date <= tomorrow
// Ordered by: due_date ASC, priority DESC
```

Group results client-side into three sections:
1. **Overdue** — `due_date < today`
2. **Today** — `due_date = today`
3. **Tomorrow** — `due_date = tomorrow`

Todos with no due date are excluded from this view.

### Layout

Single-column layout, no project grouping:
- Section heading per group (e.g. "Overdue", "Today — Monday 3 March", "Tomorrow")
- Overdue section heading in red/destructive color
- Each todo item: the same `TodoItem` component already used in the project view (checkbox, title, priority badge, project name as a small label)
- Show the todo's project name as a subtle secondary label since todos from different projects are mixed together
- Empty state per section: no heading rendered if the group is empty
- If all three groups are empty: full-page empty state "Nothing due — enjoy your day"

### Navigation

Add a "Focus" link in the todos sidebar/secondary nav:
- Icon: `Target` (Lucide)
- Label: "Focus"
- Show a badge with the count of overdue + today items (computed server-side, passed as a prop)
- Position: above or below the project list

### No New Components Required

Reuse `TodoItem`, section heading patterns, and the existing empty state component. The page is primarily a filtered query + grouping wrapper.

## Files to Update
- Todos sidebar/nav component — add Focus link with count badge
- `src/app/(app)/i/[slug]/todos/actions.ts` — add `getFocusTodos(slug)` action

## New Files
```
src/app/(app)/i/[slug]/todos/focus/page.tsx
```

## Acceptance Criteria
- [ ] `/i/[slug]/todos/focus` route renders without errors
- [ ] Overdue, Today, and Tomorrow sections show correct todos
- [ ] Todos are sorted within each section: due date ASC, then priority DESC
- [ ] Project name shown on each todo item as a secondary label
- [ ] Overdue section heading rendered in a warning/destructive color
- [ ] Sections with no items are hidden (not rendered as empty headings)
- [ ] "Nothing due" empty state shown when all three groups are empty
- [ ] "Focus" link appears in the todos nav with an overdue+today count badge
- [ ] No new DB columns or migrations required
