## 1. Database Migrations

- [x] 1.1 Create `external_connections` table with columns: `id`, `instance_id`, `user_id`, `provider`, `provider_user_id`, `provider_username`, `access_token`, `refresh_token`, `token_expires_at`, `scopes`, `created_at`, `updated_at`
- [x] 1.2 Add RLS policies to `external_connections`: SELECT/INSERT/UPDATE/DELETE for own rows within instance
- [x] 1.3 Add `set_updated_at` trigger to `external_connections`
- [x] 1.4 Add `provider` column (text, default `'rss'`) to `feeds` table
- [x] 1.5 Add `external_connection_id` (uuid, nullable FK → `external_connections`) to `feeds`
- [x] 1.6 Add `provider_resource_id` (text, nullable) to `feeds`
- [x] 1.7 Add `provider_resource_type` (text, nullable) to `feeds`

## 2. External Feeds Module

- [x] 2.1 Create `src/modules/external-feeds/` directory structure with `lib/`, `components/`
- [x] 2.2 Create `src/modules/external-feeds/lib/encryption.ts` — reuse AES-256-GCM pattern from google-calendar; `encryptToken`/`decryptToken` accept the secret as a parameter so each provider passes its own key (e.g. `X_TOKEN_SECRET`, `REDDIT_TOKEN_SECRET`) and keys can be rotated independently
- [x] 2.3 Create `src/modules/external-feeds/lib/types.ts` — `ExternalConnection`, `ExternalFeed` TypeScript types
- [x] 2.4 Create `src/modules/external-feeds/lib/x-oauth.ts` — `buildAuthUrl`, `buildState`, `verifyState`, `exchangeCode`, `refreshAccessToken` using X OAuth 2.0 PKCE
- [x] 2.5 Create `src/modules/external-feeds/lib/x-api.ts` — `fetchUserLists`, `fetchListTweets`, `fetchUserTweets` using X API v2

## 3. X OAuth Flow

- [x] 3.1 Create `src/app/api/x/auth/route.ts` — GET handler that builds and redirects to X auth URL with PKCE and signed state
- [x] 3.2 Create `src/app/api/x/callback/route.ts` — GET handler that verifies state, exchanges code for tokens, upserts `external_connections` row, redirects to settings
- [x] 3.3 Add env vars to documentation/`.env.example`: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`, `X_TOKEN_SECRET`

## 4. Sync Endpoint

- [x] 4.1 Create `src/modules/external-feeds/lib/sync.ts` — main sync function: query social feeds, refresh tokens, dispatch to provider-specific syncer via a `PROVIDER_SYNCERS` map (e.g. `{ x: xSync }`) so adding YouTube/Reddit only requires adding an entry to the map, upsert feed_entries, update `last_fetched_at` and `fetch_error`
- [x] 4.2 Create `src/modules/external-feeds/lib/x-sync.ts` — X-specific sync: map tweet objects to `feed_entries` rows (`guid = 'x:{id}'`, author, content, url, image_url, published_at)
- [x] 4.3 Create `src/app/api/feeds/sync/route.ts` — POST handler with `FEEDS_SYNC_SECRET` bearer auth, calls sync function, returns summary JSON
- [x] 4.4 Add `FEEDS_SYNC_SECRET` to env vars documentation
- [x] 4.5 Add Vercel cron entry in `vercel.json`: `POST /api/feeds/sync` at `0 0,6,12,18 * * *`

## 5. Settings UI — External Connections

- [x] 5.1 Create `src/modules/external-feeds/components/external-connections-card.tsx` — card showing connected providers; render a connect button per supported provider using a `SUPPORTED_PROVIDERS` config array so adding a new provider only requires extending the config, not editing the component
- [x] 5.2 Create `src/modules/external-feeds/components/disconnect-provider-button.tsx` — server action to delete `external_connections` row (and cascade feeds/entries)
- [x] 5.3 Add `disconnectExternalConnection` server action in `src/app/(app)/i/[slug]/settings/actions.ts`
- [x] 5.4 Add the `ExternalConnectionsCard` to the instance settings page

## 6. Settings UI — Add X Feed Dialog

- [x] 6.1 Create `src/modules/external-feeds/components/add-x-feed-dialog.tsx` — dialog that loads the user's X lists and user timeline via a server action, displays them as selectable items
- [x] 6.2 Create `getXResources` server action — calls X API to fetch owned lists, subscribed lists, and returns user's own timeline as an option
- [x] 6.3 Create `subscribeToXResource` server action — creates a `feeds` row with `provider`, `external_connection_id`, `provider_resource_id`, `provider_resource_type`
- [x] 6.4 Wire the "Add X Feed" button into the feeds page header (shown when the user has a connection with `provider = 'x'`; future providers add their own button by the same check against their provider value)

## 7. Feeds UI Adjustments

- [x] 7.1 Update `feed-list.tsx` to show a per-provider badge next to social feeds — map `provider` to its icon/label (e.g. `'x_list' | 'x_user'` → 𝕏) so adding future providers (YouTube, Reddit) only requires extending the map, not changing the condition
- [x] 7.2 Update `feed-entry-card.tsx` to render gracefully when `title` is null — fall back to `author` + `summary` as the primary display text

## 8. Feeds API Update

- [x] 8.1 Update `GET /api/v1/feeds` route to include `provider` and `provider_resource_type` in the response
- [x] 8.2 Update `GET /api/v1/feeds/:id` route to include `provider` and `provider_resource_type` in the response
- [x] 8.3 Update API response TypeScript types to include new fields
