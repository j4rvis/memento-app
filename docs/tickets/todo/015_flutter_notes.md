# 015 Flutter Notes Feature

## Goal

Implement the notes feature in Flutter: list notes, create, edit (plain text), and delete.

## Tasks

- Notes list screen: sorted by `updated_at` descending, show title + excerpt
- Note detail screen: full-screen text editor (plain text, no rich text initially)
- Auto-save: debounced save to local DB every ~1 second while editing
- Create note: FAB on list screen, opens blank detail screen
- Delete note: long-press context menu or swipe on list
- Search: filter notes by title/content locally

## Acceptance Criteria

- Notes load instantly from local DB
- Edits auto-save and sync to Supabase in background
- Works offline

## Dependencies

- Ticket 012 (Local DB)
- Ticket 013 (Sync engine)
