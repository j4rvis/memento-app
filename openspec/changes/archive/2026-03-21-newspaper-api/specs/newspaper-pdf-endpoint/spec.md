## ADDED Requirements

### Requirement: PDF download endpoint
The system SHALL expose `GET /api/newspaper/[templateId]/pdf` that returns a generated PDF for the specified template. The endpoint SHALL require `read:pdf` scope when authenticated via API key.

#### Scenario: Authenticated request returns PDF
- **WHEN** an authenticated request is made to `GET /api/newspaper/[templateId]/pdf`
- **THEN** the system returns a PDF file with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="<title>-<date>.pdf"`

#### Scenario: Unauthenticated request is rejected
- **WHEN** a request to `GET /api/newspaper/[templateId]/pdf` has no valid auth
- **THEN** the system returns 401

#### Scenario: Template not found
- **WHEN** an authenticated request references a `templateId` that does not exist
- **THEN** the system returns 404

#### Scenario: Forward-compatible query params accepted silently
- **WHEN** a request includes `?generate=true` or `?date=2026-03-20`
- **THEN** the params are accepted without error (current behavior: always generates on-the-fly; `?date=` is a no-op until storage is available)

### Requirement: On-demand generate endpoint
The system SHALL expose `POST /api/newspaper/[templateId]/generate` that generates a PDF and returns metadata. The endpoint SHALL require `write:generate` scope when authenticated via API key.

#### Scenario: Authenticated POST returns metadata
- **WHEN** an authenticated request is made to `POST /api/newspaper/[templateId]/generate`
- **THEN** the system generates a PDF and returns JSON with `generated_at` and `size_bytes` fields

#### Scenario: Missing write:generate scope rejected
- **WHEN** a request uses a key with only `read:pdf` scope
- **THEN** the system returns 403

### Requirement: Cron endpoint stub
The system SHALL expose `POST /api/newspaper/cron` for internal scheduled generation. The endpoint SHALL require a `NEWSPAPER_CRON_SECRET` bearer token. Full scheduler logic is deferred to ticket 049.

#### Scenario: Valid cron secret accepted
- **WHEN** a POST request includes `Authorization: Bearer <NEWSPAPER_CRON_SECRET>`
- **THEN** the system returns 200 with a stub response

#### Scenario: Invalid or missing cron secret rejected
- **WHEN** a POST request is missing or has an incorrect cron secret
- **THEN** the system returns 401
