## Why

Magic: The Gathering card references in Obsidian are currently manual — finding card details, copying properties, and formatting notes takes friction out of writing. A Scryfall integration would let you pull any card into your vault instantly, keeping your notes rich and accurate without leaving Obsidian.

## What Changes

- New standalone Obsidian plugin (TypeScript) — not part of the memento-app codebase
- Card search command via command palette (`Scryfall: Insert card`) with fuzzy autocomplete
- Search matches against both English and German card names
- Found cards are saved as notes in a configurable vault folder, with frontmatter properties populated from Scryfall data
- Card images stored as Scryfall CDN URLs in frontmatter by default, with an option to download and save images locally inside the vault
- Plugin settings: target folder, preferred language, image display style, local image saving toggle

## Capabilities

### New Capabilities

- `card-search`: Fuzzy search against Scryfall API by English or German card name, returning a ranked list of matches
- `card-note-creation`: Create or update a note for a card in the configured folder, populated with structured frontmatter (name, mana cost, type, oracle text, image URL, set, legalities)
- `card-insertion`: Insert a wikilink or inline card reference at the cursor position after search
- `plugin-settings`: Configuration UI for target folder, language preference, image display mode, and local image saving (with configurable image subfolder)

### Modified Capabilities

<!-- none — this is a new standalone plugin -->

## Impact

- New project: Obsidian plugin (TypeScript, esbuild bundled)
- External API dependency: Scryfall API (`https://api.scryfall.com`) — free, no auth required
- No changes to the memento-app codebase
- Obsidian plugin API (`obsidian` npm package) required
