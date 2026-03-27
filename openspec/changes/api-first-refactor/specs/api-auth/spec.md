## ADDED Requirements

### Requirement: API clients can be registered with credentials
The system SHALL store API client records in an `api_clients` table. Each record SHALL contain a `client_id` (prefixed `mc_`, unique), a `client_secret_hash` (SHA-256 of the raw secret), an `instance_id`, a `user_id`, a `name`, a `scopes` array, and an `is_active` flag. The raw secret SHALL be generated as a 64-char random hex string and SHALL only be returned once at creation time.

#### Scenario: Client record is created with valid data
- **WHEN** a client is created with a name, instance_id, and scopes
- **THEN** the system stores `client_id`, `client_secret_hash`, `scopes`, `is_active=true`, and returns the raw secret once

#### Scenario: Client secret is not retrievable after creation
- **WHEN** the client list is fetched after creation
- **THEN** the raw secret is NOT included in any response; only `client_id`, `name`, `scopes`, `is_active`, `last_used_at`, `created_at` are returned

### Requirement: API clients can be revoked
The system SHALL allow a client owner to revoke a client by setting `is_active = false`. Revoked clients SHALL NOT be able to obtain new tokens.

#### Scenario: Revoked client cannot get a token
- **WHEN** `POST /api/auth/token` is called with credentials for a revoked client
- **THEN** the system returns 401 with code `INVALID_CREDENTIALS`

### Requirement: Token endpoint issues JWT for valid credentials
The system SHALL expose `POST /api/auth/token`. When called with a valid `client_id` + `client_secret`, it SHALL return a signed JWT (HS256) with a 24-hour expiry.

#### Scenario: Valid credentials return a JWT
- **WHEN** `POST /api/auth/token` is called with a correct `client_id` and `client_secret`
- **THEN** the system returns 200 with `{ "access_token": "<jwt>", "token_type": "Bearer", "expires_in": 86400 }`

#### Scenario: JWT payload contains required claims
- **WHEN** a JWT is decoded after successful authentication
- **THEN** the payload contains `sub` (userId), `instance_id`, `scopes[]`, `iat`, and `exp`

#### Scenario: Invalid credentials return 401
- **WHEN** `POST /api/auth/token` is called with a wrong `client_secret`
- **THEN** the system returns 401 with `{ "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid client credentials" } }`

#### Scenario: Missing fields return 400
- **WHEN** `POST /api/auth/token` is called without `client_id` or `client_secret`
- **THEN** the system returns 400 with `{ "error": { "code": "VALIDATION_ERROR", ... } }`

### Requirement: API routes authenticate requests via Bearer JWT
The system SHALL provide an `authenticateApiToken(request)` function. It SHALL extract the Bearer token from the `Authorization` header, verify the JWT signature using `JWT_SECRET`, check expiry, and return `{ userId, instanceId, scopes }` on success or a `NextResponse` 401 on failure.

#### Scenario: Valid JWT returns auth context
- **WHEN** `authenticateApiToken` is called with a request bearing a valid JWT
- **THEN** it returns `{ userId, instanceId, scopes }`

#### Scenario: Missing Authorization header returns 401
- **WHEN** `authenticateApiToken` is called with no Authorization header
- **THEN** it returns a NextResponse with status 401 and code `MISSING_TOKEN`

#### Scenario: Wrong signature returns 401
- **WHEN** `authenticateApiToken` is called with a JWT signed by a different secret
- **THEN** it returns a NextResponse with status 401 and code `INVALID_TOKEN`

#### Scenario: Expired token returns 401
- **WHEN** `authenticateApiToken` is called with a JWT whose `exp` is in the past
- **THEN** it returns a NextResponse with status 401 and code `EXPIRED_TOKEN`

### Requirement: API routes enforce scope authorization
Every `/api/v1/` endpoint SHALL check that the authenticated token's scopes contain the required scope for the operation. Tokens with `*` scope SHALL be granted access to all operations.

#### Scenario: Token with correct scope accesses endpoint
- **WHEN** a request with a JWT containing `todos:read` hits `GET /api/v1/todos`
- **THEN** the system returns 200

#### Scenario: Token with wrong scope returns 403
- **WHEN** a request with a JWT containing only `todos:read` hits `POST /api/v1/todos`
- **THEN** the system returns 403 with `{ "error": { "code": "INSUFFICIENT_SCOPE", ... } }`

#### Scenario: Token with wildcard scope accesses any endpoint
- **WHEN** a request with a JWT containing `*` hits any `/api/v1/` endpoint
- **THEN** the system grants access regardless of the specific scope required
