# 038 — Note Tagging

## Goal
Add tags to notes for filtering in the notes list and for targeting notes in the newspaper widget. Tags are stored as a `text[]` column with a GIN index.

## Schema Changes

### `notes` table

```sql
ALTER TABLE notes
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX notes_tags_gin ON notes USING GIN (tags);
```

## Implementation Notes

### Tag Input Component

A reusable `TagInput` component (`src/components/ui/tag-input.tsx`):
- Renders current tags as removable chips
- Text input at the end: press Enter or comma to add a tag
- Autocomplete: suggests existing tags from the instance (fetched once on mount via a server action `getInstanceTags(slug)` that queries `SELECT DISTINCT unnest(tags) FROM notes WHERE instance_id = ?`)
- Keyboard: Backspace on empty input removes the last tag
- Max tag length: 32 characters; max 20 tags per note

### Note Editor Integration

Add the `TagInput` to the note create/edit form below the title field. Tags saved to `notes.tags` on form submit.

Show tags as small chips on note cards in the list view.

### Filter Bar

In the notes list page, add a tag filter bar above the note list:
- Renders all unique tags used across the instance's notes (from `getInstanceTags`)
- Each tag is a clickable toggle chip
- Clicking a tag filters the note list to notes containing that tag
- Multiple tags selected = AND filter (note must have all selected tags)
- Filter state managed in URL search params (`?tags=tag1,tag2`) for shareability and server-side filtering
- "Clear" button to reset filters

### Server-Side Filtering

Pass selected tags to the `getNotes(slug, { tags })` server action/query:
```sql
WHERE (cardinality($tags) = 0 OR tags @> $tags)
```

### Notes Widget Config Extension

Add `tags?: string[]` to the notes widget config. When set, only notes containing any of the specified tags are shown in the widget. This applies to both `mode: 'list'` and the note selector in `mode: 'single'` (ticket 035).

## New Files
```
src/components/ui/tag-input.tsx
supabase/migrations/YYYYMMDD_notes_tags.sql
```

## Files to Update
- Note editor form component — add TagInput
- Note card component — show tag chips
- Notes list page — add filter bar
- `src/app/(app)/i/[slug]/notes/actions.ts` — update `getNotes` to accept tags filter, add `getInstanceTags`
- Notes widget config form — add tags filter field

## Acceptance Criteria
- [ ] `tags` column added to `notes` with GIN index via migration
- [ ] TagInput component works with keyboard (Enter/comma to add, Backspace to remove)
- [ ] Autocomplete suggests existing instance tags
- [ ] Tags displayed as chips on note cards in the list
- [ ] Tag filter bar appears in the notes list with working AND filter
- [ ] Filter state persisted in URL search params
- [ ] Server-side filtering uses GIN index (`@>` operator)
- [ ] Notes widget config supports `tags` filter
- [ ] No regression in existing note create/edit/list behaviour
