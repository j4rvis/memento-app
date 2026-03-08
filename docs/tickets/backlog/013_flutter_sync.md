# 013 Flutter Sync Engine

## Goal

Implement a sync engine that keeps the local SQLite database in sync with Supabase. On app open, immediately render from local DB, then sync in the background.

## Strategy

- **Initial sync**: On first launch (or after sign-in), do a full fetch from Supabase into local DB
- **Incremental sync**: On subsequent launches, fetch only rows where `updated_at > last_sync_at`
- **Realtime**: Subscribe to Supabase Realtime channels for live updates while app is open
- **Write path**: Write to local DB immediately (optimistic), then upsert to Supabase in background
- **Conflict resolution**: Last-write-wins using `updated_at` (already on all tables)
- **Deleted rows**: Add `deleted_at` soft-delete column to local DB; hard-delete in Supabase triggers a Realtime event

## Tasks

- Create `SyncService` class that orchestrates sync for each table
- Store `last_sync_at` per table in local preferences (`shared_preferences`)
- Implement incremental fetch using `updated_at` filter
- Subscribe to Supabase Realtime and apply incoming changes to local DB
- Handle offline mode gracefully (queue writes, flush on reconnect)
- Expose sync status (idle / syncing / error) for UI indicators

## Acceptance Criteria

- App renders local data instantly on open
- Changes made on web app appear in Flutter app within ~2 seconds (Realtime)
- Changes made offline sync when connectivity returns
- No data loss on conflict

## Dependencies

- Ticket 011 (Flutter auth — user context needed)
- Ticket 012 (Local DB)
