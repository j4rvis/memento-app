## Why

The newspaper PDF engine fails locally with `spawn ENOEXEC` because it tries to run the `@sparticuz/chromium` Linux binary on macOS when `NODE_ENV` is not set to `development`. There are also no automated tests to catch HTML generation regressions or verify that the engine produces valid PDF output.

## What Changes

- Fix the engine's browser selection to fall back to local Chromium-based browsers when the `@sparticuz/chromium` binary is not executable on the current platform (macOS), regardless of `NODE_ENV`.
- Add unit tests for `configToHtml()` — verify HTML structure, theme injection, block rendering, and layout — no browser required.
- Add an opt-in integration test for `render()` — verify a valid PDF buffer is returned — skipped unless a local browser is available.

## Capabilities

### New Capabilities

- `newspaper-engine-tests`: Unit and integration tests for the newspaper PDF engine.

### Modified Capabilities

- `newspaper-pdf-engine`: Browser selection becomes platform-aware — falls back to local browsers when the chromium binary is not runnable on the current OS.

## Impact

- `src/modules/newspaper/engine/index.ts`: Browser selection logic updated.
- `tests/newspaper/` or `src/modules/newspaper/engine/__tests__/`: New test files added.
- No changes to API endpoints, rendering logic, block renderers, or themes.
