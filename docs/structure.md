# Project Structure

## Directory Layout

```
src/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Authenticated route group
│   │   ├── layout.tsx            # Auth-check only (redirects to /login)
│   │   ├── account/              # User account settings (NOT instance-scoped)
│   │   │   ├── page.tsx
│   │   │   └── account-form.tsx
│   │   └── i/                    # Instance-scoped routes
│   │       ├── page.tsx          # Instance picker (auto-redirect if 1 instance)
│   │       ├── new/page.tsx      # Create instance form
│   │       └── [slug]/           # Instance scope
│   │           ├── layout.tsx    # Resolves instance, renders sidebar+header+InstanceProvider
│   │           ├── page.tsx      # Redirects to first enabled feature
│   │           ├── todos/        # pages + actions.ts
│   │           ├── notes/        # pages + actions.ts (includes [id]/)
│   │           ├── feeds/        # pages + actions.ts (includes [feedId]/)
│   │           ├── articles/     # pages + actions.ts (includes [id]/)
│   │           └── settings/     # pages + actions.ts (includes members/)
│   ├── (auth)/                   # Public auth route group
│   │   ├── login/                # Login page + actions.ts
│   │   ├── signup/               # Signup page + actions.ts
│   │   ├── error/                # Error display page
│   │   └── auth/
│   │       ├── confirm/route.ts  # Email verification (GET)
│   │       └── signout/route.ts  # Sign out (POST)
│   ├── api/
│   │   ├── articles/share/route.ts  # PWA share target (POST)
│   │   └── feeds/refresh/route.ts   # Feed refresh endpoint (POST)
│   ├── layout.tsx                # Root layout (fonts, ThemeProvider, Toaster)
│   ├── page.tsx                  # Landing page (redirects to /i if authenticated)
│   ├── manifest.ts               # PWA manifest
│   └── globals.css               # Tailwind v4 + theme variables
├── components/
│   ├── layout/
│   │   ├── app-sidebar.tsx       # Instance switcher + feature nav + settings
│   │   ├── app-header.tsx        # Sidebar trigger + theme toggle + user dropdown
│   │   └── theme-toggle.tsx      # Dark/light mode toggle
│   ├── shared/
│   │   ├── empty-state.tsx       # Reusable empty state placeholder
│   │   └── loading.tsx           # Loading spinner
│   └── ui/                       # shadcn/ui primitives (16 components)
├── hooks/
│   └── use-mobile.ts             # Mobile viewport detection
├── lib/
│   ├── instance/
│   │   ├── types.ts              # InstanceRole, InstanceFeatures, InstanceSettings, etc.
│   │   ├── context.tsx           # InstanceProvider, useInstance(), useInstanceSlug()
│   │   └── server.ts             # resolveInstance(), getInstanceIdFromSlug()
│   ├── supabase/
│   │   ├── client.ts             # Browser client (createBrowserClient)
│   │   ├── server.ts             # Server client (createServerClient with cookies)
│   │   ├── middleware.ts          # Session refresh + auth redirect logic
│   │   └── types.ts              # Generated Supabase types (Database interface)
│   └── utils.ts                  # cn() utility for className merging
├── middleware.ts                  # Next.js middleware entry (calls updateSession)
└── modules/                      # Feature modules (components + lib)
    ├── articles/
    │   ├── components/           # article-card.tsx, article-reader.tsx
    │   └── lib/                  # scraper.ts, youtube.ts
    ├── auth/
    │   └── components/           # login-form.tsx, signup-form.tsx
    ├── feeds/
    │   ├── components/           # add-feed-dialog.tsx, feed-entry-card.tsx, feed-list.tsx
    │   └── lib/                  # feed-parser.ts
    ├── notes/
    │   └── components/           # note-card.tsx, note-editor.tsx
    └── todos/
        └── components/           # add-todo-form.tsx, todo-item.tsx, todo-list.tsx
```

## Routing Architecture

The app uses Next.js App Router with two route groups:

### `(auth)/` - Public Routes
No authentication required. Includes login, signup, error display, email confirmation, and sign-out.

### `(app)/` - Authenticated Routes
The `(app)/layout.tsx` checks auth and redirects to `/login` if not authenticated. Everything beneath is protected.

**Two-tier layout:**
1. `(app)/layout.tsx` - Auth check only, no UI chrome
2. `(app)/i/[slug]/layout.tsx` - Instance-scoped layout with sidebar, header, and `InstanceProvider`

### URL Pattern
All feature routes follow: `/i/[slug]/[feature]`

| URL | Purpose |
|-----|---------|
| `/i` | Instance picker / auto-redirect |
| `/i/new` | Create new instance |
| `/i/[slug]` | Instance root (redirects to first enabled feature) |
| `/i/[slug]/todos` | Todos list |
| `/i/[slug]/notes` | Notes list |
| `/i/[slug]/notes/[id]` | Note editor |
| `/i/[slug]/feeds` | Feed list |
| `/i/[slug]/feeds/[feedId]` | Feed entries |
| `/i/[slug]/articles` | Article list |
| `/i/[slug]/articles/[id]` | Article reader |
| `/i/[slug]/settings` | Instance settings |
| `/i/[slug]/settings/members` | Member management |
| `/account` | User account (NOT instance-scoped) |

## Server Actions Pattern

All feature actions live in `src/app/(app)/i/[slug]/[feature]/actions.ts` and follow:

```typescript
"use server";
export async function someAction(slug: string, ...args) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const instanceId = await getInstanceIdFromSlug(slug);
  // ... database operation with instance_id
  revalidatePath(`/i/${slug}/feature`);
}
```

## Module Organization

Feature-specific components and utilities live in `src/modules/[feature]/`:
- `components/` - Client components (receive `slug` prop)
- `lib/` - Utilities (parsers, scrapers, etc.)

Server actions stay in the route directory, NOT in modules.
