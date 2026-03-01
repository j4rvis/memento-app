# 014 Flutter Todos Feature

## Goal

Implement the todos feature in Flutter: list todos by project, create, toggle complete, and delete. Reads from local DB (instant), syncs in background.

## Tasks

- Todos list screen: grouped by project, sorted by `created_at`
- Todo item: title, checkbox, swipe-to-delete
- Create todo: inline text field at bottom of list, submit on enter
- Toggle complete: optimistic update in local DB, background sync
- Delete todo: swipe gesture, undo via snackbar
- Projects sidebar or tab: list projects, select active project
- Shared projects (from `is_shared` flag): show member todos too
- Instance picker: if user has multiple instances, show picker on launch

## Acceptance Criteria

- User sees their todos immediately on app open (from local DB)
- Creating/toggling/deleting syncs to Supabase within seconds
- Works offline — syncs when back online

## Dependencies

- Ticket 012 (Local DB)
- Ticket 013 (Sync engine)
