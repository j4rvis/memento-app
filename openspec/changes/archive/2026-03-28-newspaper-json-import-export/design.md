## Context

The newspaper visual editor (`newspaper-editor-client.tsx`) manages a `NewspaperConfig` object in React state. It already has a Save button that persists to the database via a server action. There is no current mechanism to bulk-replace this config or to extract it for external editing / backup.

The `NewspaperConfig` type is well-defined in `src/modules/newspaper/lib/types.ts` and is purely JSON-serializable — no binary fields, no circular references.

## Goals / Non-Goals

**Goals:**
- Let users download the current editor config as a JSON file (export)
- Let users replace the current editor config by uploading or pasting a JSON (import)
- Validate the imported JSON to catch obvious errors before applying it
- Require an explicit **Save** after import so the change is opt-in

**Non-Goals:**
- Server-side validation of the JSON format (client-side is sufficient for this use case)
- JSON schema versioning / migration (no breaking config changes are planned)
- Undo history / snapshot management
- Import from URL

## Decisions

### 1. Export via `<a download>` trick (no API route)

The config is already in memory. Serialise it with `JSON.stringify`, create a Blob, and trigger a download with a temporary `<a>` element. No round-trip to the server required.

**Alternative considered:** Route handler (`/api/newspaper/[id]/export`) — unnecessary complexity for a read-only in-memory operation.

### 2. Import via a Dialog with file upload + JSON textarea

A small dialog with two tabs: **Upload file** (file input accepting `.json`) and **Paste JSON** (textarea). On confirm, parse and apply to state. The dialog keeps the toolbar uncluttered.

**Alternative considered:** Inline textarea in the toolbar — poor UX on small screens, no room for an error message.

### 3. Client-side validation: structural duck-typing

Check that the parsed object has `title` (string) and `pages` (array). Full Zod schema validation is not yet set up for this module; a lightweight check avoids adding a new dependency.

**Alternative considered:** Zod schema — good long-term but over-engineered for this change.

### 4. Import replaces in-memory config only

The imported JSON is applied to React state. The user must press **Save** to persist. This matches the existing mental model (editor state ≠ saved state).

## Risks / Trade-offs

- **Invalid JSON crashes the editor** → Mitigation: wrap `JSON.parse` in try/catch, show an inline error message in the dialog before applying.
- **Partial/malformed config applied** → Mitigation: structural validation gate; show clear error if it fails.
- **User imports and forgets to save** → Accepted trade-off; consistent with existing editor behavior.
