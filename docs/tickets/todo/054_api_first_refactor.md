# 054 — API-First Refactor

## Goal

Expose a proper REST API (`/api/v1/`) with JWT-based authentication so external tools (Obsidian plugin, Home Assistant, scripts) can drive todos, bookmarks, feeds, and newspaper generation without a browser session.

## Background

The app currently mixes UI and business logic tightly in server actions. This ticket adds a parallel API layer without touching the existing UI or the existing `newspaper_api_keys` system.

**Full implementation plan:** `docs/api-first-refactor.md`

## Summary of Changes

### New: `api_clients` table

Stores client credentials (client_id + secret hash) with instance scoping, scopes, and soft-revoke via `is_active`.

### New: `POST /api/auth/token`

Accepts `client_id` + `client_secret`, issues a signed JWT (HS256, 24h expiry).

### New: `/api/v1/` endpoints (all Bearer JWT authenticated)

| Endpoint | Methods |
|---|---|
| `/api/v1/todos` | GET, POST |
| `/api/v1/todos/:id` | GET, PUT, DELETE |
| `/api/v1/bookmarks` | GET, POST |
| `/api/v1/bookmarks/:id` | GET, DELETE |
| `/api/v1/feeds` | GET, POST |
| `/api/v1/feeds/:id` | GET, DELETE |
| `/api/v1/feeds/:id/articles` | GET |
| `/api/v1/feeds/:id/articles/:article_id` | GET, PATCH, DELETE |
| `/api/v1/google/accounts` | GET |
| `/api/v1/google/calendars` | GET |
| `/api/v1/newspaper/generate` | POST |

### New: Frontend configuration pages

- `/i/[slug]/settings/api` — manage API clients (create, list, revoke)
- `/i/[slug]/settings/integrations` — Google accounts (moved from main settings)

### New environment variable

```
JWT_SECRET=<32+ bytes hex>
```

## Implementation approach

TDD — tests written first (failing), then implementation until passing, then commit. See `docs/api-first-refactor.md` for the full phase-by-phase plan with GIVEN/WHEN/THEN test examples and response shape specs.

## Dependencies

None — this is standalone and additive.

## Acceptance Criteria

- [ ] `POST /api/auth/token` returns a JWT for valid `client_id` + `client_secret`
- [ ] All `/api/v1/` endpoints return 401 without a valid token
- [ ] All `/api/v1/` endpoints return 403 for insufficient scope
- [ ] Todos CRUD works end-to-end via API
- [ ] Bookmarks can be created by URL (server-side fetch) and by full body
- [ ] Feeds can be created by URL; entries can be marked read/starred
- [ ] Google accounts + calendars are listed
- [ ] Newspaper can be generated from a template_id or raw config
- [ ] API client management UI works (create shows secret once, revoke deactivates)
- [ ] All integration tests pass (`pnpm test`)
- [ ] OpenAPI spec and Postman collection written
