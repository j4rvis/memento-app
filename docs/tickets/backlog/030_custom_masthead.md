# 030 — Custom Masthead

## Goal
Allow users to define a personalised newspaper masthead rendered at the top of every edition preview — including a custom name, tagline, date format, logo emoji, and auto-incrementing edition number.

## Background
Every printed newspaper has a masthead (nameplate) — the large title block at the top of the front page. Currently the newspaper preview has no masthead, making editions look generic. This ticket adds a configurable masthead that appears above the widget grid on every edition.

## Schema Changes

Store masthead config in the existing `newspapers.layout_config` JSONB column (no new column needed):

```ts
interface MastheadConfig {
  name: string                // e.g. "The Morning Brief"
  tagline?: string            // e.g. "Your daily digest"
  date_format: string         // e.g. "EEEE, d MMMM yyyy" (date-fns format)
  show_edition_number: boolean
  logo_emoji?: string         // e.g. "📰"
}
```

Access via `layout_config.masthead`. Existing `layout_config` fields are unaffected.

## Implementation Notes

### Masthead Component

`src/modules/newspaper/components/Masthead.tsx` — a full-width header block rendered above the grid:
- Full-width horizontal rule above and below
- Left column: logo emoji (large, ~3rem) — optional
- Center column: newspaper name in a large serif-style font (`font-serif text-4xl font-black tracking-tight uppercase`)
- Right column: date (formatted with `date-fns/format`) and edition number
- Tagline below the name in smaller italic text
- Edition number is computed as `COUNT(*)` of editions for this newspaper (passed as a prop by the page)
- Print-safe: no shadows, just borders and typography

### Settings UI

Add a "Masthead" section in the newspaper settings panel:
- Text input: Newspaper name
- Text input: Tagline (optional)
- Select: Date format (preset options: short, long, custom)
- Toggle: Show edition number
- Emoji picker or free text: Logo emoji
- Live preview of the masthead (client-side, re-renders as user types)
- Save via server action updating `newspapers.layout_config`

### Edition Preview Integration

In `NewspaperPreview`, render `<Masthead />` above the block grid when `layout_config.masthead` is present. Pass the edition's `created_at` date and the edition count as props.

## Files to Update
- `src/modules/newspaper/components/NewspaperPreview.tsx` — add Masthead above grid
- Newspaper settings component — add Masthead config section
- `src/app/(app)/i/[slug]/newspaper/[id]/actions.ts` — add/update `updateLayoutConfig` action

## New Files
```
src/modules/newspaper/components/Masthead.tsx
```

## Acceptance Criteria
- [ ] Masthead config stored in `newspapers.layout_config.masthead` (no new DB column)
- [ ] Masthead renders above the block grid in the edition preview
- [ ] Name, tagline, date, edition number, and emoji all display correctly
- [ ] Date formatted using the configured `date_format` string
- [ ] Edition number is the count of editions for that newspaper
- [ ] Masthead settings UI with live preview
- [ ] Masthead is absent when no config has been saved (backwards compatible)
- [ ] Print-safe styling (no box shadows, works with `@media print`)
