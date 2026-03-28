## Why

The feeds module currently only supports RSS/Atom. Social platforms like X (Twitter), YouTube, and Reddit contain valuable content that users want to track in the same reading workflow — but these platforms don't expose standard RSS. A generic external provider system lets the app pull from social APIs on a schedule, storing posts as feed entries so they flow naturally into the existing feeds UI and newspaper blocks.

## What Changes

- New `external_connections` table stores encrypted OAuth tokens per provider (X, YouTube, Reddit, etc.)
- `feeds` table gains four columns: `provider`, `external_connection_id`, `provider_resource_id`, `provider_resource_type` — making each subscription a first-class feed
- Tweets/posts land in `feed_entries` using existing columns (guid, author, content, url, published_at)
- Settings page gets an "External Connections" section for connecting and managing provider accounts
- After connecting, users browse available lists/channels/users and subscribe — each subscription becomes a `feeds` row
- A scheduled sync endpoint (`/api/feeds/sync`) runs 4x/day, fetching new entries per provider using the appropriate API client
- X (Twitter) is the first provider implemented; YouTube and Reddit can be added later with zero schema changes
- YouTube specifically will reuse existing `google_accounts` rather than `external_connections`

## Capabilities

### New Capabilities

- `external-connections`: OAuth connection management — connecting, refreshing tokens, disconnecting providers (X to start)
- `social-feed-subscriptions`: Browsing available resources (lists, users, channels) after connecting and creating feed subscriptions backed by the social API
- `social-feed-sync`: Scheduled sync job that fetches new posts per provider and upserts them into `feed_entries`

### Modified Capabilities

- `feeds-api`: The feeds API gains provider metadata fields — existing RSS feed behaviour is unchanged

## Impact

- **DB migrations**: new `external_connections` table; 4 new nullable columns on `feeds`
- **New env vars**: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`, `X_TOKEN_SECRET`, `FEEDS_SYNC_SECRET` (each future provider adds its own `{PROVIDER}_TOKEN_SECRET` for independent key rotation)
- **New API routes**: `/api/x/auth`, `/api/x/callback`, `/api/feeds/sync`
- **New module**: `src/modules/external-feeds/` (OAuth helpers, provider fetchers, sync logic)
- **Settings UI**: new "External Connections" card in instance settings
- **No breaking changes** to existing RSS feeds or feed_entries consumers
