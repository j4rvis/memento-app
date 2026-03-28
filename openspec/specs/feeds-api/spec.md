## ADDED Requirements

### Requirement: Feeds can be listed via API
The system SHALL expose `GET /api/v1/feeds`. It SHALL return all feeds for the authenticated instance including an `unread_count` derived from unread `feed_entries`.

#### Scenario: Authenticated request returns feeds
- **WHEN** `GET /api/v1/feeds` is called with a valid JWT containing `feeds:read`
- **THEN** the system returns 200 with `{ "data": [{ id, title, url, site_url, description, unread_count, last_fetched_at, created_at }] }`

#### Scenario: Unauthenticated request returns 401
- **WHEN** `GET /api/v1/feeds` is called without Authorization header
- **THEN** the system returns 401

### Requirement: A single feed can be retrieved via API
The system SHALL expose `GET /api/v1/feeds/:id`. It SHALL return the feed record if it belongs to the authenticated instance.

#### Scenario: Known feed is returned
- **WHEN** `GET /api/v1/feeds/:id` is called with a valid JWT
- **THEN** the system returns 200 with `{ "data": { ...feed } }`

#### Scenario: Unknown feed returns 404
- **WHEN** `GET /api/v1/feeds/:id` is called with an unknown id
- **THEN** the system returns 404

### Requirement: Feeds can be added by URL via API
The system SHALL expose `POST /api/v1/feeds`. When called with `{ "url": "https://..." }`, it SHALL parse the feed URL using the existing feed-parser, save the feed record, and return it.

#### Scenario: Valid feed URL is added
- **WHEN** `POST /api/v1/feeds` is called with `{ "url": "https://example.com/feed.xml" }` and a JWT with `feeds:write`
- **THEN** the system parses the feed, saves it, and returns 201 with `{ "data": { ...feed } }`

#### Scenario: Duplicate feed URL returns 409
- **WHEN** `POST /api/v1/feeds` is called with a URL that already exists in the instance
- **THEN** the system returns 409 with `{ "error": { "code": "CONFLICT", ... } }`

#### Scenario: Missing URL returns 422
- **WHEN** `POST /api/v1/feeds` is called without a `url` field
- **THEN** the system returns 422

### Requirement: Feeds can be deleted via API
The system SHALL expose `DELETE /api/v1/feeds/:id`. It SHALL permanently delete the feed and its entries.

#### Scenario: Existing feed is deleted
- **WHEN** `DELETE /api/v1/feeds/:id` is called with a valid JWT with `feeds:write`
- **THEN** the system returns 204 with no body

### Requirement: Feed articles can be listed via API
The system SHALL expose `GET /api/v1/feeds/:id/articles`. It SHALL support query params `limit` (default 50) and `is_read` (optional boolean filter).

#### Scenario: Unread articles are listed
- **WHEN** `GET /api/v1/feeds/:id/articles?is_read=false` is called with a valid JWT with `feeds:read`
- **THEN** the system returns 200 with `{ "data": [{ id, title, url, summary, author, published_at, is_read, is_starred, created_at }] }`

#### Scenario: Unknown feed returns 404
- **WHEN** `GET /api/v1/feeds/:id/articles` is called with an unknown feed id
- **THEN** the system returns 404

### Requirement: A single feed article can be retrieved via API
The system SHALL expose `GET /api/v1/feeds/:id/articles/:article_id`. It SHALL return the article if it belongs to the specified feed and instance.

#### Scenario: Known article is returned
- **WHEN** `GET /api/v1/feeds/:id/articles/:article_id` is called with a valid JWT
- **THEN** the system returns 200 with `{ "data": { ...article } }`

#### Scenario: Unknown article returns 404
- **WHEN** `GET /api/v1/feeds/:id/articles/:article_id` is called with an unknown article id
- **THEN** the system returns 404

### Requirement: Feed article read/starred state can be updated via API
The system SHALL expose `PATCH /api/v1/feeds/:id/articles/:article_id`. It SHALL accept `{ "is_read"?: boolean, "is_starred"?: boolean }` and update only the provided fields.

#### Scenario: Article is marked as read
- **WHEN** `PATCH /api/v1/feeds/:id/articles/:article_id` is called with `{ "is_read": true }` and a JWT with `feeds:write`
- **THEN** the system returns 200 with `{ "data": { id, is_read: true, is_starred } }`

#### Scenario: Empty patch body returns 422
- **WHEN** `PATCH /api/v1/feeds/:id/articles/:article_id` is called with an empty body
- **THEN** the system returns 422

### Requirement: Feed articles can be deleted via API
The system SHALL expose `DELETE /api/v1/feeds/:id/articles/:article_id`. It SHALL permanently remove the article.

#### Scenario: Existing article is deleted
- **WHEN** `DELETE /api/v1/feeds/:id/articles/:article_id` is called with a JWT with `feeds:write`
- **THEN** the system returns 204 with no body
