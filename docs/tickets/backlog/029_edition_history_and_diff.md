# 029 — Edition History & Diff

## Goal
Allow users to browse all past newspaper editions and compare any two editions side by side, highlighting changes in todos, articles, feed entries, and notes between the two snapshots.

## Background
Currently only the latest edition is accessible from the newspaper editor. Users have no way to review what was generated on a given day or track how their content has changed over time. The `newspaper_editions` table already stores a full `content` JSONB snapshot for each edition, making client-side diffing possible without additional DB queries.

## Implementation Notes

### Edition History Sidebar

In the newspaper editor/preview page, add an "Editions" panel (collapsible sidebar or slide-over):
- List all editions for the newspaper, sorted newest first
- Each row: formatted date (e.g. "Mon 3 Mar 2026"), edition number, and a "View" button
- "View" loads the edition preview in the main area (read-only)
- Pagination or infinite scroll if there are many editions
- Data fetched server-side; edition list passed as prop to client component

### Compare Mode

A "Compare" button in the edition list row opens a split-view:
- Left panel: older edition preview (read-only)
- Right panel: newer edition preview (read-only)
- Between the panels: a diff summary card showing:
  - **Todos**: items that were completed between the two editions (snapshot their `completed` state in the edition content)
  - **Articles**: new articles that appeared in the newer edition but not the older
  - **Feed entries**: new feed entries between editions
  - **Notes**: notes that were added or whose `updated_at` changed between editions

### Diff Computation

All diff logic runs client-side in a `useEditionDiff(editionA, editionB)` hook. It operates on the `content` JSONB field of each `newspaper_edition` row, which stores snapshots of each block's data at generation time.

```ts
interface EditionDiff {
  completedTodos: TodoSnapshot[]
  newArticles: ArticleSnapshot[]
  newFeedEntries: FeedEntrySnapshot[]
  changedNotes: NoteSnapshot[]
}
```

The hook compares IDs and `updated_at`/`completed` fields between the two content snapshots. No new DB columns required — works entirely from the existing snapshot data.

### URL State

Use search params to encode the selected edition and compare mode:
- `?edition=<id>` — view a specific edition
- `?compare=<id1>,<id2>` — compare two editions

## Files to Update
- Newspaper editor/preview page — add edition list panel
- `src/app/(app)/i/[slug]/newspaper/[id]/actions.ts` — add `listEditions(slug, newspaperId)` action
- `src/modules/newspaper/components/` — add `EditionList.tsx`, `EditionDiff.tsx`, `CompareView.tsx`

## Acceptance Criteria
- [ ] Edition history list visible from the newspaper editor page
- [ ] Each edition shows date and edition number
- [ ] "View" button loads the edition in read-only preview mode
- [ ] "Compare" mode opens a split view of two editions
- [ ] Diff summary card shows completed todos, new articles, new feed entries, and changed notes
- [ ] Diff is computed client-side from existing snapshot data (no new DB columns)
- [ ] Selected edition and compare state reflected in URL search params
- [ ] No regression in existing newspaper preview functionality
