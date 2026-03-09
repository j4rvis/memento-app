# 039 — Feed Digest Mode

## Goal
Add a "digest" mode to the RSS newspaper widget that groups entries by feed and shows a count of new items plus the top 3 headlines per feed, instead of a flat list of individual articles.

## Dependencies
- **Requires ticket 024** (widget registry — RSS widget must be migrated first)
- **Optionally uses ticket 025** (AI summarisation, if implemented)

## Background
High-volume feeds (Hacker News, Reddit, newsletters) produce dozens of entries per day. In list mode, a single feed can dominate the widget. Digest mode collapses each feed to a compact summary, making the widget useful for monitoring many feeds at once.

## Schema Changes

None. The `feed_entries` table already exists with `feed_id`, `title`, `published_at`, and `read_at` columns. The widget config change is a JSONB field on `newspaper_blocks.config`.

## Implementation Notes

### Config Extension

Add to the existing RSS widget config:

```ts
interface RssWidgetConfig {
  // existing fields
  feed_ids?: string[]
  max_items?: number
  // new fields
  mode: 'articles' | 'digest'
  digest_top_n: number        // number of headlines per feed group (default 3)
  digest_since: 'last_edition' | '24h' | '7d'  // lookback window for "new" items
  ai_summarise?: boolean      // optional: AI-summarise each group (ticket 025)
}
```

Default `mode: 'articles'` — no change to existing behaviour.

### Data Fetching in Digest Mode

`fetchData` in the RSS widget definition, when `mode === 'digest'`:
1. Determine the lookback date: last edition's `created_at` (if `digest_since: 'last_edition'`), or a fixed interval
2. Query `feed_entries` where `published_at >= lookbackDate` and `feed_id IN (configured feed IDs)`, ordered by `published_at DESC`
3. Group by `feed_id` in JS
4. For each feed group: feed name, total count, top N entries by date

Return structure:
```ts
interface DigestGroup {
  feedId: string
  feedName: string
  newCount: number
  topEntries: { title: string; url: string; publishedAt: string }[]
  summary?: string   // optional AI summary
}
```

### AI Summarisation (Optional)

If `ai_summarise: true` and the AI summarisation feature (ticket 025) is available, call the summarisation function on each group's top entries and include a 1–2 sentence summary. Gracefully skip if the feature is not yet implemented.

### Rendering in Digest Mode

Each feed group rendered as a compact block:
- Feed name as a small bold header with entry count (e.g. "Hacker News • 23 new")
- Bulleted list of top N entry titles (linked if URL is available in the print context — or plain text for print)
- Optional AI summary in italic below the bullet list
- Horizontal rule between feed groups
- Size-aware: fewer groups at smaller sizes

### Config Form Changes

Add a `mode` toggle (Articles / Digest) to the RSS widget config form. When Digest selected, show:
- "Headlines per feed" number input (1–10)
- "Show items from" dropdown (since last edition / last 24 hours / last 7 days)
- "AI summarise" toggle (only shown if AI feature is available)

## Files to Update
- `src/modules/newspaper/lib/widgets/rss/index.ts` — update `fetchData`
- `src/modules/newspaper/lib/widgets/rss/config.tsx` — add digest config options
- `src/modules/newspaper/lib/widgets/rss/preview.tsx` — add digest rendering path

## Acceptance Criteria
- [ ] `mode` field added to RSS widget config with `'articles'` as default
- [ ] Existing articles mode behaviour is unchanged
- [ ] Digest mode groups entries by feed with correct new-item counts
- [ ] Lookback window (last edition / 24h / 7d) correctly scopes "new" entries
- [ ] Top N headlines render per feed group
- [ ] Config form shows digest options when mode is "digest"
- [ ] Size-aware rendering in digest mode
- [ ] AI summarisation integrated if ticket 025 is available (optional)
