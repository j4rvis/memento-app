# API-First Refactor Plan

## Context

The app currently mixes UI and business logic tightly in server actions and Next.js pages. The goal is to expose a proper REST API (at `/api/v1/`) so external tools (Obsidian plugin, Home Assistant, Postman) can drive todos, bookmarks, feeds, and newspaper generation — without going through the browser UI. The existing UI stays untouched. The existing `newspaper_api_keys` auth also stays — the new JWT-based auth is additive, only for `/api/v1/` endpoints.

---

## Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Token format | JWT (HS256, 24h expiry) | Standard, self-contained, edge-compatible |
| Client credentials | `client_id` + `client_secret` → POST returns JWT | Matches user requirement |
| Existing newspaper auth | Untouched | `newspaper_api_keys` + existing endpoints stay as-is |
| API prefix | `/api/v1/` | Clean break from unversioned endpoints |
| Response format | `{ data, meta?, error? }` envelope | Machine-readable, consistent |
| Instance scoping | JWT payload carries `instance_id` | All queries `.eq('instance_id', instanceId)` with service role client |
| DB client in API routes | `createServiceRoleClient()` | Bypasses RLS, explicit scoping in query |
| Scope system | `resource:action` strings (`todos:read`, `todos:write`, ...) | Granular, extensible |

---

## New Environment Variables

```
JWT_SECRET=<32+ random bytes, hex>
```

---

## Database Migration

### `supabase/migrations/YYYYMMDD_api_clients.sql`

```sql
create table api_clients (
  id                 uuid primary key default gen_random_uuid(),
  instance_id        uuid not null references instances(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  client_id          text not null unique,      -- prefix "mc_", e.g. "mc_abc123def456"
  client_secret_hash text not null,             -- SHA-256 of raw secret
  scopes             text[] not null default '{}',
  is_active          boolean not null default true,
  last_used_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table api_clients enable row level security;

create policy "member view" on api_clients for select
  using ((select auth.uid()) = user_id and is_instance_member(instance_id));
create policy "member insert" on api_clients for insert
  with check ((select auth.uid()) = user_id and is_instance_member(instance_id));
create policy "member update" on api_clients for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "member delete" on api_clients for delete
  using ((select auth.uid()) = user_id);

create index idx_api_clients_instance on api_clients(instance_id);
create index idx_api_clients_client_id on api_clients(client_id);

create trigger set_api_clients_updated_at before update on api_clients
  for each row execute function set_updated_at();
```

---

## File Structure

```
src/
├── lib/api/
│   ├── types.ts           # ApiTokenPayload, ApiAuthResult, response envelope types
│   ├── auth.ts            # authenticateApiToken(request) → { userId, instanceId, scopes } | NextResponse
│   └── response.ts        # ok(), created(), notFound(), forbidden(), unauthorized(), conflict(), unprocessable()
│
├── app/api/
│   ├── auth/token/
│   │   └── route.ts       # POST /api/auth/token  (client_id + client_secret → JWT)
│   │
│   └── v1/
│       ├── todos/
│       │   ├── route.ts             # GET, POST
│       │   └── [id]/route.ts        # GET, PUT, DELETE
│       ├── bookmarks/
│       │   ├── route.ts             # GET, POST
│       │   └── [id]/route.ts        # GET, DELETE
│       ├── feeds/
│       │   ├── route.ts             # GET, POST
│       │   └── [id]/
│       │       ├── route.ts             # GET, DELETE
│       │       └── articles/
│       │           ├── route.ts             # GET
│       │           └── [article_id]/
│       │               └── route.ts         # GET, PATCH (is_read, is_starred), DELETE
│       ├── google/
│       │   ├── accounts/route.ts    # GET
│       │   └── calendars/route.ts   # GET  (?account_id=)
│       └── newspaper/
│           └── generate/route.ts    # POST (template_id | config)
│
└── modules/api-clients/
    ├── actions.ts                   # createApiClient, revokeApiClient, deleteApiClient
    └── components/
        ├── api-clients-list.tsx
        ├── create-client-dialog.tsx
        └── revoke-client-button.tsx

src/app/(app)/i/[slug]/settings/
├── api/page.tsx               # NEW: API client management
└── integrations/page.tsx      # NEW: Google accounts (moved from settings page)
```

---

## Scopes

| Scope | Allows |
|---|---|
| `todos:read` | GET /todos, GET /todos/:id |
| `todos:write` | POST, PUT, DELETE todos |
| `bookmarks:read` | GET /bookmarks, GET /bookmarks/:id |
| `bookmarks:write` | POST, DELETE bookmarks |
| `feeds:read` | GET feeds + entries |
| `feeds:write` | POST, DELETE feeds; PATCH entries |
| `google:read` | GET accounts + calendars |
| `newspaper:write` | POST /newspaper/generate |
| `*` | All scopes |

---

## Endpoint Specs

### `POST /api/auth/token`

```
Body: { "client_id": "mc_...", "client_secret": "<raw 64-char hex>" }

Response 200:
{ "access_token": "<jwt>", "token_type": "Bearer", "expires_in": 86400 }

Response 401:
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid client credentials" } }
```

JWT payload: `{ sub: userId, instance_id, scopes[], iat, exp }`

### `GET /api/v1/todos`
```
Headers: Authorization: Bearer <jwt>
Scopes: todos:read | *

Response 200:
{ "data": [{ id, title, description, is_completed, priority, due_date, project_id, created_at, updated_at }],
  "meta": { "total": N } }
```

### `POST /api/v1/todos`
```
Body: { "title": "string (required)", "description"?, "priority"?: 0-3,
        "due_date"?: "YYYY-MM-DD", "project_id"?: uuid }
Scopes: todos:write | *
Response 201: { "data": { ...todo } }
Response 422: { "error": { "code": "VALIDATION_ERROR", "message": "title is required" } }
```

### `PUT /api/v1/todos/:id`
```
Body: partial { title, description, is_completed, priority, due_date, project_id }
Scopes: todos:write | *
Response 200: { "data": { ...todo } }
Response 404: { "error": { "code": "NOT_FOUND", ... } }
```

### `GET /api/v1/bookmarks`
```
Query: ?limit=50&offset=0&is_archived=false
Response 200: { "data": [{ id, url, title, excerpt, author, site_name, content_type, is_read, is_archived, created_at }],
               "meta": { "total": N } }
```

### `POST /api/v1/bookmarks`
```
Body option A (URL only, server fetches + enriches):
  { "url": "https://..." }

Body option B (full content):
  { "url": "https://...", "title": "...", "content": "...", "excerpt": "..." }

Scopes: bookmarks:write | *
Response 201: { "data": { ...bookmark } }
Response 409: { "error": { "code": "CONFLICT", ... } }   -- duplicate URL
```

### `GET /api/v1/feeds`
```
Response 200: { "data": [{ id, title, url, site_url, description, unread_count, last_fetched_at, created_at }] }
```

### `POST /api/v1/feeds`
```
Body: { "url": "https://..." }
Response 201: { "data": { ...feed } }
Response 409: duplicate feed
```

### `GET /api/v1/feeds/:id/articles`
```
Query: ?limit=50&is_read=false
Response 200: { "data": [{ id, title, url, summary, author, published_at, is_read, is_starred, created_at }] }
```

### `PATCH /api/v1/feeds/:id/articles/:article_id`
```
Body: { "is_read"?: boolean, "is_starred"?: boolean }
Scopes: feeds:write | *
Response 200: { "data": { id, is_read, is_starred } }
```

### `GET /api/v1/google/accounts`
```
Response 200: { "data": [{ id, email, created_at }] }
```

### `GET /api/v1/google/calendars`
```
Query: ?account_id=uuid (optional)
Response 200: { "data": [{ account_id, email, calendars: [{ google_calendar_id, name, color }] }] }
```

### `POST /api/v1/newspaper/generate`
```
Body: {
  "template_id"?: uuid,    // load config from newspaper_templates
  "config"?: NewspaperConfig  // or provide directly
}
At least one required.

Scopes: newspaper:write | *

Response 200: application/pdf
  (or ?format=json → { "data": { "generated_at", "size_bytes" } })
```

---

## Testing Strategy (TDD)

All tests use **Vitest** (existing framework). Pattern: GIVEN / WHEN / THEN.

Update `vitest.config.ts` to include:
```
src/app/api/**/__tests__/**/*.test.ts
```

### Test structure example

```typescript
// src/lib/api/__tests__/auth.test.ts
describe('authenticateApiToken', () => {
  it('returns auth context for valid JWT', async () => {
    // GIVEN: valid JWT signed with correct JWT_SECRET
    // WHEN: authenticateApiToken called
    // THEN: returns { userId, instanceId, scopes }
  });

  it('returns 401 for wrong signature', async () => {
    // GIVEN: JWT signed with wrong secret
    // WHEN: authenticateApiToken called
    // THEN: NextResponse with status 401
  });

  it('returns 401 for expired JWT', async () => {
    // GIVEN: valid JWT with exp in the past
    // WHEN: authenticateApiToken called
    // THEN: NextResponse with status 401, code EXPIRED_TOKEN
  });
});
```

Each endpoint gets a `__tests__/route.test.ts` covering:
- Unauthenticated → 401
- Insufficient scope → 403
- Happy path → 200/201
- Validation error → 422
- Not found → 404
- Conflict (where applicable) → 409

---

## Implementation Order (TDD: tests first, then logic, then commit)

A task is **done** when: tests written → passing → documented → plan updated → committed.

### Phase 0: Foundation

- [ ] **0.1** `pnpm add jose` — JWT library
- [ ] **0.2** Migration: `api_clients` table
- [ ] **0.3** `src/lib/api/types.ts` — shared types
- [ ] **0.4** `src/lib/api/response.ts` — response helpers
- [ ] **0.5** `src/lib/api/auth.ts` + tests — `authenticateApiToken()`

### Phase 1: Auth Token Endpoint

- [ ] **1.1** Tests: `src/app/api/auth/token/__tests__/route.test.ts`
- [ ] **1.2** Implement `POST /api/auth/token`

### Phase 2: Todos API

- [ ] **2.1** Tests: todos list + create
- [ ] **2.2** Implement `GET /api/v1/todos`, `POST /api/v1/todos`
- [ ] **2.3** Tests: todos get + update + delete
- [ ] **2.4** Implement `GET /api/v1/todos/:id`, `PUT /api/v1/todos/:id`, `DELETE /api/v1/todos/:id`

### Phase 3: Bookmarks API

- [ ] **3.1** Tests: bookmarks list + create
- [ ] **3.2** Implement `GET /api/v1/bookmarks`, `POST /api/v1/bookmarks`
- [ ] **3.3** Tests: bookmark get + delete
- [ ] **3.4** Implement `GET /api/v1/bookmarks/:id`, `DELETE /api/v1/bookmarks/:id`

### Phase 4: Feeds API

- [ ] **4.1** Tests: feeds list + create
- [ ] **4.2** Implement `GET /api/v1/feeds`, `POST /api/v1/feeds`
- [ ] **4.3** Tests: feed get + delete
- [ ] **4.4** Implement `GET /api/v1/feeds/:id`, `DELETE /api/v1/feeds/:id`
- [ ] **4.5** Tests: feed articles
- [ ] **4.6** Implement `GET /api/v1/feeds/:id/articles`
- [ ] **4.7** Tests: entry get + patch + delete
- [ ] **4.8** Implement `GET`, `PATCH`, `DELETE /api/v1/feeds/:id/articles/:article_id`

### Phase 5: Google API

- [ ] **5.1** Tests: accounts + calendars
- [ ] **5.2** Implement `GET /api/v1/google/accounts`, `GET /api/v1/google/calendars`

### Phase 6: Newspaper Generate API

- [ ] **6.1** Tests: newspaper generate
- [ ] **6.2** Implement `POST /api/v1/newspaper/generate`

### Phase 7: Frontend Configuration Pages

- [ ] **7.1** `src/modules/api-clients/actions.ts` — server actions for CRUD
- [ ] **7.2** `src/modules/api-clients/components/` — UI components
- [ ] **7.3** `/i/[slug]/settings/api/page.tsx`
- [ ] **7.4** `/i/[slug]/settings/integrations/page.tsx` (move Google accounts here)
- [ ] **7.5** Update main settings page with links to sub-pages

### Phase 8: Documentation

- [ ] **8.1** `docs/openapi.yaml` — OpenAPI 3.1 spec for all `/api/v1/` + `/api/auth/token`
- [ ] **8.2** `docs/memento-api.postman_collection.json` — Postman collection with pre-request JWT script

### Phase 9: Backlog Tickets

- [ ] **9.1** Create `docs/tickets/backlog/XXX_obsidian_plugin.md`
- [ ] **9.2** Create `docs/tickets/backlog/XXX_home_assistant_tool.md`

---

## Key Files to Reuse

| File | Reuse for |
|---|---|
| `src/modules/articles/lib/scraper.ts` | `POST /api/v1/bookmarks` URL-only path |
| `src/modules/articles/lib/enricher.ts` | Background enrichment after bookmark insert |
| `src/modules/feeds/lib/feed-parser.ts` | `POST /api/v1/feeds` feed URL parsing |
| `src/modules/newspaper/lib/resolve-config.ts` + engine | `POST /api/v1/newspaper/generate` |
| `src/modules/newspaper/lib/api-auth.ts` | Reference pattern (do not modify, parallel system) |
| `src/modules/newspaper/components/api-keys-card.tsx` | UI pattern for api-clients components |
| `src/app/api/newspaper/render/route.ts` | Route handler pattern to follow |

---

## Verification

After each phase, verify:
1. `pnpm test` — all tests pass
2. `pnpm build` — no TypeScript errors
3. Manual: `curl -X POST /api/auth/token` with valid credentials returns JWT
4. Manual: `curl -H "Authorization: Bearer <jwt>" /api/v1/todos` returns data
5. Supabase: confirm `api_clients` RLS policies work (user can only see own clients)
