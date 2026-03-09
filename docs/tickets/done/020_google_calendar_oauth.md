# 020 — Google Calendar OAuth Integration

## Goal
Enable users to connect one or more Google accounts and sync their Google Calendar events into Memento, so calendar widgets in the Newspaper feature (and potentially other modules) can display real events.

## Background
This is a greenfield integration — no existing Google Cloud project. This ticket covers OAuth2 setup, token storage, and event sync. Calendar widgets themselves are built in ticket 022.

**This integration is entirely optional.** The calendar widget (ticket 022) works without it as a standalone printable template. Google Calendar is purely an additive overlay for users who want their events pre-populated before printing.

## Google Cloud Setup (one-time, by developer)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **New Project** → name it "Memento"
2. Enable **Google Calendar API** (APIs & Services → Library)
3. **OAuth consent screen** (APIs & Services → OAuth consent screen):
   - User Type: External
   - App name: Memento, support email, developer contact
   - Scopes: add `https://www.googleapis.com/auth/calendar.readonly`
   - Test users: add your own email
4. **Credentials** (APIs & Services → Credentials) → Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/google/callback` (dev) + `https://your-domain.com/api/google/callback` (prod)
5. Copy **Client ID** and **Client Secret** → add to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
   ```

## Database Schema

### New table: `google_accounts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | NOT NULL |
| `instance_id` | uuid FK → instances | NOT NULL |
| `google_email` | text | The Google account email |
| `access_token` | text | Encrypted at rest (via Supabase Vault or pgcrypto) |
| `refresh_token` | text | Encrypted at rest |
| `token_expires_at` | timestamptz | |
| `scopes` | text[] | Granted scopes |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

RLS: users can only see/manage their own accounts within the instance.

### New table: `google_calendar_events` (sync cache)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `google_account_id` | uuid FK | |
| `instance_id` | uuid FK | |
| `user_id` | uuid FK | |
| `google_event_id` | text | Google's event ID |
| `calendar_id` | text | Google calendar ID |
| `title` | text | |
| `description` | text | nullable |
| `start_at` | timestamptz | |
| `end_at` | timestamptz | |
| `all_day` | boolean | |
| `location` | text | nullable |
| `color` | text | nullable (Google's colorId mapped to hex) |
| `recurrence` | text[] | RRULE strings if recurring |
| `synced_at` | timestamptz | |

Unique constraint: `(google_account_id, google_event_id)`.

## API Routes

### `GET /api/google/auth?slug=<instance-slug>`
Initiates OAuth flow. Generates state JWT (contains user_id + instance slug), redirects to Google consent URL.

### `GET /api/google/callback`
Handles OAuth callback:
1. Validate state JWT
2. Exchange code for tokens
3. Fetch user info (email)
4. Upsert `google_accounts` row
5. Trigger initial sync
6. Redirect to `/i/[slug]/settings?tab=integrations`

### `POST /api/google/sync` (server action or route)
Syncs events for a given account:
1. Refresh token if expired
2. Fetch events from Google Calendar API (next 60 days + past 7 days)
3. Upsert into `google_calendar_events`
4. Update `synced_at`

## Settings UI
Add a new "Integrations" tab to `/i/[slug]/settings/`:
- List connected Google accounts (email, last synced)
- "Connect Google Account" button → initiates OAuth
- "Sync Now" button per account
- "Disconnect" button (deletes account + events)

## Server Actions (`src/modules/google-calendar/actions.ts`)

| Action | Description |
|--------|-------------|
| `disconnectGoogleAccount(slug, accountId)` | Delete account + cascade events |
| `syncGoogleAccount(slug, accountId)` | Trigger manual sync |
| `listGoogleAccounts(slug)` | List connected accounts |

## Module Location
`src/modules/google-calendar/`
- `lib/oauth.ts` — OAuth URL builder, token exchange, token refresh
- `lib/sync.ts` — Event fetch + upsert logic
- `lib/types.ts` — TypeScript interfaces
- `actions.ts` — Server actions
- `components/GoogleAccountsList.tsx`
- `components/ConnectGoogleButton.tsx`

## Security Notes
- State parameter must be a signed JWT (use `jose` library) to prevent CSRF
- Tokens stored encrypted — use Supabase Vault if available, else pgcrypto `pgp_sym_encrypt`
- Refresh tokens are long-lived — must be stored securely and never exposed to client
- Scopes: request only `calendar.readonly` — no write access needed

## Plan

### Prerequisites (one-time dev setup)
- Follow the Google Cloud Setup instructions in this ticket
- Add env vars to `.env.local` (see below)
- Add `GOOGLE_TOKEN_SECRET` (32+ char random string) for AES-256-GCM token encryption

### New env vars
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
GOOGLE_TOKEN_SECRET=
```

### Step 1 — Database migrations (via Supabase MCP)
1. Create `google_accounts` table with `access_token`/`refresh_token` stored as AES-256-GCM ciphertext (encrypted in app layer)
2. Create `google_calendar_events` table with unique constraint on `(google_account_id, google_event_id)`
3. Add RLS policies (user sees only own rows within instance)
4. Add `set_updated_at()` trigger to `google_accounts`

### Step 2 — Token encryption (`src/modules/google-calendar/lib/encryption.ts`)
- `encryptToken(plaintext: string): string` — AES-256-GCM with `GOOGLE_TOKEN_SECRET`, returns `iv:authTag:ciphertext` hex string
- `decryptToken(ciphertext: string): string` — reverse

### Step 3 — OAuth helpers (`src/modules/google-calendar/lib/oauth.ts`)
- `buildAuthUrl(state: string): string` — constructs Google OAuth URL with `calendar.readonly` scope
- `exchangeCode(code: string): TokenResponse` — POST to `https://oauth2.googleapis.com/token`
- `refreshAccessToken(refreshToken: string): { access_token, expires_in }` — token refresh
- State: signed with `crypto.createHmac('sha256', GOOGLE_TOKEN_SECRET)` over `JSON.stringify({userId, slug, nonce})`, passed as hex — no extra deps

### Step 4 — Sync helpers (`src/modules/google-calendar/lib/sync.ts`)
- `syncAccount(accountId: string, userId: string, instanceId: string): void`
  1. Load account, decrypt tokens
  2. Refresh if `token_expires_at < now + 5min`
  3. Fetch events from `https://www.googleapis.com/calendar/v3/calendars/primary/events` (timeMin = -7 days, timeMax = +60 days)
  4. Upsert into `google_calendar_events`
  5. Update `synced_at`

### Step 5 — TypeScript types (`src/modules/google-calendar/lib/types.ts`)
- `GoogleAccount`, `GoogleCalendarEvent`, `TokenResponse` interfaces

### Step 6 — API routes
- `src/app/api/google/auth/route.ts` — GET: validate auth session, build state HMAC, redirect to Google
- `src/app/api/google/callback/route.ts` — GET: validate state, exchange code, fetch email via `https://www.googleapis.com/oauth2/v2/userinfo`, upsert account, trigger sync, redirect to `/i/[slug]/settings?tab=integrations`

### Step 7 — Server actions (`src/modules/google-calendar/actions.ts`)
- `listGoogleAccounts(slug)` — fetch accounts for current user+instance
- `syncGoogleAccount(slug, accountId)` — manual sync trigger
- `disconnectGoogleAccount(slug, accountId)` — delete account (cascade deletes events via FK)

### Step 8 — Settings UI
- Modify `src/app/(app)/i/[slug]/settings/page.tsx` to add an "Integrations" section (below General/Features)
- `GoogleAccountsList` server component: shows connected accounts with email, last synced timestamp
- `ConnectGoogleButton` client component: links to `/api/google/auth?slug=<slug>`
- Inline "Sync Now" / "Disconnect" buttons using server actions

### Step 9 — Supabase type regeneration
- Regenerate types after migrations

### Order of implementation
DB migrations → encryption → oauth → sync → types → API routes → actions → UI → type regen

## Acceptance Criteria
- [ ] Google Cloud project setup instructions are accurate and complete
- [x] OAuth flow completes and stores tokens
- [x] Events sync into `google_calendar_events` table
- [x] Multiple Google accounts can be connected per instance
- [x] Token refresh works automatically when access token expires
- [x] Disconnect removes all data for that account
- [x] Settings "Integrations" tab shows connected accounts

## Summary

Implemented Google Calendar OAuth integration. DB migration creates `google_accounts` and `google_calendar_events` tables with RLS. Tokens are AES-256-GCM encrypted (app layer, `GOOGLE_TOKEN_SECRET` env var). State parameter uses HMAC-SHA256 (no extra deps). OAuth routes live at `/api/google/auth` and `/api/google/callback`. Sync fetches events ±7/60 days via Google Calendar API with automatic token refresh. Settings page gains an "Integrations" card with connect/sync/disconnect UI. Supabase types regenerated.

**Env vars required before use:**
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
GOOGLE_TOKEN_SECRET=<random 32+ char string>
```

Completed: 2026-03-09
