## Why

When the Obsidian plugin encounters a 401 response posting a bookmark, errors are silently swallowed or misleadingly reported as "Network error", making it impossible for users to diagnose the actual problem. A "Test connection" action and hardened error surfacing are needed so auth failures are visible and actionable.

## What Changes

- **Fix silent error swallowing**: The `request()` method in `api.ts` accesses `response.json` before checking the status, which throws a SyntaxError on non-JSON 401 bodies and converts a real auth failure into a misleading "Network error" notice
- **Fix potential unhandled Promise rejection**: The modal's `onClick` calls the async `onSubmit` without wrapping the returned Promise — if an error escapes the inner try/catch it silently disappears
- **Add "Test connection" button** to the plugin settings panel that explicitly authenticates and shows success/failure with the exact error returned by the server
- **Improve error notice messages** to include the HTTP status code and server error code so users can self-diagnose (e.g., "401 INVALID_TOKEN — check your credentials" vs. "401 EXPIRED_TOKEN — token expired, reconnect")
- **Update plugin README** to document that `JWT_SECRET` must be set in the Memento server environment

## Capabilities

### New Capabilities
<!-- None — this is a bug fix to the existing plugin -->

### Modified Capabilities
- `obsidian-plugin`: Error handling requirements change — errors must always surface as notices with status + code detail; "Test connection" action added to settings

## Impact

- **`plugins/memento-obsidian-plugin/src/api.ts`**: Fix `response.json` access order; harden error extraction
- **`plugins/memento-obsidian-plugin/src/modals.ts`**: Wrap async `onSubmit` call in Promise error handler
- **`plugins/memento-obsidian-plugin/src/main.ts`**: Add test-connection command wired to settings tab
- **`plugins/memento-obsidian-plugin/README.md`**: Document `JWT_SECRET` server requirement
- No Memento API or database changes needed
