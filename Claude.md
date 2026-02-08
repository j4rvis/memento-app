# Memento App

Personal productivity app with multi-tenant workspaces. Built with Next.js, Supabase, and shadcn/ui.

## Table of Contents

| Document | Description |
|----------|-------------|
| [Project Structure](docs/structure.md) | Directory layout, routing, and file organization |
| [Database](docs/database.md) | Tables, RLS policies, migrations, and helper functions |
| [Authentication](docs/authentication.md) | Auth flow, middleware, and session management |
| [Multi-Tenancy](docs/multi-tenancy.md) | Instances, roles, feature flags, and instance resolution |
| [UI/UX](docs/ui-ux.md) | Sidebar, header, theming, shadcn components, and PWA |
| [Todos](docs/feature-todos.md) | Task management feature |
| [Notes](docs/feature-notes.md) | Note-taking feature |
| [Feeds](docs/feature-feeds.md) | RSS/Atom feed reader feature |
| [Articles](docs/feature-articles.md) | Read-later / article scraping feature |
| [Newspaper](docs/feature-newspaper.md) | Custom newspaper builder feature |

## Quick Reference

- **Package manager:** pnpm
- **Dev server:** `pnpm dev` (Turbopack)
- **Build:** `pnpm build`
- **Supabase project:** `clqihjujzadhiyreyvbf`
- **Path alias:** `@/*` maps to `./src/*`

## Tech Stack

- Next.js 16.1.6 (App Router, React 19, Turbopack)
- TypeScript 5 (strict mode)
- Supabase (Auth + Postgres with RLS)
- Tailwind CSS v4 (OKLCH colors, CSS variables)
- shadcn/ui (New York style, 16 components)
- PWA (manifest.ts + minimal service worker)

## Key Conventions

- **Server actions** take `slug` as first parameter, resolve to `instance_id` via `getInstanceIdFromSlug(slug)`
- **Server pages** use `resolveInstance(slug)` which also validates membership
- **Client components** receive `slug` as prop, use `useInstance()` / `useInstanceSlug()` for context
- **All data tables** have `instance_id` (NOT NULL) + `user_id` columns
- **RLS policies** use `(select auth.uid())` pattern (NOT bare `auth.uid()`)
- **params/searchParams** are Promises in Next.js 15+ (must `await`)
- Use `sonner` for toasts (not the deprecated shadcn `toast`)
- `revalidatePath` uses `/i/${slug}/module` format

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
