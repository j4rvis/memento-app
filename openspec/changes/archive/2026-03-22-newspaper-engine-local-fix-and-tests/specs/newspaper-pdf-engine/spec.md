## MODIFIED Requirements

### Requirement: Single render code path
All PDF generation — whether triggered by an API endpoint or the test generator CLI — SHALL use `render(config)` from `src/modules/newspaper/engine/index.ts`. No alternative rendering path is permitted.

#### Scenario: Test generator produces same output as API
- **WHEN** the test generator renders a config
- **THEN** it calls the same `render(config)` function used by the `/pdf`, `/generate`, and `/preview` API endpoints

#### Scenario: Theme CSS applied exactly once
- **WHEN** `render(config)` is called with a themed config
- **THEN** theme CSS variables and Google Fonts are embedded once inside the HTML by `configToHtml()` — not injected again by any caller

#### Scenario: Browser selection is platform-aware
- **WHEN** `render()` is called and `CHROME_EXECUTABLE_PATH` is not set
- **THEN** the engine tries `@sparticuz/chromium` first, verifies it is executable on the current platform, and falls back to known local browser paths (Brave → Chrome → Chromium) if it is not

#### Scenario: Explicit browser path always wins
- **WHEN** `CHROME_EXECUTABLE_PATH` is set
- **THEN** the engine uses that path without checking `@sparticuz/chromium` or local browsers

#### Scenario: No browser found raises a clear error
- **WHEN** no executable browser is found via any method
- **THEN** `render()` throws an error with a message indicating no browser was found
