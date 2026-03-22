## 1. Fix browser selection in the engine

- [x] 1.1 Rewrite browser resolution in `src/modules/newspaper/engine/index.ts`: check `CHROME_EXECUTABLE_PATH` first, then try `@sparticuz/chromium` with an executability check, then fall back to known macOS browser paths (Brave → Chrome → Chromium)
- [x] 1.2 Remove the `NODE_ENV === 'development'` branch — browser selection is now platform-aware, not env-based
- [x] 1.3 Throw a clear error message when no executable browser is found

## 2. Set up Vitest

- [x] 2.1 Add `vitest` as a dev dependency (`pnpm add -D vitest`)
- [x] 2.2 Add `"test": "vitest run"` script to `package.json`
- [x] 2.3 Add a minimal `vitest.config.ts` at the project root (exclude Next.js app dir, include engine tests)

## 3. Write unit tests for configToHtml()

- [x] 3.1 Create `src/modules/newspaper/engine/__tests__/config-to-html.test.ts`
- [x] 3.2 Test: classic theme — no Google Fonts link, CSS vars present
- [x] 3.3 Test: non-classic theme (e.g. broadsheet) — Google Fonts link present, correct CSS vars
- [x] 3.4 Test: single-layout page — `<div class="page">` with block HTML inside
- [x] 3.5 Test: two-column layout — `<div class="columns-2">` with two `<div class="column">` children

## 4. Write integration test for render()

- [x] 4.1 Create `src/modules/newspaper/engine/__tests__/render.integration.test.ts`
- [x] 4.2 Detect available browser (check known paths + `CHROME_EXECUTABLE_PATH`); skip test if none found
- [x] 4.3 Test: `render()` with a minimal config returns a buffer starting with `%PDF-`

## 5. Verify

- [x] 5.1 Run `pnpm test` — all unit tests pass
- [x] 5.2 Run `pnpm generate-newspapers` — all 15 configs generate successfully
