# 032 — Quote of the Day Widget

## Goal
Add a large-format quote widget for the newspaper that pulls from either a user-managed quote collection or an external free API, selecting and snapshotting one quote at edition generation time.

## Dependencies
- **Requires ticket 024** (widget registry)

## Schema Changes

### `quotes` table

```sql
CREATE TABLE quotes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text        text NOT NULL,
  author      text,
  tags        text[] NOT NULL DEFAULT '{}',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
-- RLS: SELECT for instance members, INSERT/UPDATE/DELETE for own rows
```

### `block_type` enum

```sql
ALTER TYPE block_type ADD VALUE 'quote';
```

## Implementation Notes

### Widget Config Shape

```ts
interface QuoteWidgetConfig {
  source: 'custom' | 'api'
  tags?: string[]              // filter tags for both sources
  selection: 'random' | 'sequential'
  show_author: boolean
  style: 'pullquote' | 'full'  // pullquote = side accent bar, full = centred large text
}
```

### Data Fetching at Generation Time

`fetchData` in the widget definition:

- `source: 'custom'`: query `quotes` table filtered by `instance_id` and optional `tags`, apply `selection` strategy, return one quote
- `source: 'api'`: call `https://api.quotable.io/random?tags=<tags>` (free, no API key). Fallback gracefully if the API is down — use the last successfully fetched quote stored in `config.fallback_quote`

The selected quote is snapshotted into the edition content; the widget renders from the snapshot, not a live fetch.

### Rendering

- **Pullquote style**: large opening quotation mark (`"`, ~4rem, accent color), quote text in `text-xl italic`, author in small caps below, left accent border
- **Full style**: centred, `text-2xl` to `text-4xl` depending on quote length, attribution below
- Both styles use `@tailwindcss/typography` prose aesthetics but are standalone (not wrapped in `.prose`)
- Size-aware: at 1×1 truncate to ~100 chars; at 2×2 show full text

### Quote Management UI

Simple CRUD page at `/i/[slug]/settings` (or a modal accessible from the widget config):
- List of quotes with text preview and author
- Add form: text area, author input, tag chips
- Delete button per row
- No dedicated route needed — a settings tab or a modal from the widget config form is sufficient

## New Files
```
src/modules/newspaper/lib/widgets/quote/index.ts
src/modules/newspaper/lib/widgets/quote/config.tsx
src/modules/newspaper/lib/widgets/quote/preview.tsx
src/modules/newspaper/lib/widgets/quote/thumbnail.tsx
supabase/migrations/YYYYMMDD_quotes_table.sql
supabase/migrations/YYYYMMDD_block_type_quote.sql
```

## Acceptance Criteria
- [ ] `quotes` table created with RLS
- [ ] `quote` block type added to enum
- [ ] Widget registered in the widget registry
- [ ] `source: 'custom'` selects from user's quotes table, respecting tags and selection strategy
- [ ] `source: 'api'` fetches from quotable.io with graceful fallback
- [ ] Selected quote is snapshotted into the edition content
- [ ] Pullquote and full styles render correctly
- [ ] Size-aware rendering (compact at 1×1, full at 2×2)
- [ ] Quote management UI allows adding and deleting quotes
