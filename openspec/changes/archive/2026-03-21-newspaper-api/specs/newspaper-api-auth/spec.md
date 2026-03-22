## ADDED Requirements

### Requirement: API key creation
The system SHALL allow instance owners and admins to create API keys scoped to their instance. Each key SHALL have a human-readable name and one or more scopes. The raw key SHALL be returned exactly once at creation time and SHALL NOT be stored or retrievable afterwards. Only the SHA-256 hash of the raw key SHALL be persisted.

#### Scenario: Successful key creation
- **WHEN** an owner or admin submits a valid name and at least one scope
- **THEN** the system generates a key in the format `mnp_<64 hex chars>`, stores its SHA-256 hash, and returns the raw key string to the caller exactly once

#### Scenario: Raw key not re-retrievable
- **WHEN** a user views the API keys list after creating a key
- **THEN** the raw key is not shown — only the key name, scopes, created date, and last used date are visible

#### Scenario: Non-admin cannot create keys
- **WHEN** a member (non-admin, non-owner) attempts to access the API keys settings UI
- **THEN** they are redirected away from the settings page

### Requirement: API key revocation
The system SHALL allow a user to revoke (delete) any API key they created. Revocation SHALL take effect immediately — subsequent requests using the revoked key SHALL be rejected.

#### Scenario: Successful revocation
- **WHEN** a user revokes a key
- **THEN** the key row is deleted and any subsequent request using that key receives a 401 response

#### Scenario: User cannot revoke another user's key
- **WHEN** a user attempts to revoke a key they did not create
- **THEN** the deletion is rejected (RLS enforces ownership)

### Requirement: API key scope enforcement
Each key SHALL carry a list of scopes. A request using a key SHALL be rejected with 403 if the required scope for the endpoint is not present in the key's scope list.

#### Scenario: Key with correct scope is accepted
- **WHEN** a request uses a key that includes the required scope
- **THEN** authentication succeeds and the request proceeds

#### Scenario: Key with wrong scope is rejected
- **WHEN** a request uses a valid key that does not include the required scope
- **THEN** the system returns 403

### Requirement: last_used_at tracking
The system SHALL update the `last_used_at` timestamp on a key each time it is successfully used for authentication.

#### Scenario: Timestamp updated on use
- **WHEN** a request is authenticated via API key
- **THEN** the key's `last_used_at` is updated to the current time (fire-and-forget — does not block the response)

### Requirement: Multi-auth resolution
The system SHALL support three authentication methods for API routes, checked in order: session cookie, `Authorization: Bearer` header, `?key=` query param. The first valid method found SHALL be used.

#### Scenario: Session cookie takes precedence
- **WHEN** a request has both a valid session cookie and an API key
- **THEN** the session cookie is used and the API key is ignored

#### Scenario: Bearer header used when no session
- **WHEN** a request has no session cookie but a valid `Authorization: Bearer <key>` header
- **THEN** the key from the header is used for authentication

#### Scenario: Query param used as fallback
- **WHEN** a request has no session cookie and no Authorization header but a valid `?key=` param
- **THEN** the key from the query param is used for authentication

#### Scenario: No auth provided
- **WHEN** a request has no session cookie, no Authorization header, and no `?key=` param
- **THEN** the system returns 401

### Requirement: Key is instance-scoped
An API key SHALL only grant access to templates that belong to the same instance as the key. Cross-instance access SHALL be rejected.

#### Scenario: Key matches template instance
- **WHEN** a request uses a key whose `instance_id` matches the requested template's `instance_id`
- **THEN** authentication succeeds

#### Scenario: Key does not match template instance
- **WHEN** a request uses a key whose `instance_id` does not match the requested template's `instance_id`
- **THEN** the system returns 403
