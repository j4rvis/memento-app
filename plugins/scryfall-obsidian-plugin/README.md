# Scryfall Obsidian Plugin

Search for Magic: The Gathering cards via [Scryfall](https://scryfall.com) and insert them as structured notes in your Obsidian vault.

## Installation

1. Copy `main.js` and `manifest.json` into your vault's `.obsidian/plugins/scryfall-obsidian-plugin/` folder.
2. Reload Obsidian and enable the plugin under **Settings → Community plugins**.

## Usage

1. Open the command palette (`Cmd/Ctrl + P`).
2. Run **Scryfall: Insert card**.
3. Type a card name (English or German).
4. Select a card from the results.

A note is created in your configured card folder with full card data. A `[[wikilink]]` is inserted at the cursor.

## Settings

| Setting | Default | Description |
|---|---|---|
| Card notes folder | `Cards` | Where card notes are saved |
| Language preference | English | Which language is searched first; the other is the fallback |
| Save images locally | Off | Download card images into the vault (~100 KB each) |
| Images folder | `Cards/images` | Where local images are saved (visible when local saving is on) |
| Insert image inline | Off | Also insert an image embed below the wikilink |

## Card Note Format

Each card note contains YAML frontmatter:

```yaml
---
scryfall_id: "..."
name: "Lightning Bolt"
mana_cost: "{R}"
type_line: "Instant"
oracle_text: "Lightning Bolt deals 3 damage to any target."
set: "m11"
set_name: "Magic 2011"
rarity: "common"
image_url: "https://cards.scryfall.io/normal/..."
legalities:
  standard: "not_legal"
  modern: "legal"
  legacy: "legal"
---
```

If local image saving is enabled, `image_local` is added with the vault-relative path.

## Development

```bash
npm install
npm run dev   # watch mode
npm run build # production bundle
```
