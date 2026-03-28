## ADDED Requirements

### Requirement: User can browse available X resources after connecting
After connecting an X account, the system SHALL allow the user to browse their owned lists, subscribed lists, and their own user timeline as subscribable resources.

#### Scenario: Lists are loaded from X API
- **WHEN** a user opens the "Add X Feed" dialog after connecting
- **THEN** the system calls X API to fetch the user's owned and subscribed lists and displays them with name and member count

#### Scenario: User timeline is always available
- **WHEN** a user opens the "Add X Feed" dialog
- **THEN** their own X user timeline is shown as a subscribable option regardless of list membership

#### Scenario: API error shows fallback
- **WHEN** the X API call to list resources fails
- **THEN** the dialog shows an error state and allows manual entry of a list ID or username

### Requirement: User can subscribe to an X list or user timeline
The system SHALL create a `feeds` row for each subscribed X resource. The feed SHALL have `provider = 'x'`, `provider_resource_type = 'list'` or `'user'`, `external_connection_id` pointing to the X connection, and `provider_resource_id` set to the X list ID or user ID.

#### Scenario: Subscribing to a list creates a feed
- **WHEN** a user selects an X list and clicks "Subscribe"
- **THEN** a `feeds` row is created with the list's name as title, `provider = 'x'`, and `provider_resource_type = 'list'`

#### Scenario: Subscribing to a user timeline creates a feed
- **WHEN** a user subscribes to their own or another user's timeline
- **THEN** a `feeds` row is created with `@{username}` as title, `provider = 'x'`, and `provider_resource_type = 'user'`

#### Scenario: Duplicate subscription is prevented
- **WHEN** a user attempts to subscribe to a resource they already have a feed for
- **THEN** the system shows an error and does not create a duplicate `feeds` row

### Requirement: X feeds appear in the feeds list alongside RSS feeds
The system SHALL display `feeds` rows with social providers in the feeds list. The feed title and unread count SHALL be shown identically to RSS feeds. A provider badge (e.g. "𝕏") SHALL distinguish social feeds visually.

#### Scenario: X feed appears in feed list
- **WHEN** a user navigates to the feeds page
- **THEN** their X list and user feeds appear in the sidebar alongside RSS feeds with an X badge

#### Scenario: Feed entries from X are shown in the reader
- **WHEN** a user clicks an X feed
- **THEN** the feed entries panel shows tweet entries ordered by `published_at` descending

### Requirement: User can unsubscribe from an X feed
The system SHALL allow a user to delete a social feed from the feeds list, removing the `feeds` row and all its `feed_entries`.

#### Scenario: Deleting an X feed removes it and its entries
- **WHEN** a user deletes an X feed
- **THEN** the `feeds` row is removed and all associated `feed_entries` are deleted via cascade
