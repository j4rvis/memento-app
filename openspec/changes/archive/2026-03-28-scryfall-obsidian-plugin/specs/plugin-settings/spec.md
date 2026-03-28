## ADDED Requirements

### Requirement: Configure target folder
The plugin SHALL allow the user to configure the vault folder where card notes are saved.

#### Scenario: Default folder
- **WHEN** no target folder has been configured
- **THEN** card notes are saved to a folder named `Cards` at the vault root

#### Scenario: Custom folder configured
- **WHEN** the user sets a custom target folder path in settings
- **THEN** all new card notes are created under that path; the folder is created if it does not exist

### Requirement: Configure language preference
The plugin SHALL allow the user to set a preferred search language (English or German), which determines which search pass runs first.

#### Scenario: English preferred (default)
- **WHEN** language preference is set to English
- **THEN** English search runs first; German is the fallback

#### Scenario: German preferred
- **WHEN** language preference is set to German
- **THEN** German search runs first; English is the fallback

### Requirement: Configure local image saving
The plugin SHALL allow the user to toggle local image saving on or off, and configure the subfolder where images are stored.

#### Scenario: Local image saving disabled (default)
- **WHEN** "save images locally" is off
- **THEN** only Scryfall CDN URLs are stored in card note frontmatter

#### Scenario: Local image saving enabled
- **WHEN** "save images locally" is on
- **THEN** images are downloaded and saved; `image_local` is set in frontmatter alongside `image_url`

#### Scenario: Custom images subfolder
- **WHEN** a custom images subfolder is configured
- **THEN** downloaded images are saved to that path; the folder is created if it does not exist

#### Scenario: Default images subfolder
- **WHEN** no images subfolder is configured but local saving is enabled
- **THEN** images are saved to `Cards/images/` within the vault

### Requirement: Configure inline image insertion
The plugin SHALL allow the user to toggle whether an image embed is inserted alongside the wikilink.

#### Scenario: Inline image insertion disabled (default)
- **WHEN** "insert image inline" is off
- **THEN** only a wikilink is inserted at cursor; no image markup

#### Scenario: Inline image insertion enabled
- **WHEN** "insert image inline" is on
- **THEN** a wikilink and image embed are both inserted at cursor

### Requirement: Settings persisted across sessions
The plugin SHALL persist all settings using Obsidian's plugin data storage so they survive Obsidian restarts.

#### Scenario: Settings saved
- **WHEN** the user changes a setting and closes the settings tab
- **THEN** the new value is stored and restored on the next Obsidian launch
