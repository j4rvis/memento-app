## ADDED Requirements

### Requirement: Search cards by English name
The plugin SHALL search for Magic: The Gathering cards by English name using the Scryfall API, returning a ranked list of matching results.

#### Scenario: Partial English name match
- **WHEN** the user types a partial card name (e.g., "lightning b")
- **THEN** the plugin returns up to 10 cards whose English names contain the term, ordered by relevance

#### Scenario: No English results found
- **WHEN** the English name search returns zero results
- **THEN** the plugin automatically falls back to a German name search with the same term

#### Scenario: Empty query
- **WHEN** the user has not typed anything
- **THEN** no search request is made and the results list is empty

### Requirement: Search cards by German name
The plugin SHALL support searching by German card name as a fallback when the English search returns no results.

#### Scenario: German-only term matches
- **WHEN** the English search returns no results and the German search finds matches
- **THEN** results from the German search are shown, each annotated with its English name

#### Scenario: Both English and German results exist
- **WHEN** the search term matches both English and German names for different cards
- **THEN** English results are shown first, followed by non-duplicate German results, deduplicated by Scryfall card ID

### Requirement: Debounced search input
The plugin SHALL debounce search requests by 300ms to avoid excessive API calls while the user is typing.

#### Scenario: Rapid typing
- **WHEN** the user types multiple characters in quick succession within 300ms
- **THEN** only one search request is sent after the 300ms pause

#### Scenario: Slow typing
- **WHEN** the user pauses for more than 300ms between keystrokes
- **THEN** a search request is sent after each pause

### Requirement: Loading indicator during search
The plugin SHALL display a loading indicator while a search request is in progress.

#### Scenario: Search in flight
- **WHEN** a search request has been sent and no response yet received
- **THEN** a loading indicator is visible in the search UI

#### Scenario: Search complete
- **WHEN** the search response is received
- **THEN** the loading indicator is hidden and results are displayed
