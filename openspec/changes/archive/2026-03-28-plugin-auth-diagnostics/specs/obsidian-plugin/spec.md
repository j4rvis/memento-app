## MODIFIED Requirements

### Requirement: Plugin authenticates with Memento on demand
The plugin SHALL call `POST {apiUrl}/api/auth/token` with `{ client_id, client_secret }` to obtain a Bearer JWT. The token SHALL be cached in memory and reused for subsequent requests. When a request returns 401, the plugin SHALL re-authenticate once and retry the request. All authentication failures SHALL surface as an Obsidian Notice that includes the HTTP status code and server error code.

#### Scenario: Valid credentials yield a cached token
- **WHEN** any command triggers an API call and no token is cached
- **THEN** the plugin authenticates, caches the JWT, and proceeds with the API call

#### Scenario: Expired token triggers re-authentication
- **WHEN** an API call returns 401
- **THEN** the plugin discards the cached token, re-authenticates, and retries the original request once

#### Scenario: Invalid credentials show an error notice with detail
- **WHEN** authentication fails with a 401 from the token endpoint
- **THEN** the plugin shows a notice "Memento: Authentication failed [HTTP 401 · INVALID_CREDENTIALS]" and does not proceed

#### Scenario: Non-JSON error response is still surfaced
- **WHEN** a non-2xx response has a non-JSON or empty body
- **THEN** the plugin shows a notice "Memento: Server error (HTTP <status>)" rather than a misleading network error

## ADDED Requirements

### Requirement: Settings panel includes a "Test connection" action
The plugin settings tab SHALL include a "Test connection" button. When clicked, the plugin SHALL call `POST {apiUrl}/api/auth/token` with the currently saved credentials. It SHALL display an inline result: success message on 200, or the HTTP status and error code on failure. The test SHALL NOT cache the resulting token.

#### Scenario: Valid credentials show success
- **WHEN** the user clicks "Test connection" with valid `apiUrl`, `clientId`, and `clientSecret`
- **THEN** the settings tab shows "Connected successfully" inline below the button

#### Scenario: Invalid credentials show failure detail
- **WHEN** the user clicks "Test connection" and the server returns 401
- **THEN** the settings tab shows "Authentication failed [HTTP 401 · INVALID_CREDENTIALS]" inline below the button

#### Scenario: Network error during test is reported inline
- **WHEN** the user clicks "Test connection" and a network error occurs
- **THEN** the settings tab shows "Network error — check your API URL" inline below the button

### Requirement: API errors always surface as notices with status and code
For any command that triggers an API call, non-2xx responses SHALL produce an Obsidian Notice with the format "Memento: <message> [HTTP <status> · <code>]". The notice SHALL remain visible for at least 8 seconds. Errors SHALL NOT be silently swallowed regardless of response body format.

#### Scenario: 401 with JSON error body shows code
- **WHEN** an API call returns 401 with `{ "error": { "code": "INVALID_TOKEN", "message": "..." } }`
- **THEN** the notice reads "Memento: Authentication failed [HTTP 401 · INVALID_TOKEN]"

#### Scenario: 403 scope error shows code
- **WHEN** an API call returns 403
- **THEN** the notice reads "Memento: Insufficient scope [HTTP 403 · INSUFFICIENT_SCOPE]"

#### Scenario: Non-JSON error body still produces a notice
- **WHEN** an API call returns a non-2xx response with a non-JSON body
- **THEN** the notice reads "Memento: Server error (HTTP <status>)" and does NOT throw an unhandled error
