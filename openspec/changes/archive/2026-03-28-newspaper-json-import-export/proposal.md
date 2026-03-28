## Why

The newspaper visual editor currently has no way to bulk-edit the underlying config, back it up, or transfer a layout between templates. Adding JSON import/export gives power users a fast path to edit, version, and reuse newspaper configurations.

## What Changes

- Add an **Export JSON** button to the visual editor toolbar that downloads the current `NewspaperConfig` as a `.json` file.
- Add an **Import JSON** button/dialog to the visual editor that accepts a `NewspaperConfig` JSON (file upload or paste), validates it, and replaces the current editor state.
- The import replaces the in-memory config only — the user must still press **Save** to persist.

## Capabilities

### New Capabilities

- `newspaper-json-io`: Import and export the `NewspaperConfig` JSON directly from the visual editor toolbar.

### Modified Capabilities

<!-- none -->

## Impact

- `src/modules/newspaper/components/newspaper-editor-client.tsx` — toolbar additions (export button, import button + dialog)
- No new API routes, database changes, or server actions required — purely client-side
