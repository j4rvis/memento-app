## ADDED Requirements

### Requirement: Autocomplete shows suggestions after async fetch resolves
The set autocomplete input SHALL display matching suggestions once `fetchAllSets()` has completed, regardless of whether the fetch finished before or after `SetSuggest` was constructed.

#### Scenario: User types before sets are loaded
- **WHEN** the settings tab opens and the user types in the "Add excluded set" field before the fetch resolves
- **THEN** no suggestions are shown (input is empty)

#### Scenario: User types after sets are loaded
- **WHEN** the settings tab opens and the fetch has resolved, and the user types a set name or code
- **THEN** matching suggestions appear in the dropdown

#### Scenario: Query matches by name
- **WHEN** the user types a partial set name (e.g. "secret")
- **THEN** the dropdown includes sets whose name contains "secret" (case-insensitive)

#### Scenario: Query matches by code
- **WHEN** the user types a set code (e.g. "sld")
- **THEN** the dropdown includes the matching set

### Requirement: Suggestions are grouped by set type with separators
The suggestion dropdown SHALL group results by normalized set type and display a non-selectable separator label between each group.

#### Scenario: Results span multiple set types
- **WHEN** the filtered results include sets from different types (e.g. expansion and promo)
- **THEN** each group is preceded by a separator label (e.g. "Expansions & Core Sets", "Promo & Extras")

#### Scenario: Type separator is not selectable
- **WHEN** a separator label is shown in the dropdown
- **THEN** clicking or selecting it does nothing (it is a visual label only)

#### Scenario: Single type results have no separator
- **WHEN** all filtered results belong to the same set type
- **THEN** a separator MAY still be shown, but it does not interfere with selection

### Requirement: Fallback link to Scryfall sets page
The "Add excluded set" setting description SHALL include a link to `https://scryfall.com/sets` so users can browse all available set codes manually.

#### Scenario: Link is visible in settings
- **WHEN** the user opens the Scryfall plugin settings tab
- **THEN** the "Add excluded set" section shows a clickable link labeled with reference to "Browse all sets on Scryfall" or equivalent

### Requirement: Set input field is wider
The "Add excluded set" text input SHALL be visually wider than the default Obsidian text input so that long set names are not truncated.

#### Scenario: Long set name fits in input
- **WHEN** the user selects a set with a long name (e.g. "Magic: The Gathering Commander")
- **THEN** the set name is not clipped or truncated in the input field

### Requirement: ScryfallSetInfo includes set_type
The `ScryfallSetInfo` interface SHALL include a `set_type` field populated from the Scryfall API response.

#### Scenario: fetchAllSets returns set_type
- **WHEN** `fetchAllSets()` is called and the API responds successfully
- **THEN** each returned `ScryfallSetInfo` object has a non-empty `set_type` string matching the value from the API (e.g. `"expansion"`, `"commander"`, `"promo"`)
