## Context

The Scryfall plugin's "Add excluded set" input uses `SetSuggest` (extends `AbstractInputSuggest`) for autocomplete. The bug: `allSets` is fetched asynchronously in `display()`, but `SetSuggest` is constructed with a snapshot of `this.allSets` (an empty array at that point). The suggest's internal `sets` field never gets updated when the fetch resolves, so the dropdown always shows nothing.

Additionally: the input is the default narrow Obsidian text input width, there's no visual grouping of sets by type (expansions vs promos vs commander decks etc.), and there's no fallback hint when sets fail to load.

The Scryfall `/sets` API returns `set_type` on each set object (e.g. `"expansion"`, `"commander"`, `"masters"`, `"promo"`, `"core"`, etc.).

## Goals / Non-Goals

**Goals:**
- Fix the autocomplete so suggestions appear correctly after the async fetch resolves
- Expose `set_type` in `ScryfallSetInfo` so suggestions can be grouped
- Group suggestions in the dropdown with visual type separators (e.g. "Expansions", "Commander", "Masters", "Promo", "Core", "Other")
- Widen the input field via CSS so set names aren't truncated
- Show a fallback description with a link to `https://scryfall.com/sets` while sets are loading or if loading fails

**Non-Goals:**
- Changing how excluded sets are stored or used elsewhere
- Modifying the card search modal
- Pagination or lazy-loading of sets

## Decisions

### Fix: pass a getter instead of a snapshot
**Decision**: Change `SetSuggest` to accept a getter function `() => ScryfallSetInfo[]` instead of a plain array. `getSuggestions()` calls the getter each time, so it always reads the current `allSets` value after the fetch resolves.

**Alternative considered**: Re-construct `SetSuggest` after the fetch resolves and re-render. Rejected — `display()` re-renders the whole tab which is disruptive and causes the loading-then-redraw flash.

### Grouping: sort by `set_type` and inject separator rows
**Decision**: In `getSuggestions()`, sort filtered results by `set_type` and return them. In `renderSuggestion()`, detect when the type changes (compared to the previous rendered item) and prepend a separator div with a type label.

The Scryfall API returns many set types. Normalize them into friendly display groups:
- `expansion`, `core` → "Expansions & Core Sets"
- `masters` → "Masters Sets"
- `commander`, `draft_innovation` → "Commander & Specialty"
- `promo`, `token`, `memorabilia` → "Promo & Extras"
- everything else → "Other"

**Alternative**: Use Obsidian's `renderSuggestion` to always show a type header. Rejected — `AbstractInputSuggest` doesn't expose group headers natively; injecting a separator into the rendered element is the practical approach.

### Wider input: CSS only
**Decision**: Add `.scryfall-set-input { width: 100%; min-width: 300px; }` in `styles.css`. The `addSetting().addText()` call assigns a class to the input for targeting.

### Fallback link
**Decision**: Add a `setDesc()` that includes an `<a>` element linking to `https://scryfall.com/sets` with text "Browse all sets on Scryfall". Shown as part of the "Add excluded set" setting description, always visible (not conditional on loading state) since it's always useful.

## Risks / Trade-offs

- [Set type grouping in suggest] `AbstractInputSuggest` renders one element per suggestion; injecting a header inside `renderSuggestion` for the first item of each group is a workaround, not a native API. It works but the header shares the suggestion's hover/click style. → Mitigation: Style the header text with CSS (`pointer-events: none`, muted color) to make it non-interactive and visually distinct.
- [Getter pattern] If `SetSuggest` is reused elsewhere and the calling code passes a plain array (not a getter), the fix won't apply there. → Not a concern — `SetSuggest` is only used in this one settings tab.
- [set_type field] Adding `set_type` to `ScryfallSetInfo` is additive and non-breaking. Only the new grouping logic uses it.
