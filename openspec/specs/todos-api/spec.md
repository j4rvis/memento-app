## ADDED Requirements

### Requirement: Todos can be listed via API
The system SHALL expose `GET /api/v1/todos`. It SHALL return all todos for the authenticated instance, ordered by `created_at` descending, wrapped in `{ "data": [...], "meta": { "total": N } }`.

#### Scenario: Authenticated request returns todos list
- **WHEN** `GET /api/v1/todos` is called with a valid Bearer JWT containing `todos:read`
- **THEN** the system returns 200 with `{ "data": [{ id, title, description, is_completed, priority, due_date, project_id, created_at, updated_at }], "meta": { "total": N } }`

#### Scenario: Unauthenticated request returns 401
- **WHEN** `GET /api/v1/todos` is called without Authorization header
- **THEN** the system returns 401

#### Scenario: Insufficient scope returns 403
- **WHEN** `GET /api/v1/todos` is called with a JWT that lacks `todos:read` and `*`
- **THEN** the system returns 403

### Requirement: A single todo can be retrieved via API
The system SHALL expose `GET /api/v1/todos/:id`. It SHALL return the todo by id if it belongs to the authenticated instance.

#### Scenario: Known todo returns full record
- **WHEN** `GET /api/v1/todos/:id` is called with a valid JWT and an id that exists in the instance
- **THEN** the system returns 200 with `{ "data": { ...todo } }`

#### Scenario: Unknown todo returns 404
- **WHEN** `GET /api/v1/todos/:id` is called with an id that does not exist in the instance
- **THEN** the system returns 404 with `{ "error": { "code": "NOT_FOUND", ... } }`

### Requirement: Todos can be created via API
The system SHALL expose `POST /api/v1/todos`. It SHALL accept a body with `title` (required), and optional `description`, `priority` (0–3), `due_date` (YYYY-MM-DD), and `project_id` (uuid).

#### Scenario: Valid body creates a todo
- **WHEN** `POST /api/v1/todos` is called with `{ "title": "Buy milk" }` and a JWT with `todos:write`
- **THEN** the system returns 201 with `{ "data": { ...todo } }`

#### Scenario: Missing title returns 422
- **WHEN** `POST /api/v1/todos` is called with an empty body or without `title`
- **THEN** the system returns 422 with `{ "error": { "code": "VALIDATION_ERROR", "message": "title is required" } }`

### Requirement: Todos can be updated via API
The system SHALL expose `PUT /api/v1/todos/:id`. It SHALL accept a partial body with any combination of `title`, `description`, `is_completed`, `priority`, `due_date`, and `project_id`.

#### Scenario: Partial update modifies specified fields
- **WHEN** `PUT /api/v1/todos/:id` is called with `{ "is_completed": true }` and a JWT with `todos:write`
- **THEN** the system returns 200 with `{ "data": { ...todo } }` where `is_completed` is `true`

#### Scenario: Update of non-existent todo returns 404
- **WHEN** `PUT /api/v1/todos/:id` is called with an unknown id
- **THEN** the system returns 404

### Requirement: Todos can be deleted via API
The system SHALL expose `DELETE /api/v1/todos/:id`. It SHALL permanently delete the todo from the instance.

#### Scenario: Existing todo is deleted
- **WHEN** `DELETE /api/v1/todos/:id` is called with a valid JWT with `todos:write`
- **THEN** the system returns 204 with no body

#### Scenario: Deleting non-existent todo returns 404
- **WHEN** `DELETE /api/v1/todos/:id` is called with an unknown id
- **THEN** the system returns 404
