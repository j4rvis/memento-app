# Obsidian-Style Notes

## Requirements
- Live-preview markdown editor (headings, bold, code rendered inline)
- `[[Wiki Links]]` with autocomplete on `[[` and click-to-navigate
- `![[Embeds]]` rendered inline below the editor
- Daily Notes virtual folder (auto-opens today's note, creates if missing)
- Backlinks panel showing notes that reference the current note

## Plan
Implemented in phases:
1. **Ticket 017** — CodeMirror 6 editor replacing `<textarea>`
2. **Ticket 018** — `[[]]` wiki links with autocomplete & click-to-navigate
3. **Ticket 019** — Daily Notes virtual folder
4. **Ticket 020** — `![[]]` inline embeds (display-mode below editor)
5. **Ticket 021** — Backlinks panel (linked-by list)

## Summary

Replaced the plain `<textarea>` in the Notes feature with a full **CodeMirror 6** live-preview
markdown editor. All five planned phases were implemented:

- **CodeMirror editor** (`code-mirror-editor.tsx`): markdown syntax highlighting with live formatting
  (headings, bold, code, etc.), undo/redo history, close-brackets, line wrapping, and app-theme-aware
  styling via CSS variables.
- **Wiki link extension** (`wiki-link-extension.ts`): decorates completed `[[Title]]` spans as
  clickable styled pills (raw text shows when cursor is inside); autocomplete dropdown opens on `[[`
  and filters by note title.
- **Daily Notes** (`notes-layout.tsx`, `folder-panel.tsx`, `notes-list-panel.tsx`): a virtual
  "Daily Notes" folder in the sidebar auto-navigates to (or creates) today's `YYYY-MM-DD` note on
  selection.
- **Inline embeds** (`embed-renderer.tsx`): `![[Title]]` patterns in the current note render a
  read-only preview of the linked note's content below the editor, with circular-embed detection.
- **Backlinks** (`note-editor-panel.tsx`): toolbar shows a backlinks button when other notes contain
  `[[Current Note Title]]`; click to expand a list of linking notes.

Completed: 2026-03-08
