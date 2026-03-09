# 025 — RSS Newspaper Widget

## Goal
Upgrade the RSS block into a proper newspaper-style widget with configurable size, multi-feed category grouping, and optional AI summarization of articles.

## Layout & Size
Size-aware rendering: 1×1 shows a compact headline list; 2×1 shows headlines with one-line teasers; 1×2 or 2×2 shows full newspaper column layout with article body text, styled with `@tailwindcss/typography` for a broadsheet feel. Category/feed labels render as section headers (e.g. **WORLD**, **TECH**) between article groups.

## Config Schema

```ts
interface RssWidgetConfig {
  feed_ids: string[]           // one or more feeds (existing feed_id or multiple)
  max_items?: number           // default 5
  group_by_feed?: boolean      // show feed name as section header, default false
  show_description?: boolean   // show article teaser/body, default true
  summarize?: boolean          // AI-summarize each article, default false
  summary_length?: 'short' | 'long'  // default 'short' (1 sentence vs 1 paragraph)
}
```

## AI Summarization
When `summarize: true`, at edition generation time each article's description/content is passed to the Claude API (`claude-haiku-4-5-20251001` for cost efficiency) with a prompt to produce a 1-sentence or 1-paragraph summary. Summaries are stored in the edition snapshot alongside the original content — no live API calls at render time. Requires `ANTHROPIC_API_KEY` env var; if absent, falls back to original description silently.

## Acceptance Criteria
- [ ] Multiple feeds can be selected per block
- [ ] Articles group by feed with section headers when `group_by_feed` is on
- [ ] All four size variants render without overflow
- [ ] AI summarization runs at generation time and snapshots correctly
- [ ] Graceful fallback if `ANTHROPIC_API_KEY` is not set
- [ ] Print layout looks like a newspaper column (justified text, tight leading)
