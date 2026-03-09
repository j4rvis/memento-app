# 040 — Article Highlights

## Goal
Allow users to highlight text passages in saved articles and expose those highlights as a newspaper widget that renders recent highlights as blockquotes with article attribution.

## Schema Changes

### `articles` table

```sql
ALTER TABLE articles
  ADD COLUMN highlights JSONB NOT NULL DEFAULT '[]'::jsonb;
```

Highlights shape:
```ts
interface ArticleHighlight {
  id: string          // uuid, generated client-side
  text: string        // the highlighted passage
  note?: string       // optional annotation
  created_at: string  // ISO timestamp
}
```

Stored as a JSONB array on the article row (no separate table needed — highlights belong entirely to one article).

### `block_type` enum

```sql
ALTER TYPE block_type ADD VALUE 'highlights';
```

## Implementation Notes

### Highlight Selection in the Article Reader

In the article reader component (`src/modules/articles/components/ArticleReader.tsx` or equivalent):
1. Listen for `mouseup` / `touchend` events on the article body
2. Check `window.getSelection()` — if non-empty selection within the article content, show a floating "Highlight" button near the selection
3. On click: capture `selection.toString()`, generate a UUID, call `addHighlight(slug, articleId, highlight)` server action
4. The server action appends the new highlight to `articles.highlights` using Postgres JSONB concat: `highlights || $newHighlight::jsonb`
5. After saving, re-render the article body with highlight spans (see below)

### Re-rendering Highlights

On article load, apply highlights to the rendered HTML:
- Use a client-side function that takes the article HTML string and the array of highlight texts
- For each highlight text, wrap the first matching occurrence in `<mark class="highlight">` using a string search + replace approach (simple, covers most cases; not perfect for overlapping highlights but acceptable)
- Highlights styled: yellow background, no border-radius, `@media print` retains background via `-webkit-print-color-adjust: exact`
- If a highlight text no longer exists in the article body (content changed), it is skipped silently

### Highlight List in the Reader

Below the article body, show a "Highlights" section:
- Each highlight as a blockquote with optional annotation
- "Delete" button (icon) per highlight — calls `removeHighlight(slug, articleId, highlightId)` server action
- "Add note" button opens an inline textarea to add/edit the annotation

### Newspaper Widget

New `highlights` widget:
- Config: `max_items: number`, `days_back: number` (default 7 — only highlights from the last N days)
- `fetchData`: query `articles` where `highlights != '[]'` and `instance_id` matches, unnest highlights, filter by `created_at`, sort newest first, take `max_items`
- Render each highlight as a styled blockquote: highlight text in quotes, article title + date as attribution in small text below
- Size-aware: fewer highlights at smaller sizes

## New Files
```
src/modules/newspaper/lib/widgets/highlights/index.ts
src/modules/newspaper/lib/widgets/highlights/config.tsx
src/modules/newspaper/lib/widgets/highlights/preview.tsx
src/modules/newspaper/lib/widgets/highlights/thumbnail.tsx
supabase/migrations/YYYYMMDD_article_highlights.sql
```

## Files to Update
- Article reader component — add selection listener and highlight rendering
- `src/app/(app)/i/[slug]/articles/actions.ts` — add `addHighlight`, `removeHighlight`
- Article detail page — show highlights section below article body

## Acceptance Criteria
- [ ] `highlights` JSONB column added to `articles` via migration
- [ ] `highlights` block type added to enum
- [ ] Text selection in the article reader shows a "Highlight" button
- [ ] Saved highlights rendered as yellow-underlined spans in the article body
- [ ] Highlights list shown below the article with delete and annotate options
- [ ] Highlights widget registered and fetches recent highlights across all articles
- [ ] Widget renders highlights as blockquotes with article attribution
- [ ] Size-aware rendering in the widget
- [ ] Print styling retains highlight background colour
