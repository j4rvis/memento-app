## Context

Memento exposes a REST API (`/api/v1/`) with JWT-based authentication. Obsidian plugins are TypeScript packages bundled with esbuild, loaded at runtime by the Obsidian desktop/mobile app. The plugin needs to: authenticate with Memento, then call bookmarks, todos, and newspaper endpoints.

The existing API already covers all required operations — this is a pure client-side integration effort with no backend changes.

## Goals / Non-Goals

**Goals:**
- Ship a functional Obsidian plugin that authenticates via client credentials and exposes bookmark, todo, and newspaper commands
- Store credentials securely in Obsidian's plugin data (not in vault files)
- Provide a settings panel for API URL + client_id + client_secret
- Support "Save bookmark from clipboard/selection" and "Create todo" as modal commands
- Support "Trigger newspaper generation" command (using a stored template_id or inline config)

**Non-Goals:**
- Full CRUD UI — list/delete operations are out of scope for v1 (read is nice-to-have)
- Syncing Obsidian notes to Memento
- Mobile Obsidian support (best-effort only; desktop is primary target)
- OAuth flow — API client credentials are sufficient and already supported

## Decisions

### 1. Standalone plugin repo vs. monorepo subfolder
The plugin lives in `obsidian-memento-plugin/` as a top-level directory in this repo (not a separate repo). This avoids managing multiple repos while keeping the plugin isolated.

**Alternatives considered:**
- Separate GitHub repo: cleaner, but adds friction for coordinated changes to the API and plugin.
- `packages/obsidian-plugin` subfolder in a future monorepo: premature complexity.

### 2. Token caching
Fetch a JWT once on plugin load and cache it in memory. Re-fetch when a request returns 401 (token expired). No need to persist the JWT — re-authenticating on every Obsidian launch is cheap.

**Alternatives considered:**
- Persist JWT to plugin data: simpler but leaks a credential into storage unnecessarily.

### 3. Command interaction model
- **Save bookmark**: opens a modal with two modes:
  - **URL mode** (default): pre-filled with clipboard URL if URL-shaped, allows title override, POSTs `{ url, title? }` to `/api/v1/bookmarks`.
  - **Note mode**: triggered when a note is active — sends the note as a full-body bookmark using `{ url, title, content, excerpt }` without scraping. The modal shows the resolved title and excerpt for confirmation before submitting.
- **Create todo**: opens a modal for title + optional due date, POSTs to `/api/v1/todos`.
- **Trigger newspaper**: reads `template_id` from settings, calls `POST /api/v1/newspaper/generate?format=json`, shows a notice on completion.

**Alternatives considered:**
- Context menu on links for bookmarking: adds complexity, deferred to v2.

### 4. Note URL format
Obsidian deep links use `obsidian://open?vault=<vault>&file=<path>`. The vault name is available via `app.vault.getName()` and the file path via `file.path`. Both must be URI-encoded. This produces a stable, clickable link that reopens the note.

The note title falls back to: frontmatter `title` field → filename without extension. The excerpt is the first non-empty, non-frontmatter paragraph (up to 300 chars).

**Alternatives considered:**
- Custom `note://` scheme: not universally recognized.
- Relative path only: the bookmarks API requires a URL field.

### 6. Error handling
All API errors surface as Obsidian `Notice` toasts. Network failures also show a notice. No silent failures.

## Risks / Trade-offs

- **Obsidian API changes** → Plugin targets the stable Obsidian API (`obsidian` npm package); breaking changes are rare and versioned. Mitigation: pin `obsidian` version.
- **CORS on the Memento API** → If the API doesn't set `Access-Control-Allow-Origin` for Obsidian's custom protocol, requests will fail on desktop. Mitigation: add CORS headers to all `/api/` routes if not already present.
- **Secret storage in Obsidian** → `plugin.saveData()` writes to `.obsidian/plugins/<id>/data.json` — readable by anyone with filesystem access. Mitigation: document this limitation; no better option in the Obsidian plugin model.

## Open Questions

- Does the current Memento API have CORS headers configured for non-browser origins? If not, this needs to be addressed before the plugin can make requests.
- Should the plugin support listing todos/bookmarks in a side panel (v1 or v2)?
