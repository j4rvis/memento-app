## 1. Settings — Excluded Sets

- [x] 1.1 Add `excludedSets: string[]` (default `[]`) to `ScryfallSettings` interface and `DEFAULT_SETTINGS` in `settings.ts`
- [x] 1.2 Add `ScryfallSetInfo` interface (`{ code: string; name: string }`) to `scryfall.ts`
- [x] 1.3 Implement `fetchAllSets(): Promise<ScryfallSetInfo[]>` in `scryfall.ts` using `GET /sets`
- [x] 1.4 Implement `SetSuggest` class in `settings.ts` extending `AbstractInputSuggest<ScryfallSetInfo>` — filters by name and code, shows max 10 results
- [x] 1.5 Add excluded sets UI to `ScryfallSettingTab.display()`: heading, current exclusion rows with remove buttons, and the `SetSuggest`-backed add input
- [x] 1.6 Wire set fetch into `ScryfallSettingTab.display()` (fetch on tab open, cache in instance var)

## 2. Rich Search Modal — Thumbnails

- [x] 2.1 Add a helper `getCardSmallImageUrl(card: ScryfallCard): string | undefined` to `scryfall.ts` returning `image_uris.small` with DFC fallback to `card_faces[0].image_uris.small`
- [x] 2.2 Update `renderSuggestion` in `modal.ts` to prepend a thumbnail `<img>` (the `small` URL) when a URL is available and the card's set is not in `settings.excludedSets`

## 3. Rich Search Modal — Mana Symbols

- [x] 3.1 Add `renderManaCost(container: HTMLElement, manaCost: string): void` helper in `modal.ts` — parses `{TOKEN}` groups, strips `/`, creates 16×16 `<img>` per symbol pointing to `https://svgs.scryfall.io/card-symbols/{CODE}.svg`
- [x] 3.2 Replace the raw `mana_cost` text in `renderSuggestion` with a call to `renderManaCost`

## 4. Note Writer — Image as First Body Element

- [x] 4.1 Add `buildImageLine(card: ScryfallCard, settings: ScryfallSettings): string | null` helper in `note-writer.ts` — returns the correct `![]` or `![[]]` embed string, or `null` if excluded/no image
- [x] 4.2 Update new note creation in `upsertCardNote` to append the image line (from `buildImageLine`) as the first body element after frontmatter
- [x] 4.3 Update upsert (existing note) path in `upsertCardNote`: detect existing image embed on first body line (regex), replace if found, prepend if not; preserve all other body content

## 5. manifest.json — Min Version

- [x] 5.1 Set `minAppVersion` to `"0.15.0"` in `manifest.json` (required for `AbstractInputSuggest`)

## 6. Build & Verify

- [x] 6.1 Run `npm run build` in the plugin directory and confirm zero TypeScript errors
- [ ] 6.2 Load plugin in Obsidian developer mode — verify no console errors on startup
- [ ] 6.3 Test: search for a card and confirm thumbnail and mana symbols appear in dropdown
- [ ] 6.4 Test: add a set to excluded list (with autocomplete), search for a card from that set, confirm no thumbnail in dropdown
- [ ] 6.5 Test: insert a card and confirm the note body starts with an image embed
- [ ] 6.6 Test: re-insert same card (upsert) and confirm image line is updated, not duplicated, and user content below is intact
