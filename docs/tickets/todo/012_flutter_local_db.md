# 012 Flutter Local Database (Local-First)

## Goal

Set up a local SQLite database using `drift` that mirrors the Supabase schema for the features the Flutter app will support. This is the foundation of local-first — data is read from SQLite immediately on app open with no network wait.

## Tasks

- Add `drift` + `sqlite3_flutter_libs` dependencies
- Define drift tables mirroring Supabase: `todos`, `todo_projects`, `notes`, `articles`
- Include `id`, `instance_id`, `user_id`, `created_at`, `updated_at` on all tables
- Set up drift database class with migrations
- Implement DAO (data access objects) for each table
- Provide the database via a dependency injection mechanism (e.g., `riverpod` or `provider`)
- Write basic CRUD operations for each table

## Acceptance Criteria

- App opens and reads from local SQLite with no network request
- Data persists across app restarts
- Schema supports all fields needed by todos, notes, and articles features

## Dependencies

- Ticket 010 (Flutter project setup)
