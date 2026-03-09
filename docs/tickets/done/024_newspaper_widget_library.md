# 024 — Newspaper Widget Library

## Goal
Build a centralised widget registry and size-aware rendering system that all newspaper block types use, unifying how widgets are displayed in the editor (thumbnails), live preview, and edition snapshots.

## Dependencies
- **Requires ticket 019** (grid positioning — col_span/row_span available)
- **Requires ticket 023** (editor integration points)
- Integrates with ticket 021 (weather widget) and ticket 022 (calendar widget)

## Background
Currently each block type has ad-hoc rendering in `NewspaperPreview`. As the number of widget types grows and sizes vary, we need a registry that maps `(block_type, col_span, row_span)` → React component, with consistent thumbnail previews for the editor and full renderers for the edition preview.

## Widget Registry

### `src/modules/newspaper/lib/widgets/registry.ts`

```ts
export interface WidgetDefinition {
  type: BlockType                          // existing enum value
  label: string                            // display name
  description: string                      // short description for picker
  icon: LucideIcon                         // icon for editor card + picker
  supportedSizes: GridSize[]               // which col×row combos are supported
  defaultSize: GridSize                    // default when adding
  configComponent: React.ComponentType<WidgetConfigProps>  // config form
  previewComponent: React.ComponentType<WidgetPreviewProps> // edition preview
  thumbnailComponent: React.ComponentType<WidgetThumbnailProps> // editor thumbnail
  fetchData: (block: Block, instanceId: string) => Promise<unknown> // server-side
}

export type GridSize = { colSpan: 1 | 2; rowSpan: 1 | 2 | 3 | 4 }
```

### Widget Registry Map

```ts
export const WIDGET_REGISTRY: Record<BlockType, WidgetDefinition> = {
  todos:    TodosWidgetDef,
  notes:    NotesWidgetDef,
  rss:      RssWidgetDef,
  articles: ArticlesWidgetDef,
  text:     TextWidgetDef,
  weather:  WeatherWidgetDef,
  calendar: CalendarWidgetDef,
}
```

## Widget Components Structure

Each widget lives in `src/modules/newspaper/lib/widgets/{type}/`:
- `index.ts` — exports the `WidgetDefinition`
- `config.tsx` — config form fields (currently in `BlockConfigFields`)
- `preview.tsx` — full renderer for edition preview (size-aware)
- `thumbnail.tsx` — simplified editor card preview

### Size-Aware Rendering Pattern

```tsx
// preview.tsx
export function WeatherPreview({ data, colSpan, rowSpan }: WidgetPreviewProps) {
  if (colSpan === 2 && rowSpan === 2) return <WeatherFull data={data} />
  if (colSpan === 2 && rowSpan === 1) return <WeatherWide data={data} />
  if (colSpan === 1 && rowSpan === 2) return <WeatherTall data={data} />
  return <WeatherCompact data={data} />
}
```

## Widget Picker (Add Block Dialog)

The `AddBlockDialog` (from ticket 023) uses the registry to show available widgets:
- Grid of widget cards (icon, label, description)
- Each card shows supported sizes
- Clicking a widget shows its config form + size selector
- Unavailable sizes are greyed out

## Edition Generation Refactor

`generateEdition` in `actions.ts` currently has a switch/case per block type. Refactor to use the registry:

```ts
for (const block of blocks) {
  const widget = WIDGET_REGISTRY[block.block_type]
  const data = await widget.fetchData(block, instanceId)
  blockSnapshots.push({ ...block, data })
}
```

## Preview Page Refactor

`NewspaperPreview` component refactored to render via registry:

```tsx
function BlockRenderer({ block, data }) {
  const widget = WIDGET_REGISTRY[block.block_type]
  return (
    <widget.previewComponent
      data={data}
      colSpan={block.col_span}
      rowSpan={block.row_span}
      config={block.config}
    />
  )
}
```

## Existing Widgets to Migrate

Wrap all existing block type renderers into the new structure:

| Block Type | Current Location | Migration |
|------------|-----------------|-----------|
| `todos` | `NewspaperPreview` switch | Extract to `widgets/todos/preview.tsx` |
| `notes` | `NewspaperPreview` switch | Extract to `widgets/notes/preview.tsx` |
| `rss` | `NewspaperPreview` switch | Extract to `widgets/rss/preview.tsx` |
| `articles` | `NewspaperPreview` switch | Extract to `widgets/articles/preview.tsx` |
| `text` | `NewspaperPreview` switch | Extract to `widgets/text/preview.tsx` |
| `weather` | `NewspaperPreview` switch | Extract + enrich (ticket 021) |
| `calendar` | `NewspaperPreview` switch | Extract + enrich (ticket 022) |

Config forms: extract from `BlockConfigFields` into per-widget `config.tsx` files.

## Thumbnail Components

Thumbnails are simplified previews shown inside block cards in the grid editor. They should:
- Be visually representative (mini version of the full widget)
- Not fetch live data (render from a static placeholder or last-known config)
- Work at ~150×100px minimum

## New Files
```
src/modules/newspaper/lib/widgets/
  registry.ts
  types.ts
  todos/index.ts, config.tsx, preview.tsx, thumbnail.tsx
  notes/index.ts, config.tsx, preview.tsx, thumbnail.tsx
  rss/index.ts, config.tsx, preview.tsx, thumbnail.tsx
  articles/index.ts, config.tsx, preview.tsx, thumbnail.tsx
  text/index.ts, config.tsx, preview.tsx, thumbnail.tsx
  weather/index.ts, config.tsx, preview.tsx, thumbnail.tsx
  calendar/index.ts, config.tsx, preview.tsx, thumbnail.tsx
```

## Files to Update / Retire
- `src/modules/newspaper/components/BlockConfigFields.tsx` → retire (split into per-widget config.tsx)
- `src/modules/newspaper/components/NewspaperPreview.tsx` → refactor to use registry
- `src/app/(app)/i/[slug]/newspaper/[id]/actions.ts` → refactor `generateEdition`

## Plan

1. **`src/modules/newspaper/lib/widgets/types.ts`** — shared TS interfaces: `WidgetDefinition`, `WidgetPreviewProps`, `WidgetConfigProps`, `WidgetThumbnailProps`, `GridSize`, `EditionBlock`
2. **Per-widget directories** (todos, notes, rss, articles, text, weather, calendar) each with:
   - `config.tsx` — config form extracted from `BlockConfigFields`
   - `preview.tsx` — renderer extracted from `NewspaperPreview`
   - `thumbnail.tsx` — small editor card preview (icon + title)
   - `index.ts` — `WidgetDefinition` export (label, icon, sizes, components)
3. **`src/modules/newspaper/lib/widgets/registry.ts`** — `WIDGET_REGISTRY` client-safe map (UI only)
4. **`src/modules/newspaper/lib/widgets/fetchers.ts`** — server-only `fetchBlockData(block, instanceId, supabase)` map (split from `generateEdition`)
5. **`src/modules/newspaper/components/newspaper-header.tsx`** — masthead header row: newspaper title, day of week, full date, inline weather summary from edition's first weather block
6. **Refactor `NewspaperPreview`** — use `WIDGET_REGISTRY[block.type].previewComponent` instead of `BLOCK_RENDERERS`; add `NewspaperHeader` at top
7. **Refactor `generateEdition`** — call `fetchBlockData` from fetchers.ts (no more switch/case inline)
8. **Retire `BlockConfigFields`** — update `newspaper-grid-editor.tsx`, `block-editor.tsx`, `add-block-form.tsx` to use per-widget `configComponent` from registry

Note: `fetchData` is NOT in the client registry to avoid server imports in client components.

## Acceptance Criteria
- [x] All 7 existing block types registered in the widget registry
- [x] `generateEdition` uses `fetchBlockData` from fetchers.ts (no more switch/case)
- [x] `NewspaperPreview` uses registry `previewComponent`
- [x] Widget picker shows all widgets from WIDGET_LIST
- [x] Thumbnail previews render in editor block cards
- [x] No regression in existing newspaper functionality
- [x] TypeScript types are strict (no `any` in registry interfaces)
- [x] `NewspaperHeader` component with day, date, weather summary

## Summary

Implemented the widget registry pattern for ticket 024, plus the `NewspaperHeader` component.

**New files:**
- `src/modules/newspaper/lib/widgets/types.ts` — shared TS interfaces
- `src/modules/newspaper/lib/widgets/registry.ts` — WIDGET_REGISTRY + WIDGET_LIST
- `src/modules/newspaper/lib/widgets/fetchers.ts` — server-only fetchBlockData + fetchWeatherData
- `src/modules/newspaper/lib/widgets/{todos,notes,rss,articles,text,weather,calendar}/` — each with `index.ts`, `config.tsx`, `preview.tsx`, `thumbnail.tsx`
- `src/modules/newspaper/components/newspaper-header.tsx` — masthead row: day of week, date, inline weather summary from edition

**Refactored:**
- `NewspaperPreview` — uses registry previewComponent + NewspaperHeader
- `generateEdition` in actions.ts — calls fetchBlockData (removed ~100 lines of switch/case)
- `newspaper-grid-editor.tsx`, `block-editor.tsx`, `add-block-form.tsx` — use registry configComponent + WIDGET_LIST; block cards now show widget thumbnails

**Completed:** 2026-03-09
