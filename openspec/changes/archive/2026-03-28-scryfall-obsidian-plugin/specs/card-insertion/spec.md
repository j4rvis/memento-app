## ADDED Requirements

### Requirement: Insert card wikilink at cursor
The plugin SHALL insert a wikilink to the card note at the current cursor position in the active editor after a card is selected.

#### Scenario: Card selected from search results
- **WHEN** the user selects a card and an active editor is open
- **THEN** `[[<card-name>]]` is inserted at the cursor position

#### Scenario: No active editor
- **WHEN** the user selects a card but no editor is open
- **THEN** no insertion occurs; the note is still created/updated in the target folder

### Requirement: Insert image inline (optional)
When the "insert image inline" setting is enabled, the plugin SHALL also insert an image embed below the wikilink.

#### Scenario: Inline image enabled, local image saved
- **WHEN** "insert image inline" is enabled and "save images locally" is enabled
- **THEN** `![[<image-filename>.png]]` is inserted below the wikilink

#### Scenario: Inline image enabled, CDN only
- **WHEN** "insert image inline" is enabled and "save images locally" is disabled
- **THEN** a Markdown image tag `![](<scryfall-cdn-url>)` is inserted below the wikilink

#### Scenario: Inline image disabled
- **WHEN** "insert image inline" is disabled
- **THEN** only the wikilink is inserted; no image markup is added

### Requirement: Command palette entry
The plugin SHALL register a command palette command that opens the card search modal.

#### Scenario: Command invoked
- **WHEN** the user opens the command palette and selects "Scryfall: Insert card"
- **THEN** the card search modal opens with focus on the search input
