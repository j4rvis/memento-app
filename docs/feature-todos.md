# Feature: Todos

Task management with priorities and due dates.

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/i/[slug]/todos` | Server page | Lists all todos for the instance |

## Database

**Table:** `todos`

| Column | Type | Notes |
|--------|------|-------|
| `title` | text | Required |
| `description` | text | Optional |
| `is_completed` | boolean | Default false |
| `priority` | integer | Default 0, higher = more important |
| `due_date` | date | Optional |

## Server Actions (`todos/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `addTodo` | `(slug, formData)` | Create todo with title, description, priority, due_date |
| `toggleTodo` | `(slug, id)` | Toggle is_completed |
| `updateTodo` | `(slug, id, formData)` | Update title, description, priority, due_date |
| `deleteTodo` | `(slug, id)` | Delete todo |

## Components (`src/modules/todos/components/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `AddTodoForm` | `{ slug }` | Form with title, description, priority, due date fields |
| `TodoList` | `{ todos, slug }` | Renders list of TodoItem components |
| `TodoItem` | `{ todo, slug }` | Single todo with toggle, edit, delete actions |
