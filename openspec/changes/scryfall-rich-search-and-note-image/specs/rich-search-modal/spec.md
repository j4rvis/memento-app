## ADDED Requirements

### Requirement: Search dropdown displays card artwork thumbnail
Each suggestion row in the search modal SHALL display the card's artwork as a thumbnail image to the left of the card name and metadata. The `small` image size from `image_uris.small` SHALL be used. Double-faced cards SHALL fall back to `card_faces[0].image_uris.small`. If no image URL is available, the image slot SHALL be omitted. If the card's set is in the `excludedSets` setting, the image SHALL be suppressed and no image element SHALL be rendered.

#### Scenario: Single-faced card with image
- **WHEN** a search returns a card with `image_uris.small` set
- **THEN** the suggestion row displays an `<img>` element with that URL as its source

#### Scenario: Double-faced card (DFC) fallback
- **WHEN** a search returns a card where `image_uris` is absent but `card_faces[0].image_uris.small` is present
- **THEN** the suggestion row displays the front face thumbnail

#### Scenario: Card in excluded set
- **WHEN** a search returns a card whose `set` code is in `settings.excludedSets`
- **THEN** no image element is rendered in that suggestion row

#### Scenario: Card with no image URI
- **WHEN** a search returns a card with no `image_uris` and no `card_faces`
- **THEN** the suggestion row renders without an image element and no error is thrown

### Requirement: Search dropdown renders mana symbols as SVG icons
The mana cost of each suggestion row SHALL be rendered as a sequence of SVG icon images rather than raw text. Each mana symbol token parsed from the `mana_cost` string (e.g. `{W}`, `{2}`, `{G/U}`) SHALL be rendered as an `<img>` pointing to `https://svgs.scryfall.io/card-symbols/{CODE}.svg`, where `CODE` is the token content with any `/` characters removed (e.g. `G/U` → `GU`). Each symbol image SHALL be 16×16 pixels. If `mana_cost` is absent or empty, no mana symbols SHALL be rendered.

#### Scenario: Standard mana cost rendered as symbols
- **WHEN** a card has `mana_cost: "{2}{W}{W}"`
- **THEN** the row renders three symbol images: `2.svg`, `W.svg`, `W.svg` at 16×16px

#### Scenario: Hybrid mana symbol
- **WHEN** a card has a hybrid symbol like `{G/U}`
- **THEN** the rendered image src is `.../GU.svg` (slash stripped)

#### Scenario: Colorless or X cost
- **WHEN** a card has `mana_cost: "{X}{B}{B}"`
- **THEN** the row renders `X.svg`, `B.svg`, `B.svg`

#### Scenario: Card with no mana cost
- **WHEN** a card has no `mana_cost` field (e.g. lands)
- **THEN** no mana symbol images are rendered and no error is thrown
