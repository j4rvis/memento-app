## ADDED Requirements

### Requirement: Sync endpoint accepts authenticated POST requests
The system SHALL expose `POST /api/feeds/sync` secured with a `FEEDS_SYNC_SECRET` bearer token. Requests without a valid token SHALL be rejected with 401.

#### Scenario: Valid bearer token triggers sync
- **WHEN** `POST /api/feeds/sync` is called with `Authorization: Bearer {FEEDS_SYNC_SECRET}`
- **THEN** the system runs the sync job and returns 200 with a summary of feeds processed

#### Scenario: Missing or invalid token is rejected
- **WHEN** `POST /api/feeds/sync` is called without a valid Authorization header
- **THEN** the system returns 401 and does not sync any feeds

### Requirement: Sync fetches new posts for all active social feeds
The system SHALL query all `feeds` rows where `provider != 'rss'`, refresh tokens as needed, and fetch posts published after `last_fetched_at` (or the last 24 hours if never synced). Results SHALL be upserted into `feed_entries` using `guid` as the deduplication key.

#### Scenario: New tweets are inserted as feed entries
- **WHEN** the sync job runs for an X list feed with new tweets since `last_fetched_at`
- **THEN** each tweet is inserted into `feed_entries` with `guid = 'x:{tweet_id}'`, `content` = tweet text, `author` = `@{username}`, `url` = tweet permalink, and `published_at` = tweet `created_at`

#### Scenario: Already-synced tweets are not duplicated
- **WHEN** the sync job runs and X returns tweets that have already been stored
- **THEN** the upsert on `guid` updates the row in place without creating duplicates

#### Scenario: `last_fetched_at` is updated after successful sync
- **WHEN** a feed is synced successfully
- **THEN** `feeds.last_fetched_at` is set to the current timestamp

### Requirement: Sync errors are recorded per feed
The system SHALL record sync errors on the `feeds.fetch_error` column without aborting the overall sync job. Other feeds SHALL continue to sync regardless of individual failures.

#### Scenario: Rate limit error is recorded
- **WHEN** the X API returns a 429 (rate limit) for a feed
- **THEN** `feeds.fetch_error` is set to a human-readable message, `last_fetched_at` is not updated, and the sync continues with remaining feeds

#### Scenario: Successful sync clears previous error
- **WHEN** a feed that previously had a `fetch_error` syncs successfully
- **THEN** `feeds.fetch_error` is set to null

### Requirement: Sync is scheduled 4 times per day
The system SHALL configure a cron job to call `POST /api/feeds/sync` at 00:00, 06:00, 12:00, and 18:00 UTC.

#### Scenario: Vercel cron triggers sync on schedule
- **WHEN** the cron schedule fires at one of the four daily times
- **THEN** the sync endpoint is called and processes all active social feeds
