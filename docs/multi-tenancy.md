# Multi-Tenancy

The app uses **instances** (workspaces) to scope all data. Each user can belong to multiple instances with different roles.

## Concepts

### Instances
A workspace that groups users and data. Has a unique `slug` used in URLs (`/i/my-workspace/todos`).

- Created automatically for new users (via `handle_new_user()` trigger)
- Can be created manually at `/i/new`
- Has a JSONB `settings` column for feature flags

### Roles

| Role | Permissions |
|------|-------------|
| `owner` | Full access. Can delete instance, manage settings, manage members. One per instance. |
| `admin` | Can manage settings, add/remove members, update roles. |
| `member` | Can view all instance data. Can create/edit/delete own items. |

### Feature Flags

Each instance can enable/disable features via `settings.features`:

```typescript
type InstanceFeatures = {
  todos: boolean;
  notes: boolean;
  feeds: boolean;
  articles: boolean;
};
```

The sidebar filters navigation items based on enabled features. All features default to `true`.

## Instance Resolution

### Server Pages (full resolution)

**`resolveInstance(slug)`** in `src/lib/instance/server.ts`:
1. Gets current user
2. Fetches instance by slug
3. Fetches user's membership for that instance
4. Returns 404 if instance doesn't exist or user isn't a member
5. Returns `{ instance, role }`

Used in `src/app/(app)/i/[slug]/layout.tsx` to set up the instance context.

### Server Actions (lightweight)

**`getInstanceIdFromSlug(slug)`** in `src/lib/instance/server.ts`:
- Fetches just the instance ID from slug
- Throws if not found
- RLS handles authorization (the query will fail if user isn't a member)

Used in all action files as the first step.

## Client-Side Context

**`src/lib/instance/context.tsx`** provides:

| Export | Purpose |
|--------|---------|
| `InstanceProvider` | Wraps instance-scoped routes, provides instance + role |
| `useInstance()` | Returns `{ instance, role, slug }` |
| `useInstanceSlug()` | Shorthand for just the slug |

The `InstanceProvider` is mounted in the `[slug]/layout.tsx`.

## Instance Picker (`/i`)

`src/app/(app)/i/page.tsx`:
- Fetches all instances the user is a member of
- If exactly 1 instance: auto-redirects to `/i/[slug]`
- If multiple: shows a list of instance cards to choose from
- Link to create new instance at `/i/new`

## Instance Switcher

The sidebar header contains a dropdown (`DropdownMenu`) showing all user's instances:
- Current instance marked with "current" label
- Click to switch (navigates to `/i/[other-slug]`)
- "New Workspace" option at the bottom

## Data Scoping

All 8 data tables have a non-nullable `instance_id` column. Every INSERT includes `instance_id`. RLS policies use `is_instance_member(instance_id)` for SELECT, ensuring users only see data from instances they belong to.

## Settings Management

At `/i/[slug]/settings`:
- **Instance settings** (owner/admin): rename, change slug, toggle features
- **Members** at `/i/[slug]/settings/members`: list members, remove members

Settings link in sidebar only visible to `owner` and `admin` roles.
