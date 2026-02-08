# Authentication

Uses Supabase Auth with email/password. No OAuth providers configured yet.

## Auth Flow

### Signup
1. User submits email + password at `/signup`
2. `signup/actions.ts` calls `supabase.auth.signUp()` with `emailRedirectTo` pointing to `/auth/confirm`
3. User receives confirmation email
4. Clicking the link hits `/auth/confirm/route.ts` (GET) which verifies the OTP token
5. On success, redirects to `/i` (instance picker)
6. The `handle_new_user()` trigger auto-creates a profile, default instance, and owner membership

### Login
1. User submits email + password at `/login`
2. `login/actions.ts` calls `supabase.auth.signInWithPassword()`
3. On success, redirects to `/i`
4. On error, redirects to `/error?message=...`

### Sign Out
- POST to `/auth/signout/route.ts`
- Calls `supabase.auth.signOut()`
- Redirects to `/login`

## Middleware

**File:** `src/middleware.ts` -> calls `updateSession()` from `src/lib/supabase/middleware.ts`

The middleware runs on every request (except static files, images, `sw.js`, `manifest.json`) and:

1. Creates a Supabase server client with cookie-based session
2. Calls `supabase.auth.getUser()` to refresh the session
3. Redirects unauthenticated users to `/login` (except for `/`, `/login`, `/signup`, `/auth/*`, `/api/*`)

**Important:** No code should run between `createServerClient()` and `supabase.auth.getUser()` to avoid session refresh bugs.

## Supabase Clients

### Browser Client (`src/lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from "@supabase/ssr";
// Used in client components
```

### Server Client (`src/lib/supabase/server.ts`)
```typescript
import { createServerClient } from "@supabase/ssr";
// Uses cookies() from next/headers
// Used in server components, server actions, route handlers
```

### Middleware Client (`src/lib/supabase/middleware.ts`)
```typescript
import { createServerClient } from "@supabase/ssr";
// Uses request.cookies + response.cookies for session refresh
```

## Protected Routes

The `(app)/layout.tsx` performs a server-side auth check:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/login");
```

This is the primary guard. The middleware provides an additional redirect layer for unauthenticated users.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon/public key
```

Both are `NEXT_PUBLIC_` prefixed so they're available in browser and server contexts.
