## Context

Two bugs are present in the current Obsidian plugin that combine to make 401 errors invisible:

1. **`response.json` accessed before status check** — in `api.ts`, `response.json` is read to extract error details even when the response might have a non-JSON or empty body (common for 401s from reverse proxies or middleware). This throws a `SyntaxError` which the catch block converts to `NetworkError("Network error — check your API URL in settings")`. The user sees a misleading message and doesn't know auth is the problem.

2. **Unhandled Promise from modal `onClick`** — the modal's `onClick` handler calls `this.onSubmit(...)` (an async function) but doesn't attach a `.catch()` to the returned Promise. If an error ever escapes the inner try/catch in the callback (e.g., a non-Error throw), it becomes an unhandled rejection and disappears silently.

A "Test connection" button is also needed to let users verify credentials independently of the bookmark/todo flow.

## Goals / Non-Goals

**Goals:**
- Errors from all API calls always surface as an Obsidian Notice
- Error notices include enough context (status code + error code) to self-diagnose without opening browser devtools
- Settings tab has a "Test connection" button that explicitly tests auth and reports the result
- README documents `JWT_SECRET` as a required server-side environment variable

**Non-Goals:**
- Structured logging / log file output
- Retry UI or "Reconnect" action after auth failure
- Changes to the Memento API or server

## Decisions

### 1. Fix `response.json` access order
Extract the status check first, then attempt JSON parse only if the status indicates an error. Use a safe helper that returns `null` on parse failure rather than throwing:

```
safeParseJson(response) → ApiErrorBody | null
```

Then fall back to `Server error (${status})` if parsing fails. This ensures a `MementoApiError` is always thrown for non-2xx responses — never accidentally converted to `NetworkError`.

### 2. Guard unhandled Promise in onClick
Add `.catch(handleApiError)` to the `onSubmit(...)` call in the modal's click handler, as a belt-and-suspenders safeguard on top of the existing inner try/catch.

### 3. Enrich error notice format
Change the notice format from flat string to `"Memento: <message> [HTTP <status> · <code>]"` for all `MementoApiError` instances. This lets users report the exact error code without needing devtools.

**Alternatives considered:**
- Logging to console only: not visible to users in production.
- Toast with a "Copy error" button: too complex for a diagnostic fix.

### 4. "Test connection" as a settings action
Add a "Test connection" button in the settings tab that calls `authenticate()` directly and shows:
- ✓ "Connected successfully" on success
- ✗ "Authentication failed: <code> — <message>" on failure

Using `authenticate()` directly (not a full round-trip) is sufficient to verify credentials without needing a real API resource.

## Risks / Trade-offs

- **`response.json` behavior across Obsidian versions** → The safe helper wraps in try/catch, so edge cases are handled regardless of version.
- **Notice duration** → Default 5-second notices may still be missed by users expecting instant feedback. Mitigation: Longer duration (8s) for error notices only.
