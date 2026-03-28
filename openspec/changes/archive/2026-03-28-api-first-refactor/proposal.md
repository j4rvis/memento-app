## Why

The app's business logic is currently only accessible through browser sessions via server actions and Next.js pages. External tools — Obsidian, Home Assistant, CLI scripts — need a machine-addressable interface with stable credentials to drive todos, bookmarks, feeds, and newspaper generation without a browser session.

## What Changes

- **New `api_clients` table** — stores client credentials (client_id + secret hash) scoped to an instance, with granular scopes and soft-revoke
- **New `POST /api/auth/token`** — accepts `client_id` + `client_secret`, issues a signed JWT (HS256, 24h expiry)
- **New `/api/v1/` endpoint suite** — all Bearer JWT authenticated, covering todos, bookmarks, feeds, articles, Google accounts/calendars, and newspaper generation
- **New `src/lib/api/` helpers** — shared JWT auth middleware, typed response envelope helpers, and API token payload types
- **New frontend settings pages** — `/i/[slug]/settings/api` for managing API clients, `/i/[slug]/settings/integrations` for Google accounts (moved)
- **New `JWT_SECRET` environment variable** — 32+ byte hex secret for signing tokens
- Existing `newspaper_api_keys` auth system is **untouched** — the new JWT system is additive and parallel

## Capabilities

### New Capabilities

- `api-auth`: JWT-based API authentication — `api_clients` table, credential verification, `POST /api/auth/token`, `authenticateApiToken()` middleware, scope system
- `todos-api`: Full CRUD REST endpoints for todos (`GET/POST /api/v1/todos`, `GET/PUT/DELETE /api/v1/todos/:id`)
- `bookmarks-api`: REST endpoints for bookmarks with server-side URL enrichment on create (`GET/POST /api/v1/bookmarks`, `GET/DELETE /api/v1/bookmarks/:id`)
- `feeds-api`: REST endpoints for feeds and feed articles including read/starred state (`GET/POST /api/v1/feeds`, `GET/DELETE /api/v1/feeds/:id`, `GET /api/v1/feeds/:id/articles`, `GET/PATCH/DELETE /api/v1/feeds/:id/articles/:article_id`)
- `google-api`: Read-only REST endpoints for Google accounts and calendars linked to an instance (`GET /api/v1/google/accounts`, `GET /api/v1/google/calendars`)
- `newspaper-api`: Endpoint to trigger newspaper PDF generation from a template or raw config (`POST /api/v1/newspaper/generate`)
- `api-client-management`: Frontend UI for creating, listing, and revoking API clients within instance settings

### Modified Capabilities

(none — existing UI and newspaper API auth are unchanged)

## Impact

- **New files**: `src/lib/api/types.ts`, `src/lib/api/auth.ts`, `src/lib/api/response.ts`, `src/app/api/auth/token/route.ts`, `src/app/api/v1/**`, `src/modules/api-clients/**`, `src/app/(app)/i/[slug]/settings/api/page.tsx`, `src/app/(app)/i/[slug]/settings/integrations/page.tsx`
- **New migration**: `api_clients` table with RLS policies
- **New dependency**: `jose` npm package (JWT sign/verify)
- **New env var**: `JWT_SECRET` required in production and test environments
- **No breaking changes** to existing UI, server actions, or newspaper API key system
- **Reuses**: `src/modules/articles/lib/scraper.ts` (bookmark enrichment), `src/modules/feeds/lib/feed-parser.ts` (feed URL parsing), `src/modules/newspaper/lib/resolve-config.ts` + engine (generate endpoint)
