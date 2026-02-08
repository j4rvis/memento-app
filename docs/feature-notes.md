# Feature: Notes

Note-taking with markdown content and pin support.

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/i/[slug]/notes` | Server page | Lists all notes (pinned first) |
| `/i/[slug]/notes/[id]` | Server page | Note editor |

## Database

**Table:** `notes`

| Column | Type | Notes |
|--------|------|-------|
| `title` | text | Default "Untitled Note" |
| `content` | text | Markdown content |
| `is_pinned` | boolean | Default false, pinned notes appear first |

## Server Actions (`notes/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `createNote` | `(slug)` | Create blank note, redirect to editor |
| `updateNote` | `(slug, id, formData)` | Update title + content |
| `deleteNote` | `(slug, id)` | Delete note, redirect to list |
| `togglePin` | `(slug, id)` | Toggle is_pinned |

## Components (`src/modules/notes/components/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `NoteCard` | `{ note, slug }` | Card with title preview, pin indicator, links to editor |
| `NoteEditor` | `{ note, slug }` | Full editor with title input, textarea, save/delete/pin actions |
