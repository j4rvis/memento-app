## ADDED Requirements

### Requirement: Google accounts linked to an instance can be listed via API
The system SHALL expose `GET /api/v1/google/accounts`. It SHALL return all Google OAuth accounts associated with the authenticated instance.

#### Scenario: Authenticated request returns Google accounts
- **WHEN** `GET /api/v1/google/accounts` is called with a valid JWT containing `google:read`
- **THEN** the system returns 200 with `{ "data": [{ id, email, created_at }] }`

#### Scenario: Unauthenticated request returns 401
- **WHEN** `GET /api/v1/google/accounts` is called without Authorization header
- **THEN** the system returns 401

#### Scenario: Insufficient scope returns 403
- **WHEN** `GET /api/v1/google/accounts` is called with a JWT that lacks `google:read` and `*`
- **THEN** the system returns 403

#### Scenario: Instance with no Google accounts returns empty list
- **WHEN** `GET /api/v1/google/accounts` is called for an instance with no linked Google accounts
- **THEN** the system returns 200 with `{ "data": [] }`

### Requirement: Google calendars for an instance can be listed via API
The system SHALL expose `GET /api/v1/google/calendars`. It SHALL return calendars grouped by Google account. An optional `account_id` query param SHALL filter to a specific account.

#### Scenario: All calendars are returned grouped by account
- **WHEN** `GET /api/v1/google/calendars` is called with a valid JWT containing `google:read`
- **THEN** the system returns 200 with `{ "data": [{ account_id, email, calendars: [{ google_calendar_id, name, color }] }] }`

#### Scenario: Filtering by account_id returns only that account's calendars
- **WHEN** `GET /api/v1/google/calendars?account_id=<uuid>` is called
- **THEN** the system returns 200 with `{ "data": [{ account_id, email, calendars: [...] }] }` containing only the specified account

#### Scenario: Unknown account_id returns empty list
- **WHEN** `GET /api/v1/google/calendars?account_id=<unknown-uuid>` is called
- **THEN** the system returns 200 with `{ "data": [] }`
