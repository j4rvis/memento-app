## Context

The Scryfall Obsidian plugin is a standalone TypeScript plugin (not part of memento-app). It currently has four source files: `main.ts`, `modal.ts`, `scryfall.ts`, `settings.ts`, `note-writer.ts`. The search modal extends `SuggestModal<ScryfallCard>` from the Obsidian API and renders plain-text suggestion rows. Notes are created with only frontmatter and an empty body.

## Goals / Non-Goals

**Goals:**
- Card artwork thumbnail visible per row in the search dropdown
- Mana cost rendered as SVG icons in the dropdown
- Set exclusion list in settings with autocomplete, filtering images in both dropdown and note body
- Card notes written with `![...]` image embed as the first body element

**Non-Goals:**
- Rendering mana symbols anywhere other than the search dropdown
- Caching images locally for dropdown thumbnails (CDN is sufficient)
- Offline operation / no-network fallback for images
- Changing how double-faced card selection works

## Decisions

### D1: Image source for dropdown — `small` size
Scryfall provides `image_uris.small` (~65×90px, ~7 KB). This is the right tradeoff for a dropdown thumbnail. `art_crop` is landscape-only and loses card identity; `normal` is 4× larger. Double-faced cards fall back to `card_faces[0].image_uris.small` (same logic as `getCardImageUrl`).

### D2: Mana symbols via Scryfall symbol SVG CDN
`https://svgs.scryfall.io/card-symbols/{CODE}.svg` — public, no auth, browser-cached. Parse `mana_cost` with `/{([^}]+)}/g`, strip slashes from hybrid costs (`G/U` → `GU`), render each as a 16×16 `<img>`. No bundled font or extra dependencies needed.

### D3: Set exclusion stored as `string[]` of set codes
Set codes (`sld`, `slx`, etc.) are stable identifiers. Storing codes (not names) avoids localization issues. The UI can show the full name for display; persistence is by code.

### D4: Set autocomplete via `AbstractInputSuggest`
Obsidian's `AbstractInputSuggest<T>` (available since 0.15.x) is the correct API for inline autocomplete in settings tabs. It attaches to an existing `HTMLInputElement`, intercepts input, and shows a floating suggestion list. No third-party libraries needed.

The sets list is fetched from `GET /sets` once when the settings tab opens and held in memory. It's ~700 items and loads in ~200ms. No on-disk caching needed.

### D5: Note image body — prepend, detect, update
For new notes: append image line after frontmatter.
For existing notes (upsert): detect whether the first non-empty body line is already an image embed (regex `/^!\[.*?\]\(.*?\)|^!\[\[.*?\]\]/`). If yes, replace it. If no, prepend it. This handles the local↔remote toggle without clobbering user-written content.

Set exclusion applies here too: if the card's set is in `excludedSets`, skip writing the image line entirely.

### D6: Image embed syntax — standard markdown for remote, wikilink for local
- Remote URL: `![Card Name](https://cards.scryfall.io/normal/...)` — standard markdown, renders in hover preview
- Local file: `![[Cards/images/{id}.png]]` — Obsidian wikilink embed, enables full hover preview integration

## Risks / Trade-offs

- **Dropdown image flicker on first load** — CDN images load async. On first search for a card, thumbnails may appear after the row renders. Subsequent searches will be instant (browser cache). Mitigation: acceptable UX tradeoff; no loading spinner needed.
- **`AbstractInputSuggest` API availability** — requires Obsidian ≥ 0.15.x (released 2022). `manifest.json` should declare `minAppVersion: "0.15.0"`. Most users will be on a much newer version.
- **Set list fetch on settings open** — ~200ms fetch each time settings tab is opened. Could be cached across sessions in `plugin.loadData()` but that adds complexity for marginal gain. Accept the small latency.
- **Note image update on upsert** — If a user manually edited the image line, it will be overwritten on next upsert. This is intentional (keep note in sync with settings), but worth documenting in the README.

## Open Questions

- None — decisions made during explore session.
