# 016 Flutter Articles Feature

## Goal

Implement the read-later articles feature in Flutter: list saved articles, mark as read, open in in-app browser or reader view.

## Tasks

- Articles list screen: sorted by `created_at` desc, unread first
- Article item: title, domain, read/unread indicator, thumbnail if available
- Open article: in-app WebView (`webview_flutter`) or system browser
- Reader mode: display pre-scraped `content` from Supabase in a clean reading view (HTML rendered via `flutter_widget_from_html` or similar)
- Mark as read: tap or swipe action, syncs to Supabase
- Delete article: swipe-to-delete
- No article scraping in Flutter — scraping is done server-side by Next.js; Flutter just reads from Supabase

## Acceptance Criteria

- Articles list loads instantly from local DB
- Reader view renders scraped content cleanly
- Read status syncs to Supabase

## Dependencies

- Ticket 012 (Local DB)
- Ticket 013 (Sync engine)
