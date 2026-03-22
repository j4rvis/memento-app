## 1. Update ScryfallSetInfo type and fetch

- [x] 1.1 Add `set_type: string` field to the `ScryfallSetInfo` interface in `scryfall.ts`
- [x] 1.2 Update `fetchAllSets()` to map `set_type` from the API response alongside `code` and `name`

## 2. Fix SetSuggest autocomplete

- [x] 2.1 Change `SetSuggest` constructor to accept `() => ScryfallSetInfo[]` (getter) instead of `ScryfallSetInfo[]`
- [x] 2.2 Update `getSuggestions()` to call the getter on each invocation instead of reading `this.sets`
- [x] 2.3 Update the `SetSuggest` instantiation in `display()` to pass `() => this.allSets` as the getter

## 3. Add grouping with type separators

- [x] 3.1 Add a `normalizeSetType(set_type: string): string` helper that maps Scryfall type strings to display group labels (e.g. `expansion`/`core` → "Expansions & Core Sets", `masters` → "Masters Sets", `commander`/`draft_innovation` → "Commander & Specialty", `promo`/`token`/`memorabilia` → "Promo & Extras", else → "Other")
- [x] 3.2 In `getSuggestions()`, sort filtered results by normalized group label so same-type sets appear together
- [x] 3.3 Track the last-rendered group label in `SetSuggest` (e.g. `private lastRenderedGroup = ""`, reset per suggestion cycle)
- [x] 3.4 In `renderSuggestion()`, compute the group for the current set; if it differs from `lastRenderedGroup`, prepend a separator `div` with the group label and update `lastRenderedGroup`
- [x] 3.5 Add CSS in `styles.css` for `.scryfall-set-group-separator` (muted color, small font, non-interactive, padding)

## 4. Widen the input field

- [x] 4.1 Add class `scryfall-set-input` to the input element in `addSetting().addText()` (use `text.inputEl.addClass(...)`)
- [x] 4.2 Add `.scryfall-set-input { width: 100%; min-width: 300px; }` to `styles.css`

## 5. Add fallback link

- [x] 5.1 Update the `setDesc()` of the "Add excluded set" setting to include a sentence with a link to `https://scryfall.com/sets` (use `descEl.createEl("a", { href: ..., text: "Browse all sets on Scryfall" })` via `addSetting().setDesc()` or by accessing `settingEl.descEl`)

## 6. Build and verify

- [x] 6.1 Run `npm run build` (or `node esbuild.config.mjs`) in the plugin directory and confirm no TypeScript errors
- [ ] 6.2 Manually verify in Obsidian: open Scryfall settings, type in the "Add excluded set" field, confirm suggestions appear with group separators
- [ ] 6.3 Verify the fallback link renders and opens `https://scryfall.com/sets`
- [ ] 6.4 Verify the input field is visually wider than before
