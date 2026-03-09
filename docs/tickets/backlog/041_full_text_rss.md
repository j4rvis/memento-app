# 041 — Full-Text RSS

## Goal
For RSS feeds that only provide summaries, optionally scrape and store the full article text using the existing Readability scraper, making full article content available in the RSS newspaper widget.

## Schema Changes

### `feeds` table

```sql
ALTER TABLE feeds
  ADD COLUMN full_text boolean NOT NULL DEFAULT false;
```

### `feed_entries` table

```sql
ALTER TABLE feed_entries
  ADD COLUMN full_content text;
```

## Implementation Notes

### Config UI

In the feed settings/edit form, add a "Fetch full article text" toggle (stored as `feeds.full_text`). Show a warning: "This fetches each article page when updating the feed — only enable for feeds with summary-only content."

### Scraping Integration

In the feed refresh logic (`src/modules/feeds/lib/` or the feed update server action):

After inserting or upserting a `feed_entry`:
1. Check if `feeds.full_text = true` for the parent feed
2. If yes, and `feed_entries.full_content` is null, queue a full-text fetch
3. Fetch the entry's `url` and parse with `@mozilla/readability` (same pattern as `src/modules/articles/lib/scraper.ts`)
4. Store the parsed `content` in `feed_entries.full_content`

### Rate Limiting

To avoid hammering target sites:
- Process full-text fetches sequentially with a 1-second delay between requests (`setTimeout` / `await new Promise(r => setTimeout(r, 1000))`)
- Skip entries where `full_content` is already populated
- Limit full-text fetching to the most recent N entries per feed refresh (e.g. 10 most recent) to keep refresh time bounded
- Log scraping failures per-entry (not per-feed) — a failed scrape sets `full_content` to null and does not block other entries

### RSS Widget Integration

In the RSS widget `fetchData`:
- When `full_content` is available on an entry, prefer it over `content`/`summary` for the widget body text
- The widget config does not need a new field — the widget automatically uses `full_content` when present

### Readability Reuse

`@mozilla/readability` is already a dependency (used in the articles module). Import the same `scrapeArticle` utility or factor it into a shared `src/lib/readability.ts` helper if not already shared.

### Feed Refresh Scheduling

Full-text fetching runs synchronously during feed refresh (triggered by the existing refresh action). If refresh times become too long, a follow-up ticket can move full-text fetching to a background Edge Function.

## Files to Update
- Feed edit/settings form — add full_text toggle
- `src/modules/feeds/lib/` or feed refresh action — add full-text scraping step
- RSS widget `fetchData` — prefer `full_content` when available
- `supabase/migrations/` — two migration files

## New Files
```
supabase/migrations/YYYYMMDD_feeds_full_text.sql
supabase/migrations/YYYYMMDD_feed_entries_full_content.sql
```

## Acceptance Criteria
- [ ] `full_text` boolean column added to `feeds` via migration
- [ ] `full_content` text column added to `feed_entries` via migration
- [ ] Full-text toggle visible in the feed edit UI
- [ ] When enabled, feed refresh scrapes and stores full article content for new entries
- [ ] Rate limiting: 1-second delay between scrapes, max 10 entries per refresh
- [ ] Already-scraped entries (full_content not null) are not re-scraped
- [ ] Scraping failures are logged per-entry and do not block the refresh
- [ ] RSS widget uses `full_content` when available
- [ ] No change to feeds where `full_text = false`
