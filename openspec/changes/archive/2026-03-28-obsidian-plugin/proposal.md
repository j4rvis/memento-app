## Why

Obsidian users who also use Memento have no way to interact with their data from within their notes workflow. An Obsidian plugin would let users capture bookmarks, manage todos, and trigger newspaper generation without leaving Obsidian — bridging note-taking and personal productivity.

## What Changes

- A new standalone Obsidian plugin (separate from the main Next.js app) that connects to the Memento REST API
- The plugin authenticates using existing API client credentials (client_id + client_secret → Bearer JWT)
- Surfaces three commands in Obsidian: **Save bookmark** (clipboard URL, manual entry, or current note), **Create/list todos**, **Trigger newspaper generation**
- Plugin settings panel for configuring the API base URL, client_id, and client_secret
- No changes to the existing Memento API or database — all capabilities are already exposed via `api/v1/`

## Capabilities

### New Capabilities
- `obsidian-plugin`: Obsidian plugin with settings management, API client, and commands for bookmarks, todos, and newspaper generation

### Modified Capabilities
<!-- None — all required API endpoints already exist -->

## Impact

- **New repo / package**: The plugin is a standalone TypeScript project using the Obsidian plugin API and esbuild
- **Memento API**: No changes needed — bookmarks, todos, and newspaper endpoints are already implemented
- **Auth**: Uses existing `POST /api/auth/token` to exchange credentials for a JWT; no new auth flows needed
- **Dependencies**: `obsidian` (type definitions), `esbuild` (bundler), standard fetch API
