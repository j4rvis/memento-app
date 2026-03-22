## Context

The newspaper module already has a working `render()` engine (ticket 047) and a `newspaper_templates` DB table (ticket 048). There's an existing `GET /api/newspaper/[id]/preview` route that generates PDFs on-the-fly using session auth only. This change extends that surface with API key auth and a production-grade endpoint, without touching the preview route.

No storage layer exists yet (that's ticket 049), so all PDF endpoints generate on-the-fly for now.

## Goals / Non-Goals

**Goals:**
- Allow external clients to fetch newspaper PDFs using a static API key (no browser/OAuth)
- Enable HomeAssistant `rest_command` integration via a simple `?key=` query param
- Provide a settings UI for creating and revoking API keys (show-once pattern)
- Keep the auth helper reusable for future newspaper API routes

**Non-Goals:**
- Stored PDF retrieval by date (requires ticket 049 / Supabase Storage)
- Scheduled generation (ticket 049)
- Kindle delivery (ticket 051)
- Per-key rate limiting

## Decisions

### API key storage: hash-only, show-once

Raw keys are never persisted. Only the SHA-256 hex hash of `mnp_<64 hex chars>` is stored in `key_hash`. The raw key is returned from the server action once and discarded.

**Why over symmetric encryption:** No need to recover the raw key server-side — we only ever verify it. Hashing is simpler, with no key-management surface.

**Alternative considered:** bcrypt. Rejected — bcrypt's intentional slowness is a mismatch for API key verification on hot paths. SHA-256 is fast and sufficient when keys are long and random.

### Auth resolution order: session → Bearer → `?key=`

The `authenticateApiRequest()` helper checks in this order:
1. Supabase session cookie (existing browser sessions work transparently)
2. `Authorization: Bearer <key>` header
3. `?key=<key>` query param

**Why `?key=` at all:** HomeAssistant's `rest_command` doesn't support custom headers easily. URL param is the pragmatic escape hatch.

**Trade-off:** Keys in URLs appear in server logs and proxy access logs. Acceptable for a local HA setup; documented in the UI as a warning.

### Key lookup uses service role client

Key lookup must happen before we know the user's identity, so `createClient()` (cookie-based, RLS-scoped) can't be used. `createServiceRoleClient()` is used for the lookup, with application-level checks replacing RLS: verify `key.instance_id == template.instance_id`.

### `last_used_at` is fire-and-forget

Updated via a non-awaited promise after auth succeeds. A failed update doesn't block the response.

### `?date=` and `?generate=true` are accepted but no-ops

Forward-compatible: both params are parsed and silently ignored until ticket 049 lands. This avoids breaking HomeAssistant configs that pre-emptively include them.

### Cron route is a stub

`POST /api/newspaper/cron` returns 200 with a placeholder message. Full implementation is ticket 049's responsibility. The stub ensures the route exists at the expected path so Vercel cron config can be set up early.

## Risks / Trade-offs

- **On-the-fly generation latency** → Generating a PDF on each request takes a few seconds. HA automations should account for this with a timeout. Mitigation: document the expected response time; storage-backed serving in ticket 049 will resolve this.
- **SHA-256 with short keys** → If keys were short, SHA-256 would be vulnerable to brute-force. Mitigation: 32 random bytes (256 bits of entropy) makes brute-force infeasible.
- **Service role client in route handler** → If `authenticateApiRequest` has a bug, it could bypass RLS. Mitigation: explicit `instance_id` cross-check at the application layer; `createServiceRoleClient()` is already used elsewhere in the codebase for similar post-auth operations.

## Open Questions

- Should `write:generate` scope be required for `?generate=true` on the GET endpoint, or is `read:pdf` sufficient? (Current design: `read:pdf` covers everything on GET; `write:generate` is only for the POST endpoint.)
