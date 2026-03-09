# 043 — Guest Role (Read-Only Instance Access)

## Goal
Add a `guest` value to the `instance_role` enum that gives read-only access to an instance — guests can view all content but cannot create, edit, or delete anything.

## Schema Changes

### `instance_role` enum

```sql
ALTER TYPE instance_role ADD VALUE 'guest';
```

### RLS Policy Updates

Guest users are instance members for SELECT purposes. Update all data table RLS policies so that `is_instance_member()` includes guests for SELECT, but INSERT/UPDATE/DELETE policies remain restricted to non-guest members.

Update the `is_instance_member()` helper function (or its callers) — since it is SECURITY DEFINER, modifying it updates all tables automatically:

```sql
-- is_instance_member already checks instance_memberships; guests are already included
-- since they have a row in that table. No change needed to the function itself.
-- The key change is in INSERT/UPDATE/DELETE RLS policies:
-- Change from: is_instance_member(instance_id) AND user_id = (select auth.uid())
-- To:          is_instance_member(instance_id)
--              AND user_id = (select auth.uid())
--              AND NOT is_instance_guest(instance_id)
```

Add a new helper function:

```sql
CREATE OR REPLACE FUNCTION is_instance_guest(p_instance_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.instance_memberships
    WHERE instance_id = p_instance_id
      AND user_id = (SELECT auth.uid())
      AND role = 'guest'
  )
$$;
```

Apply this to RLS policies on: `todos`, `todo_projects`, `notes`, `feeds`, `feed_entries`, `articles`, `newspapers`, `newspaper_blocks`, `newspaper_editions`, `bookmarks`, `quotes` (any table with write policies).

## Implementation Notes

### Server Action Guards

In all server actions that mutate data, add a guest check at the top:

```ts
const instanceId = await getInstanceIdFromSlug(slug)
const role = await getMemberRole(slug) // new helper
if (role === 'guest') {
  return { error: 'Guests cannot modify content' }
}
```

Add `getMemberRole(slug): Promise<'owner' | 'admin' | 'member' | 'guest'>` to `src/lib/instance/server.ts`.

### UI: Hiding Write Actions

In client components, conditionally hide create/edit/delete buttons for guest users:
- Pass `isGuest: boolean` as a prop from server components (where the role is known)
- Alternatively, use a `useInstanceRole()` hook if role is available in the instance context
- Buttons hidden (not just disabled) for guests to avoid confusion

### Invite Flow

In the member invite UI (instance settings → Members):
- Add "Guest" option to the role selector dropdown (alongside Member, Admin)
- Label: "Guest — read-only access"
- Existing invite server action updated to accept `'guest'` as a valid role

### Instance Switcher / List

Guest instances visually marked in the instance picker with a small "Guest" badge so users can distinguish workspaces they own from ones they are visiting.

## Files to Update
- `supabase/migrations/` — enum change + helper function + RLS policy updates
- `src/lib/instance/server.ts` — add `getMemberRole`
- All mutating server actions — add guest role check
- Member invite UI — add Guest role option
- Server components for each module — pass `isGuest` prop
- Instance picker component — add Guest badge

## New Files
```
supabase/migrations/YYYYMMDD_guest_role.sql
```

## Acceptance Criteria
- [ ] `guest` added to `instance_role` enum via migration
- [ ] `is_instance_guest()` helper function created
- [ ] INSERT/UPDATE/DELETE RLS policies updated to exclude guests on all data tables
- [ ] `getMemberRole` returns `'guest'` correctly for guest members
- [ ] All mutating server actions return an error for guest users
- [ ] Create/edit/delete buttons hidden in the UI for guests
- [ ] Invite flow allows selecting Guest role
- [ ] Guest instances marked in the instance picker
- [ ] Guests can successfully view all content (todos, notes, feeds, articles, newspapers)
