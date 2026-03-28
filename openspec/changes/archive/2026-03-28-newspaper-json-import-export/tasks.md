## 1. Export JSON

- [x] 1.1 Add `handleExport` function to `NewspaperEditorClient` that serializes `config` to JSON and triggers a browser file download named `<name>.json`
- [x] 1.2 Add an **Export JSON** button (with `Download` icon) to the editor toolbar, wired to `handleExport`

## 2. Import JSON Dialog

- [x] 2.1 Create `src/modules/newspaper/components/import-json-dialog.tsx` — a Dialog with two tabs: **Upload file** (file input) and **Paste JSON** (textarea)
- [x] 2.2 Implement JSON parsing + structural validation (must have `title: string` and `pages: array`) with inline error display in the dialog
- [x] 2.3 On successful validation, call an `onImport(config: NewspaperConfig)` callback and close the dialog
- [x] 2.4 Add `handleImport` to `NewspaperEditorClient` that calls `setConfig` with the imported value and shows a success toast
- [x] 2.5 Add an **Import JSON** button (with `Upload` icon) to the editor toolbar that opens the dialog
