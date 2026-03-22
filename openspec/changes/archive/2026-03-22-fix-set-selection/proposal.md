## Why

The "Add excluded set" input in the Scryfall plugin settings uses `SetSuggest` for autocomplete, but the autocomplete is broken: `allSets` is fetched asynchronously in the background, and the suggest instance receives an empty array reference at construction time — so no suggestions ever appear. Additionally, the input field is small and there is no fallback when autocomplete fails.

## What Changes

- **Fix autocomplete timing**: Make `SetSuggest` reference the live `allSets` array (not a snapshot captured at construction time), so suggestions work once the fetch resolves.
- **Add fallback link**: When `allSets` is still loading or empty, show a description with a link to `https://scryfall.com/sets` so users can manually look up set codes.
- **Larger input field**: Widen the set input field so set names fit without truncation.
- **Set separators by type**: Group sets in the suggestion dropdown by set type (e.g., expansion, commander, core, masters, promo, etc.) with visual separators so users can browse logically.

## Capabilities

### New Capabilities

- `scryfall-set-selection`: Autocomplete set picker in the excluded-sets settings UI — loads sets correctly, groups by type, provides a fallback link, and uses a wider input field.

### Modified Capabilities

<!-- none -->

## Impact

- `plugins/scryfall-obsidian-plugin/src/settings.ts` — fix `SetSuggest` reference, add grouping/separators, widen input, add fallback link
- `plugins/scryfall-obsidian-plugin/styles.css` — wider input style
- `plugins/scryfall-obsidian-plugin/src/scryfall.ts` — possibly expose `set_type` in `ScryfallSetInfo` if not already present
- No breaking changes; purely additive/corrective
