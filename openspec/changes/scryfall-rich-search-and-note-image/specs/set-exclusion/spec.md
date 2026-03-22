## ADDED Requirements

### Requirement: Excluded sets stored as list of set codes in plugin settings
The plugin settings SHALL include an `excludedSets` field storing an array of Scryfall set codes (e.g. `["sld", "slx"]`). The default value SHALL be an empty array. The setting SHALL persist across plugin reloads via `saveData` / `loadData`.

#### Scenario: Default state
- **WHEN** the plugin is first installed with no prior data
- **THEN** `settings.excludedSets` is an empty array

#### Scenario: Persisted after reload
- **WHEN** the user adds set codes and reloads Obsidian
- **THEN** the excluded sets list is restored from saved data

### Requirement: Settings tab provides UI to add and remove excluded sets
The settings tab SHALL display the current list of excluded sets with a remove button per entry. It SHALL provide a text input with inline autocomplete for adding new sets. Typing in the input SHALL show matching sets from the Scryfall `/sets` API. Selecting a suggestion SHALL add the set code to `excludedSets` (if not already present) and clear the input. The input label and description SHALL make clear that sets in this list will have their images suppressed everywhere.

#### Scenario: Adding a set via autocomplete
- **WHEN** the user types "spider" in the set exclusion input
- **THEN** a suggestion list appears containing sets with names matching "spider"
- **AND WHEN** the user selects a suggestion
- **THEN** that set's code is appended to `excludedSets`, saved, and the row appears in the exclusion list

#### Scenario: Duplicate prevention
- **WHEN** the user selects a set that is already in `excludedSets`
- **THEN** no duplicate is added and the input is cleared silently

#### Scenario: Removing a set
- **WHEN** the user clicks the remove button next to a set in the exclusion list
- **THEN** that set code is removed from `excludedSets` and saved

### Requirement: Set autocomplete data fetched from Scryfall `/sets`
When the settings tab is opened, the plugin SHALL fetch the full set list from `GET https://api.scryfall.io/sets`. The response's `data` array SHALL be cached in memory for the lifetime of the settings tab. Suggestions SHALL filter by matching the user's input against both the set `name` and `code` fields (case-insensitive). A maximum of 10 suggestions SHALL be shown at a time.

#### Scenario: Fetch on settings open
- **WHEN** the settings tab is opened
- **THEN** a request is made to `https://api.scryfall.com/sets` and the result is cached

#### Scenario: Filtering by name
- **WHEN** the user types "secret lair"
- **THEN** suggestions include sets whose name contains "secret lair" (case-insensitive)

#### Scenario: Filtering by code
- **WHEN** the user types "sld"
- **THEN** the set with code "sld" appears in suggestions

#### Scenario: Max suggestions shown
- **WHEN** the query matches more than 10 sets
- **THEN** only 10 suggestions are displayed
