# 055 — Obsidian Plugin

## Goal

Build an Obsidian community plugin that connects to the Memento API, enabling users to save bookmarks and manage todos directly from Obsidian.

## Background

Depends on ticket 054 (API-first refactor). The plugin uses `POST /api/auth/token` to obtain a JWT, then calls `/api/v1/` endpoints.

A common Obsidian workflow: the "MarkDownload" or "ReadItLater" plugin saves web pages as markdown files. The Memento plugin complements this by sending URLs to Memento as bookmarks and surfacing todo management within Obsidian notes.

## Features

### Core (v1)

**Bookmarks**
- Command: "Save current URL to Memento" — prompts for URL (or reads from clipboard), POSTs to `/api/v1/bookmarks`
- Command: "Save selection as bookmark" — sends selected text as excerpt + a URL from frontmatter or prompt
- Integrates with the "Open URL" pattern in Obsidian (works alongside MarkDownload/ReadItLater)

**Todos**
- Command: "Create Memento todo from line" — creates a todo from the current line text
- Command: "Create Memento todo" — opens a modal with title, priority, due date
- Command: "List my todos" — opens a panel showing current todos (grouped by project)
- Checkbox sync: optionally detect `- [ ]` / `- [x]` syntax in frontmatter-tagged notes and sync to Memento

### Settings panel (within Obsidian)
- API base URL (e.g. `https://your-memento.vercel.app`)
- Client ID + Client Secret input fields
- Instance slug selector (fetches instances from `/api/v1/google/accounts` or similar list endpoint — **TBD**: may need a `/api/v1/instances` endpoint)
- "Test connection" button

## Technical approach

- TypeScript plugin (standard Obsidian plugin scaffold)
- Token management: store client_id + client_secret in Obsidian plugin data; fetch JWT on first call and cache with expiry
- Use `obsidian`'s `request()` API for HTTP calls (respects CORS)
- Plugin distributed as a community plugin or via BRAT (Beta Reviewers Auto-update Tool) initially

## Files (in a separate repo or `packages/obsidian-plugin/`)

```
src/
├── main.ts           # Plugin entry point
├── settings.ts       # Settings tab
├── api.ts            # Memento API client (auth + endpoints)
├── modals/
│   ├── create-todo-modal.ts
│   └── todo-list-modal.ts
└── commands/
    ├── save-bookmark.ts
    └── todo-commands.ts
```

## Open Questions

- Should the plugin live in this repo under `packages/obsidian-plugin/` or in a separate repo?
- Does the API need a `/api/v1/instances` endpoint to let the plugin pick an instance? (Not in ticket 054 scope)
- Checkbox sync scope: read-only (Memento → Obsidian) or bidirectional?

## Dependencies

- Ticket 054 (API-first refactor) must be complete
- Possibly a new `/api/v1/instances` endpoint (small addition to ticket 054)

## Acceptance Criteria

- [ ] Plugin installs in Obsidian without errors
- [ ] Settings panel allows configuring API URL, credentials, instance
- [ ] "Save URL as bookmark" command works end-to-end
- [ ] "Create todo" command works end-to-end
- [ ] JWT is cached and refreshed transparently
- [ ] Error shown in Obsidian notification on API failure
