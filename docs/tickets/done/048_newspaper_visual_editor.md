# 048 — Newspaper Visual Editor

## Goal

A browser-based editor at `/i/[slug]/newspaper/` where users build and save `NewspaperConfig` JSON. Produces configurations consumed by the PDF engine (ticket 047).

## Background

See `docs/story-newspaper.md`. Depends on ticket 047 for types and the render function (for live PDF preview).

## Database

### `newspaper_templates`

```sql
create table newspaper_templates (
  id          uuid primary key default gen_random_uuid(),
  instance_id uuid not null references instances(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  config      jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

RLS:
- SELECT: `is_instance_member(instance_id)`
- INSERT/UPDATE/DELETE: `is_instance_member(instance_id)` + `user_id = (select auth.uid())`

Trigger: `set_updated_at()` on update.

## Routes

```
/i/[slug]/newspaper/                  # template list page
/i/[slug]/newspaper/new               # create new template → redirect to editor
/i/[slug]/newspaper/[id]              # editor for a specific template
/i/[slug]/newspaper/[id]/preview      # PDF preview (iframe embed)
```

## Editor Layout

```
┌────────────────────────────────────────────────────────┐
│  Header: template name (editable) · Save · Preview PDF │
├───────────┬────────────────────────────────────────────┤
│  Block    │  Canvas                                    │
│  Palette  │                                            │
│           │  ┌─ Page 1 ──────────────────────────────┐│
│  title    │  │  Layout: [single▾]                    ││
│  markdown │  │  ┌─ Col 1 ──────┐ ┌─ Col 2 ─────────┐││
│  weather  │  │  │ [TitleBlock] │ │ [CalendarDay]   │││
│  lines    │  │  │ [Weather]    │ │ [WritingLines]  │││
│  cal-week │  │  │ + Add block  │ │ + Add block     │││
│  cal-day  │  │  └─────────────┘ └─────────────────┘││
│  divider  │  └───────────────────────────────────────┘│
│  spacer   │  + Add page                               │
│           │                                            │
│  ─────    │  ┌─ Calendar Entries ────────────────────┐│
│  Entries  │  │  + Add entry  (sheet/drawer)          ││
│           │  └───────────────────────────────────────┘│
└───────────┴────────────────────────────────────────────┘
```

## Components

### Page-level

- `NewspaperEditorPage` (server) — loads template, renders `NewspaperEditorClient`
- `NewspaperEditorClient` (client) — holds full `NewspaperConfig` in state; top-level save/preview actions
- `PageCard` — renders one page with layout selector and column(s)
- `ColumnDropzone` — accepts block drops; renders block list

### Block components

- `BlockPalette` — sidebar with draggable block type buttons (`@dnd-kit/core` already in deps)
- `BlockCard` — rendered block in the canvas; click to open config panel; drag handle to reorder; delete button
- `BlockConfigPanel` — inline form below the block card (not a modal) with fields per block type

### Block config forms

Each block type has a config form component:

| Block | Key fields |
|-------|-----------|
| `title` | text, subtitle, date_format, style, border |
| `markdown` | content (CodeMirror editor, already in deps) |
| `weather` | location, unit, display mode |
| `writing-lines` | label, lines, line_spacing_mm, show_margin |
| `calendar-week` | start_date, week_start, hours range, slot_height_mm |
| `calendar-day` | date, hours range, slot_height_mm, show_lines |
| `divider` | style |
| `spacer` | height_mm |

### Calendar entry manager

A `Sheet` (shadcn) triggered by "Manage Entries" button. Lists all `CalendarEntry` items in `config.calendar_entries`. Add/edit/delete inline. Fields: title, description, start_at, end_at, all_day toggle, color picker (simple swatches), calendar label.

### PDF preview

"Preview PDF" button → POST to `/api/newspaper/[id]/preview` (or a server action) → returns PDF blob URL → opens in a new tab or renders in a `<dialog>` with an `<iframe>`.

## Server Actions (`src/app/(app)/i/[slug]/newspaper/actions.ts`)

| Action | Description |
|--------|-------------|
| `createTemplate(slug, name)` | Insert new template with empty config |
| `updateTemplate(slug, id, config)` | Save full config jsonb |
| `renameTemplate(slug, id, name)` | Update name only |
| `deleteTemplate(slug, id)` | Delete template |
| `listTemplates(slug)` | Fetch all templates for instance |

## Template List Page

Simple card grid. Each card: template name, last updated, "Edit" and "Delete" buttons. "New Template" button top-right.

## Sidebar / Navigation

Add "Newspaper" to `AppSidebar` and `BottomNav` (behind a feature flag `newspaper` in instance settings, same pattern as other features).

## Plan

1. **DB migration** — apply `newspaper_templates` table with RLS via Supabase MCP
2. **Types** — add `newspaper?: boolean` to `InstanceFeatures`
3. **Settings** — add "Newspaper" to `featureLabels` in settings page
4. **Navigation** — add `Newspaper` item (Newspaper icon) to `AppSidebar` and `BottomNav`
5. **Server actions** — `src/app/(app)/i/[slug]/newspaper/actions.ts` (createTemplate, updateTemplate, renameTemplate, deleteTemplate, listTemplates)
6. **PDF preview API** — `src/app/api/newspaper/[id]/preview/route.ts` calls render engine, returns PDF blob
7. **Template list page** — `src/app/(app)/i/[slug]/newspaper/page.tsx` — card grid with create/delete
8. **New template page** — `src/app/(app)/i/[slug]/newspaper/new/page.tsx` — creates template, redirects to editor
9. **Editor page** — `src/app/(app)/i/[slug]/newspaper/[id]/page.tsx` — loads template, renders `NewspaperEditorClient`
10. **Preview route** — `src/app/(app)/i/[slug]/newspaper/[id]/preview/page.tsx` — iframe showing PDF from API
11. **Editor components** in `src/modules/newspaper/components/`:
    - `NewspaperEditorClient` — full config state, save/preview, layout
    - `PageCard` — page with layout selector and columns
    - `ColumnDropzone` — block list with drop target (dnd-kit)
    - `BlockPalette` — draggable block type buttons
    - `BlockCard` — block in canvas, up/down reorder, delete, config toggle
    - `BlockConfigPanel` — inline form below block (per type)
    - Block config form components (title, markdown, weather, writing-lines, calendar-week, calendar-day, divider, spacer)
    - `CalendarEntryManager` — Sheet with add/edit/delete entries

**DnD approach**: `@dnd-kit/core` (only available package) for drag-from-palette-to-column; up/down buttons for reorder within column.

## Acceptance Criteria

- [x] Template list shows all saved templates
- [x] Create / rename / delete templates
- [x] Add and reorder pages; switch page layout
- [x] Drag blocks from palette into columns; reorder blocks within a column
- [x] Each block type has a working config form
- [x] Calendar entry manager: add/edit/delete entries
- [x] Save persists full config to DB
- [x] Preview PDF button opens rendered PDF
- [x] Newspaper nav item appears in sidebar and bottom nav

## Summary

Implemented the full newspaper visual editor (2026-03-20):

- **DB**: `newspaper_templates` table with RLS (member-scoped SELECT, owner-only INSERT/UPDATE/DELETE)
- **Types**: Added `newspaper?: boolean` to `InstanceFeatures`; settings page updated to show Newspaper toggle
- **Navigation**: `Newspaper` item added to `AppSidebar` and `BottomNav` (filtered by `features.newspaper`)
- **Server actions**: `listTemplates`, `createTemplate`, `updateTemplate`, `renameTemplate`, `deleteTemplate`
- **API route**: `GET /api/newspaper/[id]/preview` — renders PDF via engine, returns `application/pdf`
- **Routes**: template list (`/newspaper/`), new-template redirect (`/newspaper/new`), editor (`/newspaper/[id]`), PDF preview iframe (`/newspaper/[id]/preview`)
- **Components** (`src/modules/newspaper/components/`):
  - `NewspaperTemplateList` — card grid, inline create form
  - `NewspaperEditorClient` — DnD context, full `NewspaperConfig` state, save/rename/preview
  - `BlockPalette` — 8 draggable block-type buttons (`@dnd-kit/core`)
  - `ColumnDropzone` — droppable column; blocks dropped from palette are appended
  - `PageCard` — layout selector (single/two-column/three-column), delete page
  - `BlockCard` — drag handle, expand/collapse config, up/down reorder, delete
  - `BlockConfigPanel` — inline form per block type (title, markdown, weather, writing-lines, calendar-week, calendar-day, divider, spacer)
  - `CalendarEntryManager` — Sheet with add/edit/delete calendar entries, color swatches
