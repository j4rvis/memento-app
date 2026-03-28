# Memento Obsidian Plugin

Connect your [Obsidian](https://obsidian.md) vault to your [Memento](https://github.com/micha/memento-app) instance. Save bookmarks, create todos, and trigger newspaper generation — all without leaving Obsidian.

## Features

- **Save bookmark** — Capture a URL (pre-filled from clipboard) into Memento with an optional title
- **Create todo** — Add a todo with an optional due date
- **Generate newspaper** — Trigger newspaper generation using a saved template

## Installation

1. Copy the `memento-obsidian-plugin/` folder into your vault's `.obsidian/plugins/` directory
2. In Obsidian: **Settings → Community Plugins → Installed Plugins** — enable **Memento**

> **Tip:** You can also symlink the plugin folder during development:
> ```bash
> ln -s /path/to/memento-app/plugins/memento-obsidian-plugin \
>   /path/to/vault/.obsidian/plugins/memento
> ```

## Configuration

Go to **Settings → Memento** and fill in:

| Setting | Description |
|---------|-------------|
| **API URL** | Base URL of your Memento instance (e.g. `https://memento.example.com`) |
| **Client ID** | API client ID — create one at `Settings → API` in your Memento instance |
| **Client Secret** | The secret shown once at client creation |
| **Newspaper Template ID** | UUID of the newspaper template to use for generation (optional) |

> **Note:** Credentials are stored in `.obsidian/plugins/memento/data.json` — readable by anyone with filesystem access to your vault.

## Commands

All commands are available via the Obsidian command palette (`Ctrl/Cmd + P`):

| Command | Description |
|---------|-------------|
| **Memento: Save bookmark** | Opens a modal pre-filled with the clipboard URL |
| **Memento: Create todo** | Opens a modal to enter a title and optional due date |
| **Memento: Generate newspaper** | Triggers generation using the configured template |

## Server requirements

The Memento server must have the following configured for the plugin to work:

| Requirement | Details |
|-------------|---------|
| **`JWT_SECRET`** | Must be set in `.env.local` on the Memento server. Without it, all API requests return a 500 error. |
| **API client scopes** | The client created in **Settings → API** must include the scopes for the operations you want to use: `bookmarks:write`, `todos:write`, `newspaper:write` |

> **Tip:** Use the **Test connection** button in **Settings → Memento** to verify your credentials are working. It will show the exact HTTP status and error code if something is wrong.

## Development

```bash
cd plugins/memento-obsidian-plugin
npm install
npm run dev     # watch mode
npm run build   # production build
```
