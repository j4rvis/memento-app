## 1. Project Scaffolding

- [x] 1.1 Initialize Obsidian plugin repo with `manifest.json`, `package.json`, and esbuild config
- [x] 1.2 Add `obsidian` npm package and TypeScript config
- [x] 1.3 Create `src/` directory structure: `main.ts`, `scryfall.ts`, `note-writer.ts`, `settings.ts`

## 2. Settings

- [x] 2.1 Define settings schema and default values in `settings.ts` (target folder, language preference, local image saving toggle, images subfolder, insert image inline toggle)
- [x] 2.2 Implement `ScryfallSettingTab` using Obsidian's `PluginSettingTab` API
- [x] 2.3 Wire settings load/save in `main.ts` using `loadData()` / `saveData()`

## 3. Scryfall API Client

- [x] 3.1 Implement `searchByName(term, lang)` in `scryfall.ts` using `/cards/search` endpoint
- [x] 3.2 Implement two-pass search logic: English first, German fallback (respecting language preference setting)
- [x] 3.3 Deduplicate results by `scryfall_id` when merging English and German passes
- [x] 3.4 Implement `downloadImage(url, destPath)` using Obsidian's `requestUrl` API (no Node.js `fs` directly)

## 4. Card Note Writer

- [x] 4.1 Implement `upsertCardNote(card, vault, settings)` in `note-writer.ts`
- [x] 4.2 Build frontmatter serialization (all required fields + optional `name_de` and `image_local`)
- [x] 4.3 Implement upsert logic: scan target folder for existing note with matching `scryfall_id`, update frontmatter while preserving body content
- [x] 4.4 Implement filename collision handling: append `(<set-code>)` when name conflicts with a different card's note
- [x] 4.5 Ensure target folder and images subfolder are created if they don't exist

## 5. Search Modal

- [x] 5.1 Implement `ScryfallSearchModal` extending Obsidian's `SuggestModal<Card>`
- [x] 5.2 Wire debounced search (300ms) to `getSuggestions()` with loading indicator
- [x] 5.3 Render each suggestion with card name, mano cost, and set name
- [x] 5.4 On `onChooseSuggestion`: call `upsertCardNote`, download image if enabled, insert wikilink (+ optional image embed) at cursor

## 6. Command Registration

- [x] 6.1 Register "Scryfall: Insert card" command in `main.ts` that opens `ScryfallSearchModal`

## 7. Build & Release

- [x] 7.1 Configure esbuild to bundle `main.ts` → `main.js` with Obsidian externals
- [ ] 7.2 Verify plugin loads in Obsidian developer mode with no console errors
- [x] 7.3 Write a `README.md` covering installation, settings, and basic usage
