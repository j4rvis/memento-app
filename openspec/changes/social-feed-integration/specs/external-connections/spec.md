## ADDED Requirements

### Requirement: User can connect an X account via OAuth
The system SHALL provide an OAuth 2.0 Authorization Code + PKCE flow that allows a user to connect their X (Twitter) account to an instance. On completion, an `external_connections` row SHALL be created with encrypted access and refresh tokens.

#### Scenario: User initiates X OAuth
- **WHEN** a user clicks "Connect X Account" in instance settings
- **THEN** the system redirects to X's authorization URL with a PKCE code challenge and a signed state parameter encoding the user ID and instance slug

#### Scenario: OAuth callback saves connection
- **WHEN** X redirects back to `/api/x/callback` with a valid code and state
- **THEN** the system exchanges the code for tokens, saves an `external_connections` row with encrypted tokens, and redirects to the settings page with a success indicator

#### Scenario: Invalid or tampered state is rejected
- **WHEN** the callback receives a state parameter whose HMAC signature does not verify
- **THEN** the system returns 400 and does not save any tokens

#### Scenario: User can only have one X connection per instance
- **WHEN** a user completes OAuth for X while an `external_connections` row for that provider already exists for the same user and instance
- **THEN** the system upserts the row (updates tokens) rather than creating a duplicate

### Requirement: Connected accounts are visible in settings
The system SHALL display connected external accounts in the instance settings page, showing the provider name, connected username, and connection date.

#### Scenario: Connected X account appears in settings
- **WHEN** a user visits instance settings and has a connected X account
- **THEN** the settings page shows the X account with the `x_username` and a "Disconnect" button

#### Scenario: No connections shows prompt
- **WHEN** a user visits instance settings with no external connections
- **THEN** the settings page shows a "Connect X Account" button

### Requirement: User can disconnect an external account
The system SHALL allow a user to disconnect a provider account, which deletes the `external_connections` row. Associated feeds SHALL be deleted along with their entries.

#### Scenario: Disconnecting removes connection and feeds
- **WHEN** a user clicks "Disconnect" for a connected X account and confirms
- **THEN** the `external_connections` row is deleted, all `feeds` rows with that `external_connection_id` are deleted, and all their `feed_entries` are deleted via cascade

### Requirement: Access tokens are refreshed automatically
The system SHALL refresh expired X access tokens using the stored refresh token before performing any API operation. If refresh fails, the connection SHALL be marked with a `fetch_error` and the sync skipped.

#### Scenario: Expired token is refreshed before sync
- **WHEN** the sync job runs and a connection's `token_expires_at` is in the past or within 5 minutes
- **THEN** the system calls X's token refresh endpoint, updates the `external_connections` row with new tokens, and proceeds with the sync

#### Scenario: Refresh token is invalid
- **WHEN** the token refresh request returns an error
- **THEN** the system records the error on the associated feeds' `fetch_error` column and skips syncing that connection
