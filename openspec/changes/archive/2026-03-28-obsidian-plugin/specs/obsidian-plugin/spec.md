## ADDED Requirements

### Requirement: Plugin settings store API credentials and base URL
The plugin SHALL provide a settings panel (Obsidian Settings → Community Plugins → Memento) where the user can enter `apiUrl` (the Memento base URL), `clientId`, and `clientSecret`. Settings SHALL be persisted via `plugin.saveData()` / `plugin.loadData()`.

#### Scenario: User saves valid settings
- **WHEN** the user enters a valid `apiUrl`, `clientId`, and `clientSecret` and clicks Save
- **THEN** the plugin persists the values and shows a success notice

#### Scenario: Settings are loaded on plugin startup
- **WHEN** the plugin loads
- **THEN** the previously saved `apiUrl`, `clientId`, and `clientSecret` are populated in the settings panel

### Requirement: Plugin authenticates with Memento on demand
The plugin SHALL call `POST {apiUrl}/api/auth/token` with `{ client_id, client_secret }` to obtain a Bearer JWT. The token SHALL be cached in memory and reused for subsequent requests. When a request returns 401, the plugin SHALL re-authenticate once and retry the request.

#### Scenario: Valid credentials yield a cached token
- **WHEN** any command triggers an API call and no token is cached
- **THEN** the plugin authenticates, caches the JWT, and proceeds with the API call

#### Scenario: Expired token triggers re-authentication
- **WHEN** an API call returns 401
- **THEN** the plugin discards the cached token, re-authenticates, and retries the original request once

#### Scenario: Invalid credentials show an error notice
- **WHEN** authentication fails with a 401 from the token endpoint
- **THEN** the plugin shows a notice "Memento: Authentication failed — check your credentials in settings" and does not proceed

### Requirement: "Save bookmark" command captures a URL or the current note
The plugin SHALL register a command "Memento: Save bookmark". When invoked, the plugin SHALL detect whether an active note is open. If a note is active, the modal SHALL default to **note mode**; otherwise it SHALL default to **URL mode**. The user SHALL be able to switch between modes within the modal.

In **URL mode**, the modal SHALL pre-fill the URL field with clipboard content if it is a valid HTTP/HTTPS URL. The user SHALL be able to confirm or edit the URL and optionally provide a title. On submit, the plugin SHALL call `POST {apiUrl}/api/v1/bookmarks` with `{ url, title? }`.

In **note mode**, the modal SHALL display the resolved note title (frontmatter `title` → filename without extension) and a truncated excerpt (first non-frontmatter paragraph, up to 300 chars) for confirmation. On submit, the plugin SHALL call `POST {apiUrl}/api/v1/bookmarks` with `{ url, title, content, excerpt }` where `url` is `obsidian://open?vault=<vault>&file=<path>` (URI-encoded), `content` is the full note markdown, and `excerpt` is the truncated first paragraph.

#### Scenario: Clipboard URL is pre-filled in URL mode
- **WHEN** the user runs "Memento: Save bookmark" with no active note and the clipboard contains a valid URL
- **THEN** the modal opens in URL mode with the URL field populated

#### Scenario: Active note defaults modal to note mode
- **WHEN** the user runs "Memento: Save bookmark" while a note is open in the editor
- **THEN** the modal opens in note mode showing the note title and excerpt

#### Scenario: Note mode submits full content to the API
- **WHEN** the user confirms the note modal
- **THEN** the plugin calls `POST /api/v1/bookmarks` with `url` set to the Obsidian deep link, `title` from the note, `content` as the full markdown, and `excerpt` as the first paragraph

#### Scenario: Successful bookmark creation shows a notice
- **WHEN** the user submits the modal (either mode) with valid data
- **THEN** the plugin calls the bookmarks API, receives 201, and shows "Memento: Bookmark saved"

#### Scenario: Duplicate URL shows a conflict notice
- **WHEN** the API returns 409
- **THEN** the plugin shows "Memento: This URL is already bookmarked"

#### Scenario: Empty URL prevents submission in URL mode
- **WHEN** the user submits the modal in URL mode with an empty URL field
- **THEN** the plugin shows inline validation "URL is required" and does not call the API

### Requirement: "Create todo" command creates a new todo
The plugin SHALL register a command "Memento: Create todo". It SHALL open a modal with a required title field and an optional due date field (YYYY-MM-DD). On submit, the plugin SHALL call `POST {apiUrl}/api/v1/todos` with `{ title, due_date? }`.

#### Scenario: Successful todo creation shows a notice
- **WHEN** the user submits the modal with a valid title
- **THEN** the plugin calls the todos API, receives 201, and shows "Memento: Todo created"

#### Scenario: Missing title prevents submission
- **WHEN** the user submits the modal with an empty title field
- **THEN** the plugin shows inline validation "Title is required" and does not call the API

#### Scenario: Optional due date is sent when provided
- **WHEN** the user fills in a due date and submits
- **THEN** the plugin includes `due_date` in the POST body

### Requirement: "Generate newspaper" command triggers newspaper generation
The plugin SHALL register a command "Memento: Generate newspaper". It SHALL read `templateId` from plugin settings. If set, it SHALL call `POST {apiUrl}/api/v1/newspaper/generate?format=json` with `{ template_id }`. On success (200), it SHALL show a notice "Memento: Newspaper generation started".

#### Scenario: Template ID configured — generation triggered
- **WHEN** the user runs "Memento: Generate newspaper" and `templateId` is set in settings
- **THEN** the plugin calls the newspaper API with the template_id and shows a success notice

#### Scenario: No template ID configured shows a warning
- **WHEN** the user runs "Memento: Generate newspaper" and no `templateId` is set
- **THEN** the plugin shows a notice "Memento: No template configured — set a Template ID in settings"

#### Scenario: API error surfaces as notice
- **WHEN** the newspaper API returns a non-2xx response
- **THEN** the plugin shows "Memento: Newspaper generation failed — {error message from API}"

### Requirement: Network and API errors are surfaced as notices
For any API call, the plugin SHALL catch network errors and unexpected non-2xx responses and display them as Obsidian Notice toasts. Errors SHALL NOT be silently swallowed.

#### Scenario: Network failure shows a notice
- **WHEN** a fetch call throws (e.g., no internet, wrong API URL)
- **THEN** the plugin shows "Memento: Network error — check your API URL in settings"

#### Scenario: Unexpected API error shows a notice
- **WHEN** the API returns a 5xx response
- **THEN** the plugin shows "Memento: Server error (500)"
