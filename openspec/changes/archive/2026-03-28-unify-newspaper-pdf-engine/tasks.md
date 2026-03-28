## 1. Simplify test generator

- [x] 1.1 Remove `renderWithLocalBrowser()` function and its local browser list from `tests/newspaper/generate.ts`
- [x] 1.2 Remove unused imports (`md-to-pdf`, `configToHtml`, `THEMES`, `buildThemeCss`, `existsSync`)
- [x] 1.3 Import `render` from `../../src/modules/newspaper/engine/index`
- [x] 1.4 Replace `renderWithLocalBrowser(config)` call with `render(config)`

## 2. Verify

- [x] 2.1 Run `pnpm generate-newspapers` and confirm PDFs are generated successfully
- [x] 2.2 Spot-check a themed config (e.g. broadsheet or vintage) to confirm theme renders correctly
