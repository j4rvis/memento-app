## Why

The newspaper feature generates daily print-ready PDFs, but there's no way for headless external clients (HomeAssistant, scripts, automations) to fetch them without a browser session. An API with key-based auth closes this gap and enables automated print workflows.

## What Changes

- New `newspaper_api_keys` table — hashed API keys with scopes, scoped to an instance/user
- New `GET /api/newspaper/[templateId]/pdf` endpoint — returns a generated PDF, authenticated via session or API key
- New `POST /api/newspaper/[templateId]/generate` endpoint — on-demand generation returning metadata
- New `POST /api/newspaper/cron` stub endpoint — internal cron runner (full scheduler lands in ticket 049)
- New `authenticateApiRequest()` helper — supports session cookie, `Authorization: Bearer`, and `?key=` query param
- New API Keys section in instance settings — create (show-once), list, and revoke keys

## Capabilities

### New Capabilities

- `newspaper-api-auth`: API key lifecycle — creation, hashing, scope enforcement, revocation, and `last_used_at` tracking
- `newspaper-pdf-endpoint`: HTTP endpoint serving generated newspaper PDFs to authenticated callers (session or API key)

### Modified Capabilities

(none)

## Impact

- New DB migration required (`newspaper_api_keys` table + RLS)
- New API routes under `src/app/api/newspaper/`
- New auth helper in `src/modules/newspaper/lib/`
- New UI components in `src/modules/newspaper/components/`
- Settings page (`/i/[slug]/settings/`) gains an API Keys card
- Depends on existing `render()` engine (ticket 047) and `newspaper_templates` DB table (ticket 048)
- No dependency on ticket 049 (scheduler/storage) — PDF is always generated on-the-fly for now
