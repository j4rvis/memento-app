## ADDED Requirements

### Requirement: Users can create API clients from the settings UI
The system SHALL expose an `/i/[slug]/settings/api` page. It SHALL allow authenticated instance members to create a new API client by providing a name and selecting scopes. On success, the raw client secret SHALL be displayed exactly once in a modal and SHALL NOT be retrievable again.

#### Scenario: Client is created and secret shown once
- **WHEN** a user submits the create API client form with a name and at least one scope
- **THEN** the system creates the client, and a modal displays the `client_id` and raw `client_secret` with a copy button and a warning that the secret won't be shown again

#### Scenario: Secret is not shown on subsequent page visits
- **WHEN** the user navigates away and returns to `/i/[slug]/settings/api`
- **THEN** only `client_id`, `name`, `scopes`, `is_active`, and `last_used_at` are shown; no secret

### Requirement: Users can list their API clients
The system SHALL display all API clients for the current instance on the `/i/[slug]/settings/api` page, showing `client_id`, `name`, `scopes`, `is_active` status, and `last_used_at`.

#### Scenario: Active clients are listed
- **WHEN** a user visits `/i/[slug]/settings/api`
- **THEN** all API clients for the instance are shown in a table or list with their metadata

### Requirement: Users can revoke API clients
The system SHALL allow instance members to revoke an API client by setting `is_active = false`. Revoked clients SHALL remain visible in the list with a revoked status badge.

#### Scenario: Revoking a client marks it inactive
- **WHEN** a user clicks the revoke button on an active client and confirms
- **THEN** the client's `is_active` is set to `false` and it appears in the list with a "revoked" status

#### Scenario: Revoked client cannot be re-activated from the UI
- **WHEN** a client is revoked
- **THEN** no re-activate action is available; to regain access, a new client must be created

### Requirement: Google accounts are accessible from an Integrations settings page
The system SHALL expose `/i/[slug]/settings/integrations` as a dedicated page for Google account management. The main settings page SHALL link to this sub-page.

#### Scenario: Integrations page shows Google account management
- **WHEN** a user navigates to `/i/[slug]/settings/integrations`
- **THEN** the page shows the Google account connection UI (connect, list connected accounts, disconnect)

#### Scenario: Main settings page links to integrations sub-page
- **WHEN** a user visits the main settings page
- **THEN** there is a visible link or card navigating to `/i/[slug]/settings/integrations`
