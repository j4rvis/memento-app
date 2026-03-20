# 050 — Newspaper API & PDF Download

## Goal

Expose HTTP endpoints so external services (HomeAssistant, scripts, automations) can download the latest generated PDF without a browser session. Authenticated via API keys.

## Background

See `docs/story-newspaper.md`. Depends on ticket 047 (engine) and 048 (templates). Ticket 049 (scheduler) produces the stored PDFs this API serves.

## Database

### `newspaper_api_keys`

```sql
create table newspaper_api_keys (
  id           uuid primary key default gen_random_uuid(),
  instance_id  uuid not null references instances(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,              -- e.g. 'HomeAssistant'
  key_hash     text not null unique,       -- SHA-256 of the raw key
  scopes       text[] not null default '{"read:pdf"}',
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);
```

RLS: user sees only their own keys within the instance.

The raw key is shown **once** at creation time and never stored. Format: `mnp_<random 32 bytes hex>`.

## API Routes

### `GET /api/newspaper/[templateId]/pdf`

Returns the latest stored PDF for the template.

**Auth options (checked in order):**
1. Valid session cookie (standard Supabase session)
2. `Authorization: Bearer <api_key>` header
3. `?key=<api_key>` query param (for HomeAssistant `rest_command` simplicity)

**Query params:**
- `?date=2026-03-20` — return the PDF for a specific date (looks up by Storage path prefix)
- `?generate=true` — generate on-the-fly if no stored PDF exists for today

**Response:** `application/pdf` with `Content-Disposition: attachment; filename="morning-brief-2026-03-20.pdf"`

**Error responses:**
- `401` — missing or invalid auth
- `403` — key exists but lacks `read:pdf` scope
- `404` — no PDF found for requested date
- `500` — generation failed

### `POST /api/newspaper/[templateId]/generate`

Trigger on-demand PDF generation. Stores result in Supabase Storage and returns metadata.

**Auth:** session or API key with `write:generate` scope.

**Response:**
```json
{
  "url": "https://...",
  "path": "instance_id/template_id/2026-03-20-0600.pdf",
  "generated_at": "2026-03-20T06:00:00Z",
  "size_bytes": 284912
}
```

### `POST /api/newspaper/cron`

Internal cron runner (see ticket 049). Auth: `NEWSPAPER_CRON_SECRET`.

## API Key Management UI

Add an "API Keys" section to `/i/[slug]/settings/` (new card, below Integrations).

- List existing keys: name, scopes, created, last used
- "Create API Key" button → dialog:
  - Name input
  - Scope checkboxes: `read:pdf`, `write:generate`
  - On submit: show the raw key once in a copy-to-clipboard dialog with a warning "This key will not be shown again"
- "Revoke" button per key (delete row)

## Auth Middleware Helper

`src/modules/newspaper/lib/api-auth.ts`:

```typescript
async function authenticateApiRequest(
  request: NextRequest,
  templateId: string,
  requiredScope: string
): Promise<{ userId: string; instanceId: string } | NextResponse>
```

1. Try session cookie first (existing Supabase auth)
2. Extract key from `Authorization: Bearer` or `?key=` param
3. Hash with SHA-256, look up in `newspaper_api_keys`
4. Verify scope
5. Update `last_used_at`
6. Verify the template belongs to the same instance as the key

## HomeAssistant Integration Notes

Example HA `configuration.yaml` snippet (for docs / in-app help text):

```yaml
rest_command:
  print_newspaper:
    url: "https://your-app.com/api/newspaper/TEMPLATE_ID/pdf?key=mnp_YOUR_KEY"
    method: GET

automation:
  - alias: "Print morning newspaper"
    trigger:
      platform: time
      at: "06:30:00"
    action:
      service: rest_command.print_newspaper
```

The PDF response can then be piped to a printer using an HA shell command or a local script.

## Acceptance Criteria

- [ ] `GET /api/newspaper/[templateId]/pdf` returns latest stored PDF
- [ ] Session auth and API key auth both work
- [ ] `?generate=true` generates on-the-fly when no stored PDF exists
- [ ] `?date=` param returns a specific date's PDF
- [ ] `POST /api/newspaper/[templateId]/generate` stores and returns metadata
- [ ] API key creation shows raw key exactly once
- [ ] Key revocation deletes the row and immediately invalidates access
- [ ] `last_used_at` updated on each authenticated request
- [ ] `403` returned for valid key with wrong scope
- [ ] `404` returned cleanly when no PDF exists
