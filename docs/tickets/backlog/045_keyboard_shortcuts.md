# 045 — Keyboard Shortcuts

## Goal
Add global keyboard shortcuts for common navigation and creation actions, with a reference modal and a central config map.

## Background
Power users expect keyboard shortcuts. This ticket adds a lightweight shortcut system at the instance layout level without requiring third-party libraries (a small custom hook is sufficient).

## Schema Changes

None.

## Implementation Notes

### Shortcuts Config

`src/lib/shortcuts.ts` — central map of all shortcuts:

```ts
export interface Shortcut {
  key: string          // e.g. "c", "n", "/"
  chord?: string       // second key for chord shortcuts (e.g. "e" for "g e")
  description: string
  category: 'navigation' | 'create' | 'action'
}

export const SHORTCUTS: Shortcut[] = [
  { key: 'c',           description: 'New todo',           category: 'create' },
  { key: 'n',           description: 'New note',           category: 'create' },
  { key: 'g', chord: 't', description: 'Go to todos',      category: 'navigation' },
  { key: 'g', chord: 'n', description: 'Go to notes',      category: 'navigation' },
  { key: 'g', chord: 'f', description: 'Go to feeds',      category: 'navigation' },
  { key: 'g', chord: 'a', description: 'Go to articles',   category: 'navigation' },
  { key: 'g', chord: 'p', description: 'Go to newspaper',  category: 'navigation' },
  { key: 'g', chord: 'e', description: 'Generate edition', category: 'action' },
  { key: '/',           description: 'Focus search',        category: 'action' },
  { key: '?',           description: 'Show shortcuts',      category: 'action' },
]
```

### `useKeyboardShortcuts` Hook

`src/hooks/use-keyboard-shortcuts.ts`:

```ts
export function useKeyboardShortcuts(
  slug: string,
  handlers: Record<string, () => void>,
): void
```

- Listens for `keydown` on `document`
- **Disabled when focus is inside `input`, `textarea`, `[contenteditable]`, or `[role="textbox"]`** — check `document.activeElement`
- Chord detection: on first key `g`, set a 1-second timeout; if a second matching key arrives within the window, fire the chord handler; otherwise cancel
- Calls `handlers[shortcutKey]` (for single keys) or `handlers['g_e']` (for chords) if defined
- `Escape` key: call a passed `onEscape` callback (to close modals/sheets) — always active

Register the hook in `src/app/(app)/i/[slug]/layout.tsx` (or a client wrapper component).

### Shortcut Handlers

Navigation shortcuts use `router.push(`/i/${slug}/todos`)` etc. (requires `useRouter` in a client component).

`c` (new todo): opens the new-todo dialog/sheet — fire a custom event or use a shared state (e.g. Zustand store or a React context `openNewTodo()`) that the todos page listens to.

`n` (new note): same pattern for notes.

`g e` (generate edition): only active on the newspaper page — fire the generate action if on that route, otherwise no-op.

`/` (search): focus the search input if one exists on the current page; no-op otherwise.

### Shortcuts Reference Modal

Triggered by pressing `?`. A `ShortcutsModal` component:
- shadcn `Dialog` or `Sheet`
- Groups shortcuts by `category` with subheadings
- Each row: key badge(s) + description
- Key badges styled as `<kbd>` elements with border and monospace font
- Accessible: `aria-label="Keyboard shortcuts"`

### Chord Key Display

Display chords as two sequential `<kbd>` elements: `<kbd>g</kbd>` then `<kbd>e</kbd>`.

## New Files
```
src/lib/shortcuts.ts
src/hooks/use-keyboard-shortcuts.ts
src/components/layout/ShortcutsModal.tsx
```

## Files to Update
- `src/app/(app)/i/[slug]/layout.tsx` (or client wrapper) — register `useKeyboardShortcuts`
- Todos layout/context — expose `openNewTodo()` handler
- Notes layout/context — expose `openNewNote()` handler

## Acceptance Criteria
- [ ] All listed shortcuts fire the correct action
- [ ] Shortcuts disabled when focus is inside an input or textarea
- [ ] Chord shortcuts (`g t`, `g n`, etc.) work with a 1-second chord window
- [ ] `?` opens the shortcuts reference modal
- [ ] `Escape` closes open modals/sheets
- [ ] Shortcut modal shows all shortcuts grouped by category with `<kbd>` styling
- [ ] `c` opens the new-todo dialog from any page within the instance
- [ ] `n` opens the new-note dialog from any page within the instance
- [ ] No third-party keyboard shortcut library required
