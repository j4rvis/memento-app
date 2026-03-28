## Context

A standalone Obsidian plugin (TypeScript) that integrates with the Scryfall public API to let users search for Magic: The Gathering cards and insert them as structured notes in their vault. No backend required — all requests go directly from the Obsidian client to `api.scryfall.com`.

The plugin lives outside the memento-app codebase and follows standard Obsidian plugin conventions (esbuild bundle, `main.js` + `manifest.json`).

## Goals / Non-Goals

**Goals:**
- Fast card lookup by English or German name from the command palette
- Create/update card notes with structured frontmatter
- Insert a wikilink to the card note at cursor
- Support both CDN image URLs and local image downloads (user-configurable)
- Simple settings UI in Obsidian preferences

**Non-Goals:**
- Deck building or collection tracking features
- Offline card database (no local card cache beyond saved notes)
- Price lookups, trading, or Scryfall account integration
- Batch import of multiple cards
- Support for other card games

## Decisions

### 1. Scryfall search endpoint: `/cards/search` with `q=` query
**Decision:** Use `https://api.scryfall.com/cards/search?q=name%3A"<term>"` for autocomplete suggestions, with a debounce on the input.

**Rationale:** Scryfall's search syntax supports `name:` for exact/partial name matching. The `/cards/autocomplete` endpoint exists but only matches English names — to support German, we need the full search endpoint filtered by `lang:de` as a fallback when the English search returns no results.

**Alternative considered:** `/cards/autocomplete` — faster but English-only, rejected.

### 2. German name search strategy: two-pass fallback
**Decision:** First search English names; if no results, search `lang:de` with the same term. Results from both passes are merged and deduplicated by Scryfall card ID.

**Rationale:** Most queries will be English. German-only fallback avoids unnecessary double requests in the common case.

### 3. Image handling: CDN URL by default, optional local download
**Decision:** The `image_url` frontmatter field always contains the Scryfall CDN URL. When "save images locally" is enabled, the plugin additionally downloads the image into a configured subfolder and sets `image_local` to the vault-relative path.

**Rationale:** CDN URLs are zero-cost and always fresh. Local images are useful for offline access or users who want full vault portability, but they consume sync quota (~100KB per card image). Making it opt-in avoids surprising users with large vaults.

**Image format:** Use Scryfall's `normal` size PNG (~200KB). The `small` size is too low-res; `large`/`png` is unnecessarily large for a reference note.

### 4. Note creation: upsert by card ID
**Decision:** Notes are named `<card-name>.md` (sanitized) and stored in the configured folder. If a note already exists for that card (matched by `scryfall_id` frontmatter), it is updated in place rather than duplicated.

**Rationale:** Users may search the same card multiple times. Upsert keeps the vault clean and lets users annotate notes without fear of them being overwritten with duplicates.

### 5. Plugin architecture: single `main.ts` with service modules
**Decision:** Organize as:
```
src/
  main.ts          — Plugin class, command registration, settings
  scryfall.ts      — API client (search, fetch card, download image)
  note-writer.ts   — Note upsert logic, frontmatter serialization
  settings.ts      — Settings schema, default values, settings tab UI
```

**Rationale:** Small enough that a monorepo/complex module system is overkill. Clear separation of API, file I/O, and UI concerns.

## Risks / Trade-offs

- **Scryfall rate limits** → Scryfall requests max 10 req/s. Debounce search input to 300ms; show a subtle loading indicator. Unlikely to hit limits with normal single-user usage.
- **Vault sync quota (local images)** → Clearly document the ~100KB/card cost in settings UI tooltip. No mitigation needed beyond user awareness.
- **Card name collisions** → Two cards with the same English name (e.g., reprints) get the same filename. Mitigation: append set code to filename if a conflict is detected (`Lightning Bolt (M11).md`).
- **German name frontmatter** → If a card was fetched via German search, store both `name` (English) and `name_de` (German) in frontmatter for consistency.

## Open Questions

- Should the plugin support double-faced cards (two images)? Start with front face only; revisit if users request it.
- Should inserting a card embed the image inline (via `![[card.png]]`) or just insert a wikilink? Make this a settings option.
