# 035 — Notes Widget: Single Note Mode

## Goal
Extend the existing notes widget to support a "single note" mode that renders one specific note's full markdown content as a formatted newspaper article block, in addition to the existing list mode.

## Dependencies
- **Requires ticket 024** (widget registry — notes widget must be migrated to registry first)

## Background
The current notes widget renders a list of recent notes. For users who write longer-form notes (e.g. a weekly reflection, a recipe, a how-to), rendering the full content of a specific note as an article body would make the newspaper much more useful as a reading artifact.

## Schema Changes

No schema changes required.

## Implementation Notes

### Config Extension

Add to the existing notes widget config:

```ts
interface NotesWidgetConfig {
  // existing fields
  max_items?: number
  sort?: 'newest' | 'updated'
  // new fields
  mode: 'list' | 'single'
  note_id?: string   // required when mode === 'single'
}
```

Default `mode: 'list'` for backwards compatibility.

### Config Form Changes

In the notes widget config form, add a `mode` toggle (List / Single Note). When "Single Note" is selected:
- Show a searchable dropdown/combobox populated with the instance's notes (fetched from the DB)
- The selected note's title and a preview of its first line are shown
- `note_id` is stored in the block config

### Data Fetching (`fetchData`)

In `mode: 'single'`:
- Fetch the specific note by `note_id` and `instance_id`
- Return the full `content` (markdown body) and `title`
- If the note is not found (deleted), return `null` — the preview renders a "Note not found" placeholder

In `mode: 'list'`:
- Existing behaviour unchanged

### Rendering (`preview.tsx`)

In `mode: 'single'`:
- Render note title as `<h2>` (newspaper headline style: `font-serif font-bold text-2xl`)
- Render markdown body via `@tailwindcss/typography` prose styles — looks like a newspaper article
- Size-aware:
  - 1×1: title + truncated body (~150 chars) with "..." fade
  - 1×2 or 2×1: title + first ~400 chars
  - 2×2+: full content (scroll if overflow in preview; print wraps naturally)
- Show note `updated_at` in small text below the headline (e.g. "Updated 3 Mar 2026")

In `mode: 'list'`:
- Existing rendering unchanged

### Markdown Rendering

Use the same markdown renderer already used in the notes module (likely `react-markdown` or a remark pipeline). Do not add a new dependency if one already exists.

## Files to Update
- `src/modules/newspaper/lib/widgets/notes/config.tsx` — add mode toggle and note selector
- `src/modules/newspaper/lib/widgets/notes/preview.tsx` — add single-note rendering path
- `src/modules/newspaper/lib/widgets/notes/index.ts` — update `fetchData` and `supportedSizes`

## Acceptance Criteria
- [ ] `mode` field added to notes widget config with `'list'` as default
- [ ] Config form shows note selector when mode is "single"
- [ ] `fetchData` fetches the specific note's full content in single mode
- [ ] Single mode renders note title as headline and body as prose
- [ ] Markdown content rendered with `@tailwindcss/typography` prose styles
- [ ] Size-aware content truncation in single mode
- [ ] "Note not found" placeholder shown if configured note was deleted
- [ ] List mode behaviour is unchanged (no regression)
