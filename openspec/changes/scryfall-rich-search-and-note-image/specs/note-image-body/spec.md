## ADDED Requirements

### Requirement: Card note body begins with an image embed
When a card note is created or updated, the first non-empty line of the note body SHALL be an image embed displaying the card's artwork. For remote images (when `saveImagesLocally` is false), the embed SHALL use standard markdown syntax: `![{card name}]({image_url})`. For local images (when `saveImagesLocally` is true and the image has been downloaded), the embed SHALL use Obsidian wikilink embed syntax: `![[{imagesFolder}/{card.id}.png]]`. If the card's set is in `excludedSets`, no image embed SHALL be written. If no image URL is available, no image embed SHALL be written.

#### Scenario: New note with remote image
- **WHEN** a card note is created with `saveImagesLocally: false` and an image URL is available
- **THEN** the note body begins with `![{name}]({image_url})`

#### Scenario: New note with local image
- **WHEN** a card note is created with `saveImagesLocally: true` and the image is downloaded
- **THEN** the note body begins with `![[{imagesFolder}/{card.id}.png]]`

#### Scenario: Note for card in excluded set
- **WHEN** a card note is created or updated for a card whose set is in `excludedSets`
- **THEN** no image embed is written to the note body

#### Scenario: New note with no image available
- **WHEN** a card has no image URI and no card faces with images
- **THEN** the note is created without an image embed and no error is thrown

### Requirement: Upsert updates image embed if present, prepends if absent
When an existing card note is updated (upsert), the plugin SHALL detect whether the first non-empty body line is already an image embed. If it is, the line SHALL be replaced with the current image embed (reflecting the current settings). If it is not, the image embed SHALL be prepended to the existing body content without modifying any other content.

#### Scenario: Existing note with image embed — updated
- **WHEN** an existing note's first body line is `![Old Name](old_url)` and the card is re-inserted
- **THEN** that line is replaced with the current image embed

#### Scenario: Existing note without image embed — prepended
- **WHEN** an existing note has body content but no image embed on the first line
- **THEN** the image embed is prepended and all existing body content is preserved

#### Scenario: User body content preserved
- **WHEN** a note with an existing image embed on line 1 and user-written content on lines 2+ is upserted
- **THEN** lines 2+ are unchanged
