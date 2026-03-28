## Context

The feeds module handles RSS/Atom subscriptions. Each feed row has a `url` that `rss-parser` fetches on demand; entries land in `feed_entries`. Social platforms (X, YouTube, Reddit) don't serve RSS — they expose OAuth-gated APIs with rate limits and scheduled-fetch semantics. The goal is to pull social posts into `feed_entries` on a schedule so they appear in the feeds UI and are queryable via the feeds API, without disrupting existing RSS behaviour.

The Google Calendar integration is the closest prior art: OAuth tokens encrypted with AES-256-GCM, a `google_accounts` table, and sync logic called on demand. This feature follows the same pattern but uses a scheduled sync instead of on-demand.

## Goals / Non-Goals

**Goals:**
- Generic schema that works for X, YouTube, Reddit and others without further migrations
- X (Twitter) as the first fully-implemented provider
- Tweets stored as `feed_entries` — visible in feeds UI and feeds API
- Scheduled sync 4×/day via a cron-triggered API route
- OAuth flow in instance settings following the Google Calendar UX pattern
- Token refresh handled transparently

**Non-Goals:**
- Real-time or webhook-based sync
- Instagram (Meta Graph API requires business accounts + app review)
- Read/write actions on social platforms (like, repost, reply)
- A dedicated social feed UI — X feeds render in the existing feeds reader

## Decisions

### 1. Generic `external_connections` table, not per-provider tables

One table with a `provider` text column (`'x'`, `'reddit'`, etc.) rather than `x_connections`, `reddit_connections` separately.

**Why**: Adding a new provider requires only a new sync module, not a new migration. The token shape (access_token, refresh_token, expires_at, scopes) is identical across OAuth 2.0 providers.

**Alternative considered**: Per-provider tables (like `google_accounts` for Google). Rejected because `google_accounts` was created before this pattern existed; continuing that approach would add a new table per provider indefinitely.

### 2. YouTube reuses `google_accounts`, not `external_connections`

YouTube uses Google OAuth. The user may already have a `google_accounts` row. Requiring a separate OAuth connection for YouTube would confuse users and duplicate tokens.

**Implementation**: When YouTube support is added, `feeds` will have a `google_connection_id` FK column alongside `external_connection_id`. The `provider` column (`'youtube'`) determines which FK is active.

### 3. Extend `feeds` table with four nullable columns

Add `provider` (default `'rss'`), `external_connection_id`, `provider_resource_id`, `provider_resource_type` to the existing `feeds` table rather than creating a separate `social_feeds` table.

`provider` stores the platform name only (`'rss'`, `'x'`, `'youtube'`, `'reddit'`). `provider_resource_type` stores the resource kind (`'list'`, `'user'`, `'channel'`, `'playlist'`). These are kept separate so the badge map, sync dispatch, and queries key on `provider` alone — not compound values like `'x_list'`.

**Why**: Each X list subscription IS a feed — it has a title, entries, unread count, and `last_fetched_at`. Reusing `feeds` means the feeds UI, feeds API, and newspaper feeds block work immediately without changes. Keeping `provider = 'rss'` as default means zero impact on existing rows.

**Alternative considered**: Separate `social_feeds` table with a `feed_id` FK. Rejected because it creates a parallel hierarchy requiring joins everywhere consumers of `feeds` exist.

### 4. Tweets map to `feed_entries` as-is

The `feed_entries` schema accommodates tweets without new columns:

| feed_entries column | tweet value |
|---|---|
| `guid` | `x:{tweet_id}` |
| `title` | `null` (tweets have no title) |
| `url` | `https://x.com/{username}/status/{id}` |
| `author` | `@{username}` |
| `content` | full tweet text |
| `summary` | tweet text (truncated to 280 chars) |
| `image_url` | first media attachment URL |
| `published_at` | tweet `created_at` |

**Why**: Avoids a new table. The feeds reader already handles null titles gracefully in some paths; any rendering gap is a minor UI fix.

### 5. Sync via Bearer-authenticated API route, triggered externally

`POST /api/feeds/sync` secured with `FEEDS_SYNC_SECRET` bearer token, called 4×/day by a Vercel cron job or equivalent.

**Why**: Consistent with the existing `POST /api/newspaper/cron` pattern. Keeps sync logic in the Next.js app where it has access to Supabase server client and env vars. No new infrastructure.

**Alternative considered**: Supabase Edge Function + pg_cron. Rejected to avoid splitting sync logic across two runtimes and adding Supabase Edge Function deployment complexity.

### 6. X uses OAuth 2.0 Authorization Code with PKCE

X's API v2 requires PKCE for confidential clients. Scopes needed: `tweet.read users.read list.read offline.access`.

**Token storage**: Same AES-256-GCM encryption used for `google_accounts`. The shared `encryption.ts` module accepts the secret as a parameter — `encryptToken(value, secret)` / `decryptToken(value, secret)` — so each provider's OAuth module passes its own env var (`X_TOKEN_SECRET`, `REDDIT_TOKEN_SECRET`, etc.). Keys can be rotated per provider without invalidating other providers' tokens.

**State parameter**: HMAC-signed JSON blob containing `userId`, `slug`, and a nonce — identical to Google OAuth state pattern.

## Risks / Trade-offs

**X API rate limits** → X API v2 Basic ($100/mo): 10,000 reads/month. At 4×/day across N subscriptions, each fetching up to 20 tweets = 120 × N × 20 reads. For personal use (≤4 subscriptions), this is ~10,000 reads/month — right at the limit. Mitigation: default page size of 10 tweets per sync run; surface `fetch_error` on the feed when rate limited.

**X API cost** → Basic tier is $100/month. Mitigation: documented clearly in setup; no code enforces it.

**Token expiry during sync** → X access tokens expire in 2 hours. Mitigation: sync job checks `token_expires_at` before each provider fetch and refreshes proactively if within 5 minutes of expiry.

**Null titles in feed entries** → The existing feeds reader may show blank titles for tweets. Mitigation: the `feed_entry_card` component falls back to `author + summary` when `title` is null — a small UI change.

**OAuth redirect URI rigidity** → X requires exact redirect URI match. Local dev and production need separate X app registrations or a configurable redirect URI. Mitigation: `X_REDIRECT_URI` env var.

## Migration Plan

1. Run migration: create `external_connections` table with RLS
2. Run migration: add 4 nullable columns to `feeds` (`provider` defaults to `'rss'`, others nullable)
3. Deploy app — existing RSS feeds unaffected (all have `provider = 'rss'`)
4. Add Vercel cron entry for `POST /api/feeds/sync` at `0 */6 * * *`
5. Set env vars: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`, `X_TOKEN_SECRET`, `FEEDS_SYNC_SECRET`

**Rollback**: Drop the 4 added columns from `feeds`, drop `external_connections`. No data loss for existing RSS feeds.

## Open Questions

- Should synced tweets be retained indefinitely, or pruned after N days? (Storage cost vs. history value)
- Should the sync endpoint process all instances in one call, or be instance-scoped? (One call is simpler; per-instance allows finer control)
