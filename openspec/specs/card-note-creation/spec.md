## ADDED Requirements

### Requirement: Create card note with frontmatter
The plugin SHALL create a Markdown note for a selected card in the configured target folder, with structured YAML frontmatter populated from Scryfall data.

#### Scenario: New card note created
- **WHEN** the user selects a card from search results and no note exists for that card
- **THEN** a new Markdown file is created at `<target-folder>/<card-name>.md` with frontmatter containing: `scryfall_id`, `name`, `mana_cost`, `type_line`, `oracle_text`, `set`, `set_name`, `rarity`, `image_url`, and `legalities`

#### Scenario: Note filename collision (same name, different card)
- **WHEN** a card note with the same name already exists but has a different `scryfall_id`
- **THEN** the new note is created as `<target-folder>/<card-name> (<set-code>).md` to avoid overwriting the existing note

### Requirement: Upsert existing card note
The plugin SHALL update an existing card note in place if a note with the matching `scryfall_id` already exists in the target folder.

#### Scenario: Re-inserting an existing card
- **WHEN** the user selects a card whose `scryfall_id` matches an existing note's frontmatter
- **THEN** the existing note's frontmatter is updated with fresh Scryfall data, and any user-written body content below the frontmatter is preserved

### Requirement: Store German name when applicable
The plugin SHALL store the German card name in frontmatter when the card was found via a German name search.

#### Scenario: Card found by German name
- **WHEN** a card is selected from German search results
- **THEN** the note frontmatter includes both `name` (English) and `name_de` (German) fields

#### Scenario: Card found by English name
- **WHEN** a card is selected from English search results
- **THEN** only the `name` field is written; `name_de` is omitted

### Requirement: Save card image locally (optional)
When local image saving is enabled in settings, the plugin SHALL download the card image from Scryfall and save it to a configurable images subfolder within the vault.

#### Scenario: Local image saving enabled
- **WHEN** the user selects a card and "save images locally" is enabled
- **THEN** the card image (Scryfall `normal` size PNG) is downloaded and saved to `<images-folder>/<scryfall-id>.png`, and `image_local` is set in frontmatter to the vault-relative path

#### Scenario: Image already downloaded
- **WHEN** the card image file already exists at the expected local path
- **THEN** the image is not re-downloaded; the existing path is used in frontmatter

#### Scenario: Local image saving disabled
- **WHEN** "save images locally" is disabled
- **THEN** only `image_url` (CDN URL) is written; `image_local` is omitted from frontmatter
