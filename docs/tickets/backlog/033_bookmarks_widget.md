# 033 — Bookmarks Widget

## Goal
Add a user-managed bookmark list (links with titles, descriptions, and categories) with a dedicated module page for CRUD, and a newspaper widget that renders bookmarks as a compact reference card.

## Dependencies
- **Requires ticket 024** (widget registry)

## Schema Changes

### `bookmarks` table

```sql
CREATE TABLE bookmarks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url         text NOT NULL,
  title       text NOT NULL,
  description text,
  category    text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
-- RLS: SELECT for instance members, INSERT/UPDATE/DELETE for own rows
-- Trigger: set_updated_at()
```

### `block_type` enum

```sql
ALTER TYPE block_type ADD VALUE 'bookmarks';
```

## Implementation Notes

### Module Page: `/i/[slug]/bookmarks`

New module with its own sidebar nav entry (icon: `Bookmark`):
- List view: bookmarks grouped by category (ungrouped if no category), sorted by `sort_order`
- Each item: favicon (use `https://www.google.com/s2/favicons?domain=<domain>`), title (link), domain, description, category chip, delete button
- "Add Bookmark" button → inline form or sheet: URL, title (auto-filled via fetch of `<title>` tag — best-effort), description, category (text input with autocomplete of existing categories)
- Categories are free-form strings (no separate table needed)

### Auto-fill Title

On URL input blur, optionally fetch the page title server-side (via a server action that fetches the URL and parses `<title>`) and pre-fill the title field. Graceful degradation if fetch fails.

### Widget Config Shape

```ts
interface BookmarksWidgetConfig {
  category?: string     // filter to a specific category; undefined = all
  max_items: number     // default 10
  show_descriptions: boolean
  title?: string        // optional widget title override
}
```

### Rendering

Renders as a compact reference card:
- Optional widget title as a small section header
- List of bookmarks: domain in monospace or small text, title in bold, description (if enabled) in `text-sm text-muted`
- URL shortened to domain only (no `https://www.` prefix)
- Groups by category if no category filter is set and multiple categories exist
- Size-aware: fewer items at 1×1, full list at 2×2+

## New Files
```
src/modules/bookmarks/
  components/BookmarkList.tsx
  components/BookmarkForm.tsx
  lib/actions.ts
src/app/(app)/i/[slug]/bookmarks/
  page.tsx
  actions.ts
src/modules/newspaper/lib/widgets/bookmarks/
  index.ts
  config.tsx
  preview.tsx
  thumbnail.tsx
supabase/migrations/YYYYMMDD_bookmarks.sql
```

## Files to Update
- Sidebar nav — add Bookmarks entry
- `block_type` enum migration

## Acceptance Criteria
- [ ] `bookmarks` table created with RLS and `updated_at` trigger
- [ ] `bookmarks` block type added to enum
- [ ] `/i/[slug]/bookmarks` page lists and groups bookmarks by category
- [ ] Add/delete bookmark functionality works
- [ ] Auto-fill title on URL input (best-effort, graceful fallback)
- [ ] Widget filters by category and respects `max_items`
- [ ] Widget renders domain, title, and optional description
- [ ] Widget registered and size-aware
- [ ] Bookmarks link appears in the sidebar
