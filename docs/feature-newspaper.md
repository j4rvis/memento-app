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
| `block_type` | block_type enum | `todos`, `notes`, `rss`, `articles`, `text`, `weather`, `calendar` |
| `title` | text | Block title |
| `config` | JSONB | Block-specific configuration |
| `sort_order` | integer | Display order (0-based) |

**Table:** `newspaper_editions`

| Column | Type | Notes |
|--------|------|-------|
| `newspaper_id` | uuid FK | Parent newspaper |
| `title` | text | e.g., "My Newspaper - 01.03.2026" |
| `content` | JSONB | Snapshot of all block data at generation time |

## Block Types & Config

| Block Type | Config Schema | Data Fetched |
|------------|--------------|--------------|
| `todos` | `{ max_items?: number }` | Top N incomplete todos by priority |
| `notes` | `{ filter?: "all"\|"pinned", max_items?: number }` | Latest N notes (or pinned only) |
| `rss` | `{ feed_id: string, max_items?: number }` | Latest entries from specific feed |
| `articles` | `{ mode: "latest"\|"random"\|"category"\|"specific", count?: number, category?: string, article_ids?: string[] }` | Articles filtered by mode |
| `text` | `{ body: string }` | Static text content |
| `weather` | `{ location: string }` | Real weather via Open-Meteo API (current + 3-day forecast) |
| `calendar` | `{ days_ahead?: number }` | Todos with due dates in the next N days, grouped by day |

## Server Actions (`newspaper/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `createNewspaper` | `(slug)` | Create newspaper, redirect to editor |
| `updateNewspaper` | `(slug, id, formData)` | Update title, description, kindle_email |
| `deleteNewspaper` | `(slug, id)` | Delete newspaper, redirect to list |
| `addBlock` | `(slug, newspaperId, formData)` | Add block with type, title, and structured config fields |
| `updateBlock` | `(slug, blockId, formData)` | Update block type, title, and config |
| `deleteBlock` | `(slug, blockId, newspaperId)` | Delete block |
| `moveBlock` | `(slug, blockId, newspaperId, direction)` | Swap sort_order with adjacent block |
| `generateEdition` | `(slug, newspaperId)` | Snapshot all block data into edition, redirect to preview |

Config is built server-side from prefixed form fields (`config_location`, `config_feed_id`, etc.) via the `buildConfig()` helper.

## Components (`src/modules/newspaper/components/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `AddBlockForm` | `{ newspaperId, slug, feeds, articles }` | Form to add a new block (type selector + type-specific config fields) |
| `BlockEditor` | `{ block, isFirst, isLast, slug, feeds, articles }` | Edit block type/title/config, move up/down, delete |
| `BlockConfigFields` | `{ blockType, config?, feeds?, articles? }` | Shared type-specific config form fields |
| `NewspaperPreview` | `{ edition }` | Renders edition JSON content as readable newspaper |

## Edition Generation Flow

1. User clicks "Generate Edition" on a newspaper
2. `generateEdition` action fetches all blocks in sort order
3. For each block, queries the relevant data from the instance
4. Creates a `newspaper_editions` row with all block data as a JSON snapshot
5. Redirects to the preview page with `?edition=[id]`

The edition is a point-in-time snapshot — it doesn't update if the underlying data changes.

## Weather Integration

Weather data is fetched via Open-Meteo (no API key required):
1. Geocoding API to resolve location name → lat/lon
2. Forecast API returns current conditions + 3-day forecast
3. WMO weather codes are mapped to human-readable descriptions
