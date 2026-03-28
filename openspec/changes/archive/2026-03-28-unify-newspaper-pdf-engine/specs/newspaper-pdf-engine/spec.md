## MODIFIED Requirements

### Requirement: Single render code path
All PDF generation — whether triggered by an API endpoint or the test generator CLI — SHALL use `render(config)` from `src/modules/newspaper/engine/index.ts`. No alternative rendering path is permitted.

#### Scenario: Test generator produces same output as API
- **WHEN** the test generator renders a config
- **THEN** it calls the same `render(config)` function used by the `/pdf`, `/generate`, and `/preview` API endpoints

#### Scenario: Theme CSS applied exactly once
- **WHEN** `render(config)` is called with a themed config
- **THEN** theme CSS variables and Google Fonts are embedded once inside the HTML by `configToHtml()` — not injected again by any caller

#### Scenario: Browser selection is centralized
- **WHEN** the engine renders a PDF locally (NODE_ENV=development)
- **THEN** it uses `CHROME_EXECUTABLE_PATH` or falls back to Brave/Chrome — the caller does not specify a browser path
