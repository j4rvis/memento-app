# 027 — Newspaper Templates

## Goal
Provide pre-designed newspaper layouts (Morning Brief, Weekend Edition, Weekly Review) that auto-configure blocks, grid positions, and paper format with one click, making it fast to get a newspaper up and running.

## Dependencies
- **Requires ticket 019** (grid data model — col_span/row_span)
- **Requires ticket 024** (widget registry for block types)

## Background
New users face a blank canvas when creating a newspaper. Templates lower the activation energy by giving them a working layout immediately. Templates are defined as static data in code (no DB table), so they can evolve with the widget library without migrations.

## Implementation Notes

### Template Registry

Define templates in `src/modules/newspaper/lib/templates/registry.ts`:

```ts
export interface BlockStub {
  block_type: BlockType
  col_start: number
  row_start: number
  col_span: 1 | 2
  row_span: 1 | 2 | 3 | 4
  config: Record<string, unknown>
}

export interface NewspaperTemplate {
  id: string
  name: string
  description: string
  paper_format: 'A4' | 'A5'
  blocks: BlockStub[]
}

export const TEMPLATES: NewspaperTemplate[] = [
  {
    id: 'morning-brief',
    name: 'Morning Brief',
    description: 'Compact daily digest: todos, weather, and top feed items.',
    paper_format: 'A4',
    blocks: [ /* ... */ ],
  },
  {
    id: 'weekend-edition',
    name: 'Weekend Edition',
    description: 'Relaxed weekend read: articles, notes, and a quote.',
    paper_format: 'A4',
    blocks: [ /* ... */ ],
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Retrospective layout: completed todos, notes, and feed digest.',
    paper_format: 'A4',
    blocks: [ /* ... */ ],
  },
]
```

### Server Action: `applyTemplate`

In `src/app/(app)/i/[slug]/newspaper/[id]/actions.ts`:

```ts
export async function applyTemplate(
  slug: string,
  newspaperId: string,
  templateId: string,
): Promise<void>
```

Steps:
1. Look up template from `TEMPLATES` by `templateId`
2. Delete all existing `newspaper_blocks` for this newspaper
3. Insert new blocks from `template.blocks` (with `newspaper_id`, `instance_id`, `user_id`)
4. Optionally update `newspapers.paper_format` to match the template
5. `revalidatePath` for the editor

### UI: Template Picker

- Add a "Templates" button in the newspaper editor toolbar (or on the empty state when no blocks exist)
- Opens a modal/dialog with a card grid of templates (name, description, thumbnail preview image or icon)
- When a newspaper already has blocks, show a confirmation dialog: "Applying a template will replace all existing blocks. Continue?"
- After applying, the editor refreshes showing the new layout

### Template Thumbnails

Use static SVG placeholder thumbnails in `public/templates/` — simple grid diagrams showing block arrangement. No live rendering needed for the picker.

## New Files
```
src/modules/newspaper/lib/templates/registry.ts
src/modules/newspaper/lib/templates/index.ts
src/modules/newspaper/components/TemplatePicker.tsx
public/templates/morning-brief.svg
public/templates/weekend-edition.svg
public/templates/weekly-review.svg
```

## Files to Update
- `src/app/(app)/i/[slug]/newspaper/[id]/actions.ts` — add `applyTemplate`
- Newspaper editor page/component — add Templates button and trigger

## Acceptance Criteria
- [ ] Three templates defined in the static registry with sensible block configurations
- [ ] Template picker modal accessible from the newspaper editor
- [ ] Applying a template with existing blocks prompts for confirmation
- [ ] All existing blocks are replaced with template blocks on confirmation
- [ ] `paper_format` on the newspaper is updated to match the template
- [ ] Editor refreshes and shows the new layout after applying
- [ ] No DB migrations required — templates are code-only
