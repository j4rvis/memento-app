## Why

The Scryfall plugin search dropdown currently shows cards as plain text, making it hard to visually identify the right card, especially when multiple printings exist. Card notes also lack a visual anchor — there's no image in the note body, so hover previews in Obsidian are just raw frontmatter.

## What Changes

- Card artwork thumbnails rendered in the search suggestion dropdown
- Mana cost symbols rendered as SVG icons instead of raw text (e.g. `{2}{W}` → actual mana pips)
- New setting: excluded sets list — image display (dropdown + note body) is suppressed for cards from excluded sets
- Set exclusion setting uses inline autocomplete powered by the Scryfall `/sets` API
- Card notes now begin with an image embed (`![...]` or `![[...]]`) as the first body element, enabling Obsidian hover preview to show the artwork immediately

## Capabilities

### New Capabilities

- `rich-search-modal`: Search suggestion rows display card art thumbnail and SVG mana symbols
- `set-exclusion`: Configuration to suppress image display for specified sets (dropdown + note body), with inline autocomplete of all Scryfall set names
- `note-image-body`: Card notes are created/updated with the card image as the first body element in `![]` syntax

### Modified Capabilities

<!-- none — these are all new capability surfaces on the existing plugin -->

## Impact

- `src/modal.ts`: `renderSuggestion` extended with `<img>` thumbnail and mana symbol SVGs
- `src/settings.ts`: `ScryfallSettings` gains `excludedSets: string[]`; settings tab gains set autocomplete using `AbstractInputSuggest`
- `src/scryfall.ts`: New `fetchAllSets()` function + `ScryfallSetInfo` type
- `src/note-writer.ts`: `upsertCardNote` writes image as first body line, skipped for excluded sets
- External dependency: Scryfall `/sets` endpoint (already used for card search; same free, no-auth API)
- Scryfall symbol CDN: `https://svgs.scryfall.io/card-symbols/` (no auth, public)
