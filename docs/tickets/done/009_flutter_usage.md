# 009 Flutter Usage Exploration

## Request

- The performance of the current app is still a little bit too slow
- Desire for close-to-native performance
- Startup loads too many things before rendering / taking from local storage
- Local-first is the plan
- Explore if Flutter would be a good addition to the app
- Allow a native Android app next to the current Next.js app
- Server stuff could still be Next.js
- Does Supabase allow that?
- Don't implement yet — just create a possible plan with tickets to review later
- Amend the ticket folder structure to add a `todo/` folder for Claude-planned tickets
- Update CLAUDE.md accordingly
- Add session usage reporting after each question (NOTE: see limitation below)

## Plan

### 1. Folder Structure Changes

- Create `docs/tickets/todo/` — a staging area for Claude-planned tickets awaiting user review before being moved to `backlog/`
- Update CLAUDE.md ticket workflow section to describe `todo/` purpose and flow

### 2. Session Usage Reporting

I cannot access Anthropic session credit usage data during a conversation — the API does not expose remaining 5-hour or weekly session percentages to the model. I will **not** add this to CLAUDE.md since it cannot be reliably implemented. If the Anthropic dashboard or a future API exposes this, it can be revisited.

### 3. Flutter + Supabase Feasibility

**Short answer: Yes, Supabase fully supports Flutter.**

Supabase publishes an official `supabase_flutter` Dart package with support for:
- Auth (email/password, magic link, OAuth, deep link callbacks)
- Database queries (PostgREST REST client)
- Realtime subscriptions (websocket channels)
- Storage

Both the Next.js web app and a Flutter Android app can share the **exact same Supabase project** (same auth, same DB, same RLS policies). No backend changes are required.

**Proposed Architecture:**

```
┌────────────────────┐     ┌──────────────────────────┐
│   Next.js Web App  │     │   Flutter Android App    │
│                    │     │                          │
│  - Web UI (PWA)    │     │  - Native Android UI     │
│  - Server Actions  │     │  - Local SQLite (drift)  │
│  - RSS fetching    │     │  - Offline-first          │
│  - Article scrape  │     │  - Supabase Realtime sync│
└────────┬───────────┘     └────────────┬─────────────┘
         │                              │
         └──────────┬───────────────────┘
                    │
         ┌──────────▼───────────┐
         │   Supabase Backend   │
         │                      │
         │  - Postgres (RLS)    │
         │  - Auth              │
         │  - Realtime          │
         │  - Edge Functions    │
         └──────────────────────┘
```

**Local-first approach in Flutter:**
- `drift` package: type-safe SQLite ORM for local storage
- On app open: render from local DB instantly (no loading screen)
- Background sync with Supabase Realtime + REST
- Conflict resolution: last-write-wins using `updated_at` timestamps (already on all tables)

**Server-side features stay in Next.js:**
- RSS feed fetching (cron/server actions)
- Article scraping (`@mozilla/readability`)
- Newspaper building
- Flutter consumes already-processed data from Supabase tables

### 4. Flutter Tickets to Create

Create the following tickets in `backlog/`:

| Ticket | Title |
|--------|-------|
| `010_flutter_project_setup.md` | Initialize Flutter project, directory structure, Supabase config |
| `011_flutter_auth.md` | Auth flow: login, signup, session persistence, deep links |
| `012_flutter_local_db.md` | Local-first SQLite with `drift`, schema mirroring Supabase tables |
| `013_flutter_sync.md` | Supabase Realtime + REST sync engine with conflict resolution |
| `014_flutter_todos.md` | Todos feature: list, create, toggle, delete, projects |
| `015_flutter_notes.md` | Notes feature: list, create, edit, delete |
| `016_flutter_articles.md` | Articles feature: read-later list, in-app reader |

## Summary

- Created `docs/tickets/todo/` folder with a README explaining its purpose
- Updated CLAUDE.md ticket workflow to describe the `todo/` → `backlog/` → `done/` flow
- Documented Flutter + Supabase feasibility analysis above
- Created Flutter planning tickets `010`–`016` in `backlog/`
- Session usage reporting was not added (Anthropic API does not expose this data to the model)

Completed: 2026-03-01
