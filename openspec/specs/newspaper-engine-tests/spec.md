## ADDED Requirements

### Requirement: Unit tests for HTML generation
The engine SHALL have unit tests for `configToHtml()` that run without a browser and cover theme injection, block rendering, and layout structure.

#### Scenario: Theme CSS variables are embedded
- **WHEN** `configToHtml()` is called with a config specifying a theme (e.g. `broadsheet`)
- **THEN** the returned HTML contains the theme's CSS custom properties (e.g. `--np-font-heading`)

#### Scenario: Google Fonts link is included for non-classic themes
- **WHEN** `configToHtml()` is called with a theme that requires Google Fonts
- **THEN** the returned HTML contains a `<link>` tag pointing to `fonts.googleapis.com`

#### Scenario: Classic theme has no Google Fonts link
- **WHEN** `configToHtml()` is called with `theme: "classic"`
- **THEN** the returned HTML does NOT contain a `fonts.googleapis.com` link

#### Scenario: Single-column layout renders blocks sequentially
- **WHEN** `configToHtml()` is called with a single-layout page containing multiple blocks
- **THEN** the returned HTML contains a `<div class="page">` with block HTML in order

#### Scenario: Two-column layout renders column wrappers
- **WHEN** `configToHtml()` is called with a two-column layout page
- **THEN** the returned HTML contains a `<div class="columns-2">` with two `<div class="column">` children

### Requirement: Integration test for PDF output
The engine SHALL have an integration test for `render()` that verifies a valid PDF buffer is produced. The test MUST be skipped when no local browser is available.

#### Scenario: render() produces a valid PDF buffer
- **WHEN** a local browser is available and `render()` is called with a minimal config
- **THEN** the returned buffer starts with the PDF magic bytes `%PDF-`

#### Scenario: Integration test skips gracefully without a browser
- **WHEN** no `CHROME_EXECUTABLE_PATH` is set and no known local browser paths exist
- **THEN** the integration test is skipped (not failed)

### Requirement: Tests run via pnpm test
The project SHALL have a `pnpm test` script that runs all unit tests via Vitest.

#### Scenario: Unit tests pass with pnpm test
- **WHEN** `pnpm test` is run
- **THEN** all unit tests execute and pass without requiring a browser or network access
