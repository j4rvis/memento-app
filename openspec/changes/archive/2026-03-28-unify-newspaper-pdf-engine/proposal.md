## Why

The test generator (`tests/newspaper/generate.ts`) used `md-to-pdf` and duplicated browser-selection logic instead of calling the engine's `render()` function, producing PDFs that differed from what the API endpoints generate. Both paths must use the same engine.

## What Changes

- Remove `renderWithLocalBrowser()` from the test generator entirely.
- Replace it with a direct call to `render(config)` from `src/modules/newspaper/engine/index.ts`.
- Remove unused imports (`md-to-pdf`, `configToHtml`, `THEMES`, `buildThemeCss`, `existsSync`, `execSync`).

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `newspaper-pdf-engine`: Test generator now uses the same `render()` function as the API endpoints — single code path for all PDF generation.

## Impact

- `tests/newspaper/generate.ts`: ~60 lines removed, one import added.
- No changes to the engine, API endpoints, or any production code.
- Theme rendering is unaffected — `configToHtml()` (called inside `render()`) already embeds all theme CSS variables and Google Fonts links in the HTML document.
