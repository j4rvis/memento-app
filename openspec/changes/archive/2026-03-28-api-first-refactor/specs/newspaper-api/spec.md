## ADDED Requirements

### Requirement: Newspaper generation can be triggered via API
The system SHALL expose `POST /api/v1/newspaper/generate`. It SHALL accept either a `template_id` (uuid referencing a saved newspaper template) or a `config` object (inline NewspaperConfig). At least one of the two SHALL be required.

#### Scenario: Valid template_id generates a PDF
- **WHEN** `POST /api/v1/newspaper/generate` is called with `{ "template_id": "<uuid>" }` and a JWT with `newspaper:write`
- **THEN** the system loads the config from the newspaper template, generates the PDF, and returns it as `application/pdf`

#### Scenario: Inline config generates a PDF
- **WHEN** `POST /api/v1/newspaper/generate` is called with `{ "config": { ... } }` and a JWT with `newspaper:write`
- **THEN** the system uses the provided config to generate the PDF and returns it as `application/pdf`

#### Scenario: JSON metadata response when format=json
- **WHEN** `POST /api/v1/newspaper/generate?format=json` is called with a valid body
- **THEN** the system returns 200 with `{ "data": { "generated_at": "<iso-datetime>", "size_bytes": N } }`

#### Scenario: Missing both template_id and config returns 422
- **WHEN** `POST /api/v1/newspaper/generate` is called with an empty body
- **THEN** the system returns 422 with `{ "error": { "code": "VALIDATION_ERROR", "message": "Either template_id or config is required" } }`

#### Scenario: Unknown template_id returns 404
- **WHEN** `POST /api/v1/newspaper/generate` is called with a `template_id` that does not exist in the instance
- **THEN** the system returns 404 with `{ "error": { "code": "NOT_FOUND", ... } }`

#### Scenario: Unauthenticated request returns 401
- **WHEN** `POST /api/v1/newspaper/generate` is called without Authorization header
- **THEN** the system returns 401

#### Scenario: Insufficient scope returns 403
- **WHEN** `POST /api/v1/newspaper/generate` is called with a JWT lacking `newspaper:write` and `*`
- **THEN** the system returns 403
