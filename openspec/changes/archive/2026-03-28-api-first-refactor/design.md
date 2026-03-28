## Context

The app exposes all functionality through Next.js server actions tied to browser sessions. External tools (Obsidian, Home Assistant, CLI scripts) need a stable, credential-based interface. The existing `newspaper_api_keys` system handles one specific case (newspaper PDF rendering) but is not generalizable. This design adds a parallel JWT-based API layer covering all major resources without modifying any existing code paths.

## Goals / Non-Goals

**Goals:**
- Expose a versioned REST API at `/api/v1/` covering todos, bookmarks, feeds, articles, Google accounts/calendars, and newspaper generation
- Authenticate API requests with short-lived JWTs issued via client credentials
- Store client credentials (client_id + hashed secret) in a new `api_clients` table with instance scoping and scope grants
- Provide a frontend UI to manage API clients within instance settings
- Keep all existing UI and server action flows untouched

**Non-Goals:**
- Replacing or modifying the `newspaper_api_keys` system
- Replacing browser session auth for the UI
- Real-time / webhook delivery
- OAuth 2.0 client registration or dynamic scopes
- Rate limiting (can be added later via middleware)

## Decisions

### JWT over API keys
**Decision:** Issue short-lived JWTs (HS256, 24h) on `POST /api/auth/token` rather than long-lived opaque keys.
**Rationale:** JWTs are self-contained — the API route can verify identity and scopes without a database round-trip on every request. 24h expiry limits blast radius for leaked tokens. Clients that need longer sessions just re-authenticate.
**Alternative considered:** Long-lived opaque bearer tokens stored in DB (like `newspaper_api_keys`). Rejected because it requires a DB lookup on every API call and doesn't carry scopes inline.

### `jose` for JWT implementation
**Decision:** Use the `jose` npm package for JWT sign/verify.
**Rationale:** `jose` is Web Crypto-based and edge-compatible (works in Next.js Edge Runtime). It's actively maintained, well-typed, and already used in the Next.js ecosystem. No native Node.js crypto binding required.
**Alternative considered:** `jsonwebtoken`. Rejected because it's Node.js-only (not edge-compatible) and uses older async patterns.

### Service role client in API routes
**Decision:** API routes use `createServiceRoleClient()` and filter data by the `instance_id` from the JWT payload rather than relying on RLS.
**Rationale:** API routes are server-side code not tied to a Supabase session. The JWT payload is the authoritative source for which instance the request is scoped to. Explicit `.eq('instance_id', instanceId)` queries are auditable and don't require setting up a fake auth session.
**Alternative considered:** Using the anon client with a fabricated auth session. Rejected as fragile and harder to reason about.

### SHA-256 secret hashing
**Decision:** Store only `SHA-256(raw_secret)` in the `api_clients` table. The raw secret is shown once to the user on client creation and never stored.
**Rationale:** Standard practice. If the DB is compromised, stored hashes don't allow impersonation without brute-forcing the secret.
**Note:** SHA-256 is acceptable here because the raw secret is a 64-char random hex string (256 bits of entropy), making brute-force infeasible.

### `{ data, meta?, error? }` response envelope
**Decision:** All API responses wrap their payload in a consistent envelope.
**Rationale:** Makes machine parsing predictable. Errors always appear in `error.code` + `error.message`; success payloads in `data`; pagination metadata in `meta`.
**Structure:**
```
// Success
{ "data": <payload>, "meta"?: { "total": N } }
// Error
{ "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

### Scope system
**Decision:** String scopes in `resource:action` format stored as `text[]` on `api_clients`. JWT payload carries the granted scopes. `*` grants all access.
**Rationale:** Simple to implement, easy to reason about, extensible without schema changes.
**Scopes:** `todos:read`, `todos:write`, `bookmarks:read`, `bookmarks:write`, `feeds:read`, `feeds:write`, `google:read`, `newspaper:write`, `*`

### Instance scoping via JWT payload
**Decision:** The JWT payload includes `instance_id`. All API queries filter on this instance_id.
**Rationale:** Clients are registered per-instance; a single user can have multiple instances with separate client credentials. The instance is determined at token-issue time.

## Risks / Trade-offs

- **JWT secret rotation** → Rotating `JWT_SECRET` invalidates all active tokens. Mitigation: document this clearly; consider a short expiry (24h) so disruption is bounded.
- **No token revocation** → JWTs are stateless; a leaked token is valid until expiry. Mitigation: 24h expiry limits blast radius. Future work: token blocklist.
- **SHA-256 for secret storage** → Weaker than bcrypt for low-entropy secrets. Mitigation: enforced 64-char random hex secrets (256 bits) make brute-force infeasible.
- **Service role client** → Bugs in instance_id extraction could leak cross-instance data. Mitigation: `authenticateApiToken()` is the single gateway; always validate instance_id from JWT, never from request body.
- **Newspaper generate endpoint returns PDF** → Large response, no streaming. Mitigation: accept this for now; async job pattern is future work.

## Migration Plan

1. Add `JWT_SECRET` to Vercel environment variables (production + preview)
2. Apply `api_clients` migration via Supabase CLI
3. Deploy the Next.js changes (additive — no existing routes modified)
4. No rollback complexity: new routes are purely additive. If reverted, existing UI is unaffected.

## Open Questions

- Should `POST /api/v1/bookmarks` with `{ url }` be synchronous (scrape + return enriched) or async (return stub, enrich in background)? Current plan: synchronous, with a timeout fallback that returns the stub.
- Should the newspaper generate endpoint return the PDF directly or a download URL? Current plan: direct PDF response, with `?format=json` for metadata-only.
