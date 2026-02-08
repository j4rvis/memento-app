# Database

Supabase Postgres with Row Level Security (RLS) on all tables. Project ref: `clqihjujzadhiyreyvbf`.

## Tables

### Core Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `profiles` | User profiles (auto-created via trigger) | `id` (FK auth.users), `full_name`, `avatar_url` |
| `instances` | Workspaces | `id`, `name`, `slug` (unique, lowercase+hyphens), `owner_id`, `settings` (JSONB) |
| `instance_memberships` | User-to-instance with role | `instance_id`, `user_id`, `role` (instance_role enum) |

### Feature Tables

All feature tables have: `id` (uuid PK), `user_id` (FK auth.users), `instance_id` (FK instances, NOT NULL), `created_at`, `updated_at`.

| Table | Additional Key Columns |
|-------|----------------------|
| `todos` | `title`, `description`, `is_completed`, `priority` (int), `due_date` |
| `notes` | `title`, `content` (text), `is_pinned` |
| `feeds` | `title`, `url`, `site_url`, `description`, `last_fetched_at`, `fetch_error` |
| `feed_entries` | `feed_id` (FK feeds), `guid`, `title`, `url`, `author`, `content`, `summary`, `image_url`, `published_at`, `is_read`, `is_starred` |
| `articles` | `url`, `title`, `content`, `excerpt`, `author`, `site_name`, `image_url`, `content_type` (enum), `youtube_video_id`, `is_read`, `is_archived`, `scraped_at`, `scrape_error` |
| `newspapers` | `title`, `description`, `kindle_email` |
| `newspaper_blocks` | `newspaper_id` (FK newspapers), `block_type` (enum), `title`, `config` (JSONB), `sort_order` (int) |
| `newspaper_editions` | `newspaper_id` (FK newspapers), `title`, `content` (JSONB snapshot) |

## Enums

| Enum | Values |
|------|--------|
| `instance_role` | `owner`, `admin`, `member` |
| `block_type` | `todos`, `notes`, `rss`, `articles`, `text`, `weather` |
| `content_type` | `article`, `youtube` |

## Helper Functions (SECURITY DEFINER)

These run with the function owner's permissions, used in RLS policies:

| Function | Returns | Purpose |
|----------|---------|---------|
| `is_instance_member(instance_id)` | boolean | Check if current user is a member of the instance |
| `is_instance_admin(instance_id)` | boolean | Check if current user is admin or owner |
| `is_instance_owner(instance_id)` | boolean | Check if current user is the owner |

## RLS Policy Pattern

All tables have RLS enabled. The pattern for data tables:

| Operation | Policy |
|-----------|--------|
| SELECT | `is_instance_member(instance_id)` |
| INSERT | `is_instance_member(instance_id) AND (select auth.uid()) = user_id` |
| UPDATE | `is_instance_member(instance_id) AND (select auth.uid()) = user_id` |
| DELETE | `is_instance_member(instance_id) AND (select auth.uid()) = user_id` |

**Important:** Always use `(select auth.uid())` not bare `auth.uid()` to avoid per-row re-evaluation (initplan performance issue).

### Special Policies

- `instances` INSERT: `(select auth.uid()) = owner_id`
- `instances` UPDATE: `is_instance_admin(id)`
- `instances` DELETE: `is_instance_owner(id)`
- `instance_memberships` INSERT: `is_instance_admin(instance_id)`
- `instance_memberships` DELETE: `is_instance_admin(instance_id) OR user_id = (select auth.uid())`
- `profiles` SELECT: public (viewable by everyone)
- `profiles` INSERT/UPDATE: `(select auth.uid()) = id`

## Triggers

| Trigger | Table | Function | Purpose |
|---------|-------|----------|---------|
| `set_updated_at` | All tables | `set_updated_at()` | Auto-update `updated_at` on row modification |
| `on_auth_user_created` | `auth.users` | `handle_new_user()` | Creates profile + default instance + owner membership |

## Migrations

15 migrations applied (in order):

1. `create_profiles` - profiles table + trigger
2. `create_updated_at_trigger` - shared set_updated_at() function
3. `create_todos` - todos table + RLS
4. `create_notes` - notes table + RLS
5. `create_feeds` - feeds + feed_entries tables + RLS
6. `create_articles` - articles table + RLS
7. `create_newspaper` - newspapers + newspaper_blocks + newspaper_editions + RLS
8. `fix_set_updated_at_search_path` - security fix for search_path
9. `create_instances_and_memberships` - instances + memberships + helper functions + RLS
10. `add_instance_id_to_data_tables` - add nullable instance_id to all 8 data tables
11. `migrate_existing_data_to_instances` - create default instances, backfill, set NOT NULL
12. `update_rls_policies_for_instances` - replace user-scoped policies with instance-scoped
13. `update_handle_new_user_for_instances` - trigger creates default instance on signup
14. `fix_rls_auth_uid_initplan` - wrap auth.uid() in (select ...) for performance
15. `cleanup_duplicate_rls_policies` - remove duplicate policies from migration naming mismatch

## Indexes

Key indexes beyond primary keys:

- `instances(slug)` - unique
- `instance_memberships(instance_id, user_id)` - unique
- `idx_memberships_user_id`, `idx_memberships_instance_id`
- `idx_instances_owner_id`
- `idx_{table}_instance_id` - on all 8 data tables
- `feed_entries(feed_id, guid)` - unique (for upsert dedup)
- Various `user_id`, `feed_id`, `newspaper_id` indexes on child tables

## Settings JSONB Schema

The `instances.settings` column stores:

```json
{
  "features": {
    "todos": true,
    "notes": true,
    "feeds": true,
    "articles": true,
    "newspaper": true
  }
}
```

All features default to `true` when a new instance is created.
