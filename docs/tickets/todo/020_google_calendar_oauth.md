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

## Acceptance Criteria
- [ ] Google Cloud project setup instructions are accurate and complete
- [ ] OAuth flow completes and stores tokens
- [ ] Events sync into `google_calendar_events` table
- [ ] Multiple Google accounts can be connected per instance
- [ ] Token refresh works automatically when access token expires
- [ ] Disconnect removes all data for that account
- [ ] Settings "Integrations" tab shows connected accounts
