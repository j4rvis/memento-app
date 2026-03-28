## Context

The newspaper module has a `render(config)` function in `src/modules/newspaper/engine/index.ts` that all API endpoints (`/pdf`, `/generate`, `/preview`) use. The test generator in `tests/newspaper/generate.ts` independently implemented `renderWithLocalBrowser()` using `md-to-pdf` instead of calling `render()` — duplicating browser-selection logic, applying theme CSS twice (once via `configToHtml()` and once via md-to-pdf's `css` option), and producing slightly different output than production.

## Goals / Non-Goals

**Goals:**
- Test generator produces byte-for-byte equivalent PDFs to the API endpoints.
- Single browser-selection code path (in the engine).
- Remove `md-to-pdf` usage from the test generator.

**Non-Goals:**
- Changing the engine itself.
- Changing any API endpoint.
- Removing `md-to-pdf` from the project entirely (other code may use it).

## Decisions

**Use `render()` directly — no wrapper.**
The engine already handles local vs. production browser selection via `NODE_ENV` and `CHROME_EXECUTABLE_PATH`. No adapter needed.

**Keep weather injection in the test generator.**
`fetchWeather` + `injectWeatherInConfig` are test-specific concerns (live data pre-fetch before rendering). They stay in `generate.ts`.

**Do not touch the engine.**
The engine is correct and shared. The fix is entirely in the test generator.

## Risks / Trade-offs

- `render()` checks `NODE_ENV === 'development'` to pick the browser. Running the test generator requires `NODE_ENV=development` or `CHROME_EXECUTABLE_PATH` set — same requirement as before, just now explicit in one place.
- No rollback needed; the change is a pure simplification.
