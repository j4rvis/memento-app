## MODIFIED Requirements

### Requirement: Feeds can be listed via API
The system SHALL expose `GET /api/v1/feeds`. It SHALL return all feeds for the authenticated instance including an `unread_count` derived from unread `feed_entries`. The response SHALL include `provider` and `provider_resource_type` fields for each feed.

#### Scenario: Authenticated request returns feeds with provider fields
- **WHEN** `GET /api/v1/feeds` is called with a valid JWT containing `feeds:read`
- **THEN** the system returns 200 with `{ "data": [{ id, title, url, site_url, description, unread_count, last_fetched_at, provider, provider_resource_type, created_at }] }`

#### Scenario: Unauthenticated request returns 401
- **WHEN** `GET /api/v1/feeds` is called without Authorization header
- **THEN** the system returns 401

### Requirement: A single feed can be retrieved via API
The system SHALL expose `GET /api/v1/feeds/:id`. It SHALL return the feed record if it belongs to the authenticated instance. The response SHALL include `provider` and `provider_resource_type` fields.

#### Scenario: Known feed is returned with provider fields
- **WHEN** `GET /api/v1/feeds/:id` is called with a valid JWT
- **THEN** the system returns 200 with `{ "data": { ...feed, provider, provider_resource_type } }`

#### Scenario: Unknown feed returns 404
- **WHEN** `GET /api/v1/feeds/:id` is called with an unknown id
- **THEN** the system returns 404
