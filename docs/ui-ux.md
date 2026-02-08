# UI/UX

## Component Library

Uses **shadcn/ui** (New York style) with 16 installed components:

`avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `tabs`, `textarea`, `tooltip`

Config in `components.json`. Add new components: `pnpm dlx shadcn@latest add [component]`

## Theming

### Tailwind CSS v4
- Uses `@import` syntax (not `tailwind.config.ts`)
- OKLCH color space for perceptually uniform colors
- CSS custom properties for all theme tokens
- Custom variant: `@custom-variant dark (&:is(.dark *))`

### Dark Mode
- Managed by `next-themes` (`ThemeProvider` in root layout)
- Toggle component: `src/components/layout/theme-toggle.tsx`
- Available in header via user menu area

### Color Tokens
All colors defined in `src/app/globals.css` as CSS variables:
- Light mode: `:root { ... }`
- Dark mode: `.dark { ... }`
- Includes: background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, chart-1..5, sidebar-*

## App Shell

### Layout Hierarchy
```
Root Layout (fonts, ThemeProvider, Toaster)
└── (app) Layout (auth check)
    └── [slug] Layout (instance resolution)
        ├── AppSidebar (navigation)
        ├── SidebarInset
        │   ├── AppHeader (trigger, theme, user menu)
        │   └── <main> (page content)
```

### Sidebar (`src/components/layout/app-sidebar.tsx`)

**Header:** Instance switcher dropdown (all user's instances + "New Workspace")

**Modules section:** Feature navigation, filtered by `features[key]`:
- Todos (CheckSquare icon)
- Notes (StickyNote icon)
- Feeds (Rss icon)
- Articles (BookOpen icon)
- Newspaper (Newspaper icon)

**Settings section:**
- Account (always visible, links to `/account`)
- Workspace Settings (owner/admin only, links to `/i/[slug]/settings`)

Active state: `pathname.startsWith(/i/${slug}/${item.path})`

Props: `slug`, `instanceName`, `features`, `instances`, `role`

### Header (`src/components/layout/app-header.tsx`)

Left: `SidebarTrigger` (hamburger menu for mobile)
Right: `ThemeToggle` + User dropdown (avatar, name, email, Account link, Sign Out)

Props: `email`, `fullName`, `avatarUrl`

## PWA

### Manifest (`src/app/manifest.ts`)
- Name: "Memento"
- Display: standalone
- Icons: 192x192 and 512x512 PNG
- Share target: POST to `/api/articles/share` (accepts title, text, url)

### Service Worker (`public/sw.js`)
Minimal pass-through. No caching strategy - all requests go to network. Exists solely for PWA installability.

## Shared Components

| Component | Path | Purpose |
|-----------|------|---------|
| `EmptyState` | `src/components/shared/empty-state.tsx` | Placeholder for empty lists |
| `Loading` | `src/components/shared/loading.tsx` | Loading spinner |

## Hooks

| Hook | Path | Purpose |
|------|------|---------|
| `useMobile` | `src/hooks/use-mobile.ts` | Detects mobile viewport |

## Icons

Uses **Lucide React** (`lucide-react`) for all icons throughout the app.

## Toast Notifications

Uses **Sonner** (`sonner`) via `src/components/ui/sonner.tsx`. The deprecated shadcn `toast` component should NOT be used.
