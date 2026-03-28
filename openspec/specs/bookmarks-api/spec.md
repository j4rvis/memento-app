## ADDED Requirements

### Requirement: Bookmarks can be listed via API
The system SHALL expose `GET /api/v1/bookmarks`. It SHALL support query params `limit` (default 50), `offset` (default 0), and `is_archived` (default false). Results SHALL be wrapped in `{ "data": [...], "meta": { "total": N } }`.

#### Scenario: Authenticated request returns bookmarks
- **WHEN** `GET /api/v1/bookmarks` is called with a valid JWT containing `bookmarks:read`
- **THEN** the system returns 200 with `{ "data": [{ id, url, title, excerpt, author, site_name, content_type, is_read, is_archived, created_at }], "meta": { "total": N } }`

#### Scenario: Unauthenticated request returns 401
- **WHEN** `GET /api/v1/bookmarks` is called without Authorization header
- **THEN** the system returns 401

### Requirement: A single bookmark can be retrieved via API
The system SHALL expose `GET /api/v1/bookmarks/:id`. It SHALL return the bookmark if it belongs to the authenticated instance.

#### Scenario: Known bookmark is returned
- **WHEN** `GET /api/v1/bookmarks/:id` is called with a valid JWT
- **THEN** the system returns 200 with `{ "data": { ...bookmark } }`

#### Scenario: Unknown bookmark returns 404
- **WHEN** `GET /api/v1/bookmarks/:id` is called with an unknown id
- **THEN** the system returns 404

### Requirement: Bookmarks can be created by URL via API
The system SHALL expose `POST /api/v1/bookmarks`. When called with only `{ "url": "https://..." }`, it SHALL server-side fetch and enrich the bookmark using the existing scraper. When called with a full body (url + title + content + excerpt), it SHALL save the provided content without scraping.

#### Scenario: URL-only create enriches the bookmark
- **WHEN** `POST /api/v1/bookmarks` is called with `{ "url": "https://example.com" }` and a JWT with `bookmarks:write`
- **THEN** the system fetches the URL, extracts metadata, and returns 201 with `{ "data": { ...bookmark } }` containing enriched `title`, `excerpt`, and `site_name`

#### Scenario: Full-body create saves provided content
- **WHEN** `POST /api/v1/bookmarks` is called with `{ "url": "...", "title": "My Title", "content": "...", "excerpt": "..." }`
- **THEN** the system returns 201 with `{ "data": { ...bookmark } }` using the provided values without scraping

#### Scenario: Duplicate URL returns 409
- **WHEN** `POST /api/v1/bookmarks` is called with a URL that already exists in the instance
- **THEN** the system returns 409 with `{ "error": { "code": "CONFLICT", "message": "Bookmark with this URL already exists" } }`

#### Scenario: Missing URL returns 422
- **WHEN** `POST /api/v1/bookmarks` is called without a `url` field
- **THEN** the system returns 422 with `{ "error": { "code": "VALIDATION_ERROR", "message": "url is required" } }`

### Requirement: Bookmarks can be deleted via API
The system SHALL expose `DELETE /api/v1/bookmarks/:id`. It SHALL permanently delete the bookmark.

#### Scenario: Existing bookmark is deleted
- **WHEN** `DELETE /api/v1/bookmarks/:id` is called with a valid JWT with `bookmarks:write`
- **THEN** the system returns 204 with no body

#### Scenario: Unknown bookmark returns 404
- **WHEN** `DELETE /api/v1/bookmarks/:id` is called with an unknown id
- **THEN** the system returns 404
