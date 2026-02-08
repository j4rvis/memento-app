# Feature: Feeds

RSS/Atom feed reader with read/star tracking.

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/i/[slug]/feeds` | Server page | Lists all feeds with unread counts |
| `/i/[slug]/feeds/[feedId]` | Server page | Feed entries for a specific feed |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/feeds/refresh` | POST | Refresh all feeds (accepts `?instance_id=` query param) |

## Database

**Table:** `feeds`

| Column | Type | Notes |
|--------|------|-------|
| `title` | text | Feed title (from parsed feed) |
| `url` | text | Feed URL |
| `site_url` | text | Website URL |
| `description` | text | Feed description |
| `last_fetched_at` | timestamptz | Last successful fetch |
| `fetch_error` | text | Error message from last fetch attempt |

**Table:** `feed_entries`

| Column | Type | Notes |
|--------|------|-------|
| `feed_id` | uuid FK | Parent feed |
| `guid` | text | Unique entry identifier (from feed) |
| `title` | text | Entry title |
| `url` | text | Entry link |
| `author` | text | Entry author |
| `content` | text | Full content |
| `summary` | text | Summary/excerpt |
| `image_url` | text | Featured image |
| `published_at` | timestamptz | Publication date |
| `is_read` | boolean | Default false |
| `is_starred` | boolean | Default false |

Unique constraint on `(feed_id, guid)` for upsert deduplication.

## Server Actions (`feeds/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `addFeed` | `(slug, formData)` | Parse feed URL, create feed + initial entries |
| `deleteFeed` | `(slug, id)` | Delete feed (entries cascade) |
| `refreshFeed` | `(slug, feedId)` | Re-parse feed, upsert new entries |
| `markAsRead` | `(slug, entryId)` | Mark single entry as read |
| `markAllAsRead` | `(slug, feedId)` | Mark all entries in a feed as read |
| `toggleStar` | `(slug, entryId)` | Toggle is_starred |

## Components (`src/modules/feeds/components/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `AddFeedDialog` | `{ slug }` | Dialog with URL input to add a feed |
| `FeedList` | `{ feeds, slug }` | List of feeds with unread counts |
| `FeedEntryCard` | `{ entry, slug }` | Entry card with read/star toggles |

## Libraries

**`src/modules/feeds/lib/feed-parser.ts`** - Wraps `rss-parser` to parse RSS/Atom feeds and normalize entries into a consistent format.
