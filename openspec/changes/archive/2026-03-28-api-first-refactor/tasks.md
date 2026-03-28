## 1. Foundation

- [x] 1.1 Add `jose` dependency (`pnpm add jose`)
- [x] 1.2 Add `JWT_SECRET` to environment variables (`.env.local`, Vercel, and test setup)
- [x] 1.3 Create migration: `api_clients` table with RLS policies, indexes, and `set_updated_at` trigger
- [x] 1.4 Apply migration to Supabase project
- [x] 1.5 Create `src/lib/api/types.ts` — `ApiTokenPayload`, `ApiAuthResult`, response envelope types
- [x] 1.6 Create `src/lib/api/response.ts` — `ok()`, `created()`, `noContent()`, `notFound()`, `forbidden()`, `unauthorized()`, `conflict()`, `unprocessable()` helpers
- [x] 1.7 Write tests for `src/lib/api/auth.ts` (valid JWT, missing header, wrong signature, expired token)
- [x] 1.8 Implement `src/lib/api/auth.ts` — `authenticateApiToken()` and `requireScope()` using `jose`

## 2. Auth Token Endpoint

- [x] 2.1 Write tests for `POST /api/auth/token` (valid credentials → JWT, invalid credentials → 401, missing fields → 400, revoked client → 401)
- [x] 2.2 Implement `src/app/api/auth/token/route.ts` — hash secret, lookup client, issue JWT

## 3. Todos API

- [x] 3.1 Write tests for `GET /api/v1/todos` and `POST /api/v1/todos` (auth, scopes, happy path, validation)
- [x] 3.2 Implement `src/app/api/v1/todos/route.ts` (GET list, POST create)
- [x] 3.3 Write tests for `GET/PUT/DELETE /api/v1/todos/:id` (auth, 404, happy path)
- [x] 3.4 Implement `src/app/api/v1/todos/[id]/route.ts` (GET, PUT, DELETE)

## 4. Bookmarks API

- [x] 4.1 Write tests for `GET /api/v1/bookmarks` and `POST /api/v1/bookmarks` (URL-only enrichment, full body, duplicate → 409)
- [x] 4.2 Implement `src/app/api/v1/bookmarks/route.ts` (GET list, POST create with scraper integration)
- [x] 4.3 Write tests for `GET/DELETE /api/v1/bookmarks/:id`
- [x] 4.4 Implement `src/app/api/v1/bookmarks/[id]/route.ts` (GET, DELETE)

## 5. Feeds API

- [x] 5.1 Write tests for `GET /api/v1/feeds` and `POST /api/v1/feeds` (duplicate → 409, feed parse)
- [x] 5.2 Implement `src/app/api/v1/feeds/route.ts` (GET list with unread_count, POST create with feed-parser)
- [x] 5.3 Write tests for `GET/DELETE /api/v1/feeds/:id`
- [x] 5.4 Implement `src/app/api/v1/feeds/[id]/route.ts` (GET, DELETE)
- [x] 5.5 Write tests for `GET /api/v1/feeds/:id/articles` (filter by is_read)
- [x] 5.6 Implement `src/app/api/v1/feeds/[id]/articles/route.ts` (GET with filters)
- [x] 5.7 Write tests for `GET/PATCH/DELETE /api/v1/feeds/:id/articles/:article_id`
- [x] 5.8 Implement `src/app/api/v1/feeds/[id]/articles/[article_id]/route.ts` (GET, PATCH, DELETE)

## 6. Google API

- [x] 6.1 Write tests for `GET /api/v1/google/accounts` and `GET /api/v1/google/calendars`
- [x] 6.2 Implement `src/app/api/v1/google/accounts/route.ts`
- [x] 6.3 Implement `src/app/api/v1/google/calendars/route.ts` (with optional `?account_id` filter)

## 7. Newspaper Generate API

- [x] 7.1 Write tests for `POST /api/v1/newspaper/generate` (template_id, inline config, missing both → 422, unknown template → 404, ?format=json)
- [x] 7.2 Implement `src/app/api/v1/newspaper/generate/route.ts` using existing `resolve-config` and newspaper engine

## 8. API Client Management UI

- [x] 8.1 Implement `src/modules/api-clients/actions.ts` — `createApiClient()`, `revokeApiClient()`, `listApiClients()`
- [x] 8.2 Create `src/modules/api-clients/components/api-clients-list.tsx`
- [x] 8.3 Create `src/modules/api-clients/components/create-client-dialog.tsx` (show secret-once modal)
- [x] 8.4 Create `src/modules/api-clients/components/revoke-client-button.tsx`
- [x] 8.5 Create `src/app/(app)/i/[slug]/settings/api/page.tsx`
- [x] 8.6 Create `src/app/(app)/i/[slug]/settings/integrations/page.tsx` (move Google accounts UI here)
- [x] 8.7 Update main settings page with links to `/settings/api` and `/settings/integrations`

## 9. Test Infrastructure

- [x] 9.1 Update `vitest.config.ts` to include `src/app/api/**/__tests__/**/*.test.ts`
- [x] 9.2 Verify `pnpm test` passes for all new test files

## 10. Documentation

- [x] 10.1 Write `docs/openapi.yaml` — OpenAPI 3.1 spec covering all `/api/auth/token` and `/api/v1/` endpoints
- [x] 10.2 Write `docs/memento-api.postman_collection.json` — Postman collection with pre-request JWT script

## 11. Backlog Tickets

- [x] 11.1 Create `docs/tickets/backlog/XXX_obsidian_plugin.md`
- [x] 11.2 Create `docs/tickets/backlog/XXX_home_assistant_tool.md`
