## ADDED Requirements

### Requirement: Export config as JSON
The editor toolbar SHALL provide an **Export JSON** button that downloads the current `NewspaperConfig` as a `.json` file without requiring a server round-trip.

#### Scenario: User exports the current config
- **WHEN** the user clicks the **Export JSON** button in the editor toolbar
- **THEN** the browser downloads a file named `<template-name>.json` containing the serialized `NewspaperConfig`

#### Scenario: Exported file is valid JSON
- **WHEN** the downloaded file is parsed
- **THEN** it SHALL be valid JSON that round-trips back to the same `NewspaperConfig` shape

---

### Requirement: Import config from JSON
The editor toolbar SHALL provide an **Import JSON** button that opens a dialog allowing the user to replace the current editor config with a new `NewspaperConfig` supplied as a file upload or pasted text.

#### Scenario: User imports via file upload
- **WHEN** the user opens the Import JSON dialog, selects a `.json` file, and confirms
- **THEN** the editor config is replaced with the parsed config in memory
- **AND** a success toast is shown
- **AND** the Save button remains required to persist the change

#### Scenario: User imports via paste
- **WHEN** the user opens the Import JSON dialog, pastes valid JSON into the textarea, and confirms
- **THEN** the editor config is replaced with the parsed config in memory

#### Scenario: Invalid JSON is rejected
- **WHEN** the user submits a file or pasted text that is not valid JSON
- **THEN** the dialog shows an inline error message
- **AND** the current editor config is NOT modified

#### Scenario: Structurally invalid config is rejected
- **WHEN** the parsed JSON is missing `title` (string) or `pages` (array)
- **THEN** the dialog shows an inline error message indicating the required fields
- **AND** the current editor config is NOT modified

#### Scenario: Dialog is cancelled
- **WHEN** the user opens the Import JSON dialog and dismisses it without confirming
- **THEN** the current editor config is unchanged
