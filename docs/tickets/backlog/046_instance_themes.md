# 046 — Instance Themes

## Goal
Allow each instance to have a distinct accent color so workspaces are visually distinguishable at a glance. The accent is stored per-instance and injected as a CSS variable scoped to the instance shell.

## Schema Changes

### `instances` table

```sql
ALTER TABLE instances
  ADD COLUMN theme_config JSONB NOT NULL DEFAULT '{}'::jsonb;
```

Theme config shape:
```ts
interface InstanceThemeConfig {
  accent?: string   // OKLCH CSS color string, e.g. "oklch(0.7 0.15 200)"
                    // undefined = inherit from global Tailwind theme
}
```

## Implementation Notes

### CSS Variable Injection

In the instance layout (`src/app/(app)/i/[slug]/layout.tsx`), fetch `instances.theme_config` server-side and inject an inline style on the outermost wrapper element:

```tsx
<div
  style={accent ? { '--accent': accent } as React.CSSProperties : undefined}
  className="..."
>
  {children}
</div>
```

This overrides the `--accent` CSS variable for everything within the instance shell. The Tailwind `accent-*` utilities and any component using `var(--accent)` will automatically use the instance color.

Ensure `--accent-foreground` is also adjusted if needed (use a dark foreground for light accents and vice versa). A simple heuristic: OKLCH lightness > 0.6 → dark foreground, else light foreground.

### Accent Palette

Provide 12 curated OKLCH accent colors in `src/lib/themes.ts`:

```ts
export const ACCENT_PALETTE = [
  { label: 'Default',  value: undefined },
  { label: 'Blue',     value: 'oklch(0.60 0.20 250)' },
  { label: 'Violet',   value: 'oklch(0.60 0.22 290)' },
  { label: 'Pink',     value: 'oklch(0.65 0.22 350)' },
  { label: 'Red',      value: 'oklch(0.55 0.22 25)' },
  { label: 'Orange',   value: 'oklch(0.65 0.18 55)' },
  { label: 'Yellow',   value: 'oklch(0.80 0.18 90)' },
  { label: 'Lime',     value: 'oklch(0.70 0.18 130)' },
  { label: 'Green',    value: 'oklch(0.60 0.18 155)' },
  { label: 'Teal',     value: 'oklch(0.60 0.15 195)' },
  { label: 'Cyan',     value: 'oklch(0.65 0.15 215)' },
  { label: 'Slate',    value: 'oklch(0.55 0.05 255)' },
]
```

No free-form color input — curated palette only to ensure colors look good in both light and dark mode (OKLCH gamut-safe colors).

### Settings UI

In the instance settings page, add a "Appearance" section:
- Label: "Instance accent color"
- Render the palette as a grid of color swatches (circle buttons, ~2rem each)
- Selected swatch has a ring/border indicator
- "Default" option resets to the global theme accent
- Live preview: the current page's accent updates immediately on selection (optimistic, before save)
- Save via a server action `updateInstanceTheme(slug, themeConfig)`

### Sidebar Header

The sidebar header (instance name + icon area) uses `bg-accent` or a border in the accent color to make the workspace identity immediately obvious when switching between instances.

### Instance Picker

In the instance picker (list of workspaces), show a small accent color dot next to each instance name that has a custom accent. This helps users visually identify workspaces before entering them.

## New Files
```
src/lib/themes.ts
supabase/migrations/YYYYMMDD_instance_theme_config.sql
```

## Files to Update
- `src/app/(app)/i/[slug]/layout.tsx` — inject `--accent` CSS variable
- Instance settings page — add Appearance section with palette picker
- `src/app/(app)/i/[slug]/settings/actions.ts` — add `updateInstanceTheme`
- Sidebar header component — use accent color
- Instance picker component — add accent color dot

## Acceptance Criteria
- [ ] `theme_config` JSONB column added to `instances` via migration
- [ ] `--accent` CSS variable injected in the instance layout when accent is configured
- [ ] Sidebar header and active nav states use the instance accent color
- [ ] Settings UI shows a 12-color palette with a "Default" option
- [ ] Selecting a color updates the page accent immediately (optimistic)
- [ ] Saving persists the accent to `instances.theme_config`
- [ ] "Default" option removes the override (falls back to global theme)
- [ ] Instance picker shows accent color dot for customised instances
- [ ] Accent works correctly in both light and dark mode
- [ ] No custom colors outside the curated OKLCH palette accepted
