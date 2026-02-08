# Feature: Newspaper

Custom newspaper builder that aggregates content from other features into printable/readable editions.

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/i/[slug]/newspaper` | Server page | Lists all newspapers |
| `/i/[slug]/newspaper/[id]` | Server page | Newspaper editor (blocks + editions) |
| `/i/[slug]/newspaper/[id]/preview` | Server page | Edition preview (accepts `?edition=` query param) |

## Database

**Table:** `newspapers`

| Column | Type | Notes |
|--------|------|-------|
| `title` | text | Default "My Newspaper" |
| `description` | text | Optional |
| `kindle_email` | text | Optional, for Kindle delivery |

**Table:** `newspaper_blocks`

| Column | Type | Notes |
|--------|------|-------|
| `newspaper_id` | uuid FK | Parent newspaper |
| `block_type` | block_type enum | `todos`, `notes`, `rss`, `articles`, `text`, `weather` |
| `title` | text | Block title |
| `config` | JSONB | Block-specific configuration |
| `sort_order` | integer | Display order (0-based) |

**Table:** `newspaper_editions`

| Column | Type | Notes |
|--------|------|-------|
| `newspaper_id` | uuid FK | Parent newspaper |
| `title` | text | e.g., "My Newspaper - Saturday, February 8, 2026" |
| `content` | JSONB | Snapshot of all block data at generation time |

## Block Types & Config

| Block Type | Config Schema | Data Fetched |
|------------|--------------|--------------|
| `todos` | (none) | Top 10 incomplete todos by priority |
| `notes` | `{ filter?: "pinned" }` | Latest 5 notes (or pinned only) |
| `rss` | `{ feed_id: string, max_items?: number }` | Latest entries from specific feed |
| `articles` | (none) | Latest 5 non-archived articles |
| `text` | `{ body: string }` | Static text content |
| `weather` | `{ location: string }` | Location name (no actual API yet) |

## Server Actions (`newspaper/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `createNewspaper` | `(slug)` | Create newspaper, redirect to editor |
| `updateNewspaper` | `(slug, id, formData)` | Update title, description, kindle_email |
| `deleteNewspaper` | `(slug, id)` | Delete newspaper, redirect to list |
| `addBlock` | `(slug, newspaperId, formData)` | Add block with type, title, config |
| `updateBlock` | `(slug, blockId, formData)` | Update block title + config |
| `deleteBlock` | `(slug, blockId, newspaperId)` | Delete block |
| `moveBlock` | `(slug, blockId, newspaperId, direction)` | Swap sort_order with adjacent block |
| `generateEdition` | `(slug, newspaperId)` | Snapshot all block data into edition, redirect to preview |

## Components (`src/modules/newspaper/components/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `AddBlockForm` | `{ newspaperId, slug }` | Form to add a new block (type selector + config) |
| `BlockEditor` | `{ block, isFirst, isLast, slug }` | Edit block title/config, move up/down, delete |
| `NewspaperPreview` | `{ edition }` | Renders edition JSON content as readable newspaper |

## Edition Generation Flow

1. User clicks "Generate Edition" on a newspaper
2. `generateEdition` action fetches all blocks in sort order
3. For each block, queries the relevant data from the instance (todos, notes, feeds, articles, or static content)
4. Creates a `newspaper_editions` row with all block data as a JSON snapshot
5. Redirects to the preview page with `?edition=[id]`

The edition is a point-in-time snapshot - it doesn't update if the underlying data changes.
