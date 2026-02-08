# Feature: Articles

Read-later service with web scraping and YouTube support. Integrates with PWA share target for mobile sharing.

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/i/[slug]/articles` | Server page | Lists saved articles (unread, read, archived tabs) |
| `/i/[slug]/articles/[id]` | Server page | Article reader view |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/articles/share` | POST | PWA share target. Scrapes URL, saves to user's owner instance. |

## Database

**Table:** `articles`

| Column | Type | Notes |
|--------|------|-------|
| `url` | text | Original URL |
| `title` | text | Scraped or fallback title |
| `content` | text | Scraped HTML content |
| `excerpt` | text | Short summary |
| `author` | text | Article author |
| `site_name` | text | Source site name |
| `image_url` | text | Featured image |
| `content_type` | content_type enum | `article` or `youtube` |
| `youtube_video_id` | text | YouTube video ID (if applicable) |
| `is_read` | boolean | Default false |
| `is_archived` | boolean | Default false |
| `scraped_at` | timestamptz | When content was scraped |
| `scrape_error` | text | Error if scraping failed |

## Server Actions (`articles/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `saveArticle` | `(slug, formData)` | Scrape URL and save article |
| `deleteArticle` | `(slug, id)` | Delete article, redirect to list |
| `toggleRead` | `(slug, id)` | Toggle is_read |
| `toggleArchive` | `(slug, id)` | Toggle is_archived |

## Components (`src/modules/articles/components/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `ArticleCard` | `{ article, slug }` | Card with title, excerpt, site name, read/archive toggles |
| `ArticleReader` | `{ article, slug }` | Full article view with HTML content or YouTube embed |

## Libraries

**`src/modules/articles/lib/scraper.ts`**
- Uses `@mozilla/readability` + `jsdom` to extract article content
- Returns: `title`, `content`, `excerpt`, `author`, `siteName`, `imageUrl`
- Note: `parse()` returns nullable title/content - use `??` fallback

**`src/modules/articles/lib/youtube.ts`**
- `isYouTubeUrl(url)` - detect YouTube URLs
- `extractYouTubeId(url)` - extract video ID from various YouTube URL formats

## PWA Share Target

When a user shares a URL from their phone's share menu:
1. The PWA intercepts it via the manifest's `share_target` config
2. POST to `/api/articles/share` with `title`, `text`, `url` form fields
3. The handler finds the user's first owner instance
4. Scrapes the URL (or creates YouTube entry)
5. Saves to that instance's articles
6. Redirects to the articles page
