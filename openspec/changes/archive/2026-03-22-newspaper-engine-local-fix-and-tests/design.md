## Context

The engine (`src/modules/newspaper/engine/index.ts`) selects a browser using `NODE_ENV === 'development'`. When the test generator runs via `tsx` without `NODE_ENV` set, it falls into the production path and attempts to execute the `@sparticuz/chromium` Linux ELF binary on macOS → `spawn ENOEXEC`.

There is no test framework in the project. The only test tooling is the manual `generate.ts` script.

## Goals / Non-Goals

**Goals:**
- Engine correctly detects when `@sparticuz/chromium` is not runnable and falls back to local browsers.
- Unit tests cover `configToHtml()` without needing a browser.
- One integration test verifies `render()` produces a valid PDF buffer when a browser is available.
- Tests run via a standard `pnpm test` script.

**Non-Goals:**
- Changing block renderers, themes, or API endpoints.
- Running integration tests in CI (no browser available there unless explicitly configured).
- Testing every block type exhaustively (that can grow over time).

## Decisions

**Test framework: Vitest**
Vitest is the natural choice for a Next.js + TypeScript project using pnpm. Faster than Jest, native ESM support, minimal config. No additional Babel/transform setup needed for tsx files.

**Browser fallback: try-execute, not platform-detect**
Instead of detecting the OS (`process.platform`), the engine should try `@sparticuz/chromium`, then attempt a quick `execFileSync` check on the binary, and fall back to well-known local browser paths if it fails. This is more robust than platform checks (works on Linux with a real binary, works on macOS with a local browser, works when `CHROME_EXECUTABLE_PATH` is set explicitly).

Local browser search order:
1. `CHROME_EXECUTABLE_PATH` env var (explicit override, always wins)
2. `@sparticuz/chromium` if binary is executable on current platform
3. Known macOS browser paths (Brave → Chrome → Chromium)

**Unit tests: test `configToHtml()` directly**
`configToHtml()` is a pure async function — given a `NewspaperConfig`, returns an HTML string. No browser, no network (unless weather blocks with live data are included). Tests assert structure: theme CSS vars present, correct block HTML, correct layout classes, Google Fonts link for non-classic themes.

**Integration test: skip unless browser available**
`render()` requires a browser. The integration test checks for `CHROME_EXECUTABLE_PATH` or a known local browser path and skips via `test.skipIf()` if none found. This way it runs locally for developers who have Chrome/Brave, and is safely skipped in CI.

**Test location: `src/modules/newspaper/engine/__tests__/`**
Co-located with the engine. Vitest picks these up automatically with default config.

## Risks / Trade-offs

- [Vitest + Next.js] Next.js has some module resolution quirks with Turbopack. Vitest runs outside of Next.js though, so this is not an issue for engine-only tests.
- [Integration test flakiness] Puppeteer launch time varies. Set a generous timeout (30s) for the integration test.
- [chromium binary check] The executable check adds a small startup cost (~50ms). Acceptable since it only runs once per `render()` call cold start.
