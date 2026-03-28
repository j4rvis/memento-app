## 1. Fix `response.json` silent error in `api.ts`

- [x] 1.1 Add a `safeParseJson(response)` helper in `api.ts` that wraps `response.json` in try/catch and returns `null` on failure
- [x] 1.2 In the `request()` method, check `response.status` first, then call `safeParseJson` to extract error details — never access `response.json` before the status check
- [x] 1.3 Update the error notice format for `MementoApiError` in `handleApiError` (`main.ts`) to include status and code: `"<message> [HTTP <status> · <code>]"`
- [x] 1.4 Set notice duration to 8 seconds for error notices (pass `8000` as second arg to `new Notice(...)`)

## 2. Fix unhandled Promise in modal `onClick`

- [x] 2.1 In `BookmarkModal.renderUrlMode()` and `BookmarkModal.renderNoteMode()`, chain `.catch(handleApiError)` on the `this.onSubmit(...)` call so any error escaping the inner try/catch is still surfaced

## 3. "Test connection" button in settings

- [x] 3.1 Add a `testConnection()` method to `MementoApiClient` in `api.ts` that calls `POST /api/auth/token` and returns `{ ok: true }` on success or `{ ok: false, status: number, code: string, message: string }` on failure — without caching the token
- [x] 3.2 In `MementoSettingTab.display()` (`main.ts`), add a "Test connection" button below the credential fields
- [x] 3.3 Add an inline result `<p>` element below the button that shows success ("Connected successfully") or failure detail ("Authentication failed [HTTP 401 · INVALID_CREDENTIALS]") after the test completes
- [x] 3.4 Disable the button while the test is in-progress; restore it after

## 4. Documentation

- [x] 4.1 Add a "Server requirements" section to `plugins/memento-obsidian-plugin/README.md` noting that `JWT_SECRET` must be set in the Memento server's environment (`.env.local`) and that the API client must have `bookmarks:write`, `todos:write`, and `newspaper:write` scopes

## 5. Build verification

- [x] 5.1 Run `npm run build` in `plugins/memento-obsidian-plugin/` and confirm clean output
