# 042 — Read-Only Edition Share Link

## Goal
Generate a public, unauthenticated shareable URL for a specific newspaper edition so it can be sent to anyone without requiring a login.

## Schema Changes

### `newspaper_editions` table

```sql
ALTER TABLE newspaper_editions
  ADD COLUMN share_token text UNIQUE;
```

`share_token` is nullable. A unique partial index ensures no two editions share the same token:

```sql
CREATE UNIQUE INDEX newspaper_editions_share_token_idx
  ON newspaper_editions (share_token)
  WHERE share_token IS NOT NULL;
```

## Implementation Notes

### Share Token Generation

Server action `shareEdition(slug, editionId)`:
1. Generate a cryptographically random token: `crypto.randomBytes(24).toString('base64url')` — URL-safe, 32-char string
2. Update `newspaper_editions SET share_token = $token WHERE id = $editionId`
3. Return the full shareable URL: `https://<host>/share/edition/<token>`

Server action `unshareEdition(slug, editionId)`:
1. Update `newspaper_editions SET share_token = NULL WHERE id = $editionId`

### Edition List UI

In the edition list (from ticket 029, or wherever editions are listed), add a "Share" icon button per edition:
- If the edition has no `share_token`: clicking generates one and copies the URL to the clipboard (via `navigator.clipboard.writeText`)
- If the edition already has a `share_token`: show a filled share icon; clicking copies the existing URL
- "Unshare" option in a dropdown or tooltip: nullifies the token and shows confirmation

Visual indicator: a small globe/link icon on editions that are currently shared.

### Public Route

New route group `src/app/(share)/`:
- Layout: minimal (no sidebar, no auth check, no instance context)
- `src/app/(share)/edition/[token]/page.tsx`:
  1. Query `newspaper_editions WHERE share_token = $token` — no RLS user check (use service role or a SECURITY DEFINER function)
  2. If not found: render a 404-style page ("This edition is no longer available")
  3. If found: render the read-only edition preview using the existing `NewspaperPreview` component
  4. Show a small footer: "Created with Memento" linking to the marketing/home page
- No ability to interact — purely read-only

### RLS Consideration

The public route must read `newspaper_editions` without a Supabase user session. Options:
1. Use `createServiceRoleClient()` scoped strictly to the token lookup query
2. Add a separate RLS policy: `SELECT WHERE share_token IS NOT NULL` (allows anon reads for shared editions only)

Option 2 is cleaner — add the policy in the migration.

### Security Notes

- Tokens are unguessable (192 bits of entropy)
- No expiry by default — user must manually unshare
- The public route does not expose `instance_id`, `user_id`, or other private fields — only the edition `content` snapshot and metadata needed for rendering

## New Files
```
src/app/(share)/edition/[token]/page.tsx
src/app/(share)/layout.tsx
supabase/migrations/YYYYMMDD_edition_share_token.sql
```

## Files to Update
- Edition list UI component — add Share/Unshare buttons
- `src/app/(app)/i/[slug]/newspaper/[id]/actions.ts` — add `shareEdition`, `unshareEdition`

## Acceptance Criteria
- [ ] `share_token` column added to `newspaper_editions` with unique constraint
- [ ] "Share" button in the edition list generates a token and copies the URL
- [ ] Already-shared editions show the existing URL on click
- [ ] "Unshare" button nullifies the token
- [ ] `/share/edition/[token]` renders the edition read-only without requiring login
- [ ] Invalid or nullified tokens return a "not available" page (not a 500)
- [ ] Shared editions readable by anon users via RLS policy on `share_token IS NOT NULL`
- [ ] No private user/instance data exposed in the public route
