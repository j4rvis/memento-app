# Story: Newspaper PDF System

**Status:** Planning
**Created:** 2026-03-20

## Vision

A personal newspaper that generates a printable PDF from a structured JSON configuration. The system is layered so each concern is independent: a pure engine that renders PDFs, a visual editor that produces the configuration, a scheduler that automates generation, and an API that lets external devices (HomeAssistant, Kindle) consume the output.

---

## System Layers

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 4 — API & Delivery                                    │
│  GET /api/newspaper/:id/pdf  ·  Kindle email  ·  BT print   │
├──────────────────────────────────────────────────────────────┤
│  Layer 3 — Scheduler                                         │
│  Cron config per template  ·  Supabase Storage for PDFs     │
├──────────────────────────────────────────────────────────────┤
│  Layer 2 — Visual Editor                                     │
│  Block drag-and-drop  ·  Live JSON preview                  │
├──────────────────────────────────────────────────────────────┤
│  Layer 1 — PDF Engine                                        │
│  JSON config → Markdown → md-to-pdf → PDF buffer           │
└──────────────────────────────────────────────────────────────┘
```

---

## Layer 1 — PDF Engine

### Design principle

The engine is a pure function: `render(config: NewspaperConfig): Promise<Buffer>`. No database access, no side effects. It can be called from a server action, an API route, or a cron job.

### Rendering pipeline

```
NewspaperConfig
  └─ for each Page
       └─ for each Block → blockToMarkdown(block) → string
  └─ join pages with page-break markers
  └─ md-to-pdf(markdown, pdfOptions)
  └─ Buffer
```

`md-to-pdf` handles the Markdown → PDF step via Puppeteer/Chrome. Complex layout (two-column, calendar grids, weather) is rendered as HTML embedded inside the Markdown via `md-to-pdf`'s template/style support. For calendar and weather blocks, the block renderer emits raw HTML rather than Markdown prose — `md-to-pdf` passes raw HTML through unchanged.

### Why md-to-pdf over alternatives

| Option | Verdict |
|--------|---------|
| `md-to-pdf` | Good fit — Markdown-first, supports HTML passthrough, CSS control, runs in Node.js (Next.js server action / API route). Use `pdf-parse`/Puppeteer under the hood. |
| `puppeteer` direct | More control but requires building the HTML template from scratch. Heavier. |
| `jsPDF` / `pdfkit` | Programmatic layout is complex for rich text/Markdown. |
| WeasyPrint (Python) | Out-of-process, not worth it. |

Install: `pnpm add md-to-pdf`

### Module location

```
src/modules/newspaper/
├── engine/
│   ├── index.ts              # render(config) → Buffer
│   ├── config-to-md.ts       # walks config, calls block renderers
│   ├── blocks/
│   │   ├── markdown.ts       # MarkdownBlock → md string
│   │   ├── title.ts          # TitleBlock → HTML header
│   │   ├── writing-lines.ts  # WritingLinesBlock → HTML table of lines
│   │   ├── weather.ts        # WeatherBlock → HTML card
│   │   ├── calendar-week.ts  # CalendarWeekBlock → HTML grid
│   │   ├── calendar-day.ts   # CalendarDayBlock → HTML timeline
│   │   ├── divider.ts        # DividerBlock → <hr>
│   │   └── spacer.ts         # SpacerBlock → <div style="height:Xmm">
│   ├── fetchers/
│   │   └── weather.ts        # fetch & cache weather data
│   └── styles/
│       └── base.css          # print-optimised CSS (fonts, page breaks, grid)
└── lib/
    └── types.ts              # NewspaperConfig and all block types (shared)
```

---

## JSON Configuration Schema

### Top-level: `NewspaperConfig`

```typescript
interface NewspaperConfig {
  title: string;                         // newspaper name
  date?: string;                         // ISO date, defaults to today
  paper_size?: 'A4' | 'Letter' | 'A5';  // default: A4
  orientation?: 'portrait' | 'landscape';
  font_family?: string;                  // default: 'Georgia, serif'
  base_font_size?: number;               // px, default: 11
  margins?: Margins;                     // mm, default: { top:15, right:15, bottom:15, left:15 }
  calendar_entries?: CalendarEntry[];    // shared pool, referenced by calendar blocks
  pages: Page[];
}
```

### Page

```typescript
interface Page {
  layout: 'single' | 'two-column' | 'three-column';
  // single:       blocks: Block[]
  // two-column:   columns: [Block[], Block[]]
  // three-column: columns: [Block[], Block[], Block[]]
  blocks?: Block[];       // used when layout === 'single'
  columns?: Block[][];    // used when layout === 'two-column' | 'three-column'
  column_gap?: number;    // mm between columns, default: 5
}
```

### Block types

#### `MarkdownBlock`
Arbitrary Markdown content. Supports GFM (tables, checkboxes, etc.).

```typescript
{
  type: 'markdown';
  content: string;   // full Markdown string
  flex?: number;     // relative height weight in the column (default 1)
}
```

#### `TitleBlock`
Newspaper masthead / section header.

```typescript
{
  type: 'title';
  text: string;
  subtitle?: string;
  date_format?: string;           // e.g. 'EEEE, MMMM d, yyyy' — shown below subtitle
  style?: 'newspaper' | 'minimal' | 'bold';  // default: 'newspaper'
  border?: 'top' | 'bottom' | 'both' | 'none';
}
```

#### `WeatherBlock`
Current conditions + optional forecast. Data is fetched at render time by the engine.

```typescript
{
  type: 'weather';
  location: string;               // city name or lat,lon
  unit?: 'celsius' | 'fahrenheit';
  display?: 'current' | 'forecast-3' | 'forecast-5';
}
```

Pre-fetched `WeatherData` is injected before rendering so the engine doesn't need an API key at render time — the caller (cron/action) fetches it and injects it. This keeps the engine pure.

#### `WritingLinesBlock`
Blank ruled lines for handwriting — useful for a daily planner template.

```typescript
{
  type: 'writing-lines';
  label?: string;          // heading above the lines section
  lines?: number;          // explicit line count; if omitted, fills available height
  line_spacing_mm?: number; // default: 8
  show_margin?: boolean;   // left red-margin line, default: false
}
```

#### `CalendarWeekBlock`
Horizontal weekly view. Each day is a column; time slots are rows.

```typescript
{
  type: 'calendar-week';
  start_date: string;             // ISO date of Monday (or Sunday)
  week_start?: 'monday' | 'sunday';
  hours?: [number, number];       // e.g. [7, 21], default [8, 20]
  show_week_number?: boolean;
  slot_height_mm?: number;        // height per hour slot, default: 6
  use_global_entries?: boolean;   // pull from config.calendar_entries, default: true
  entries?: CalendarEntry[];      // additional or override entries
}
```

#### `CalendarDayBlock`
Vertical daily planner with hour rows and lines to fill in by hand.

```typescript
{
  type: 'calendar-day';
  date: string;                   // ISO date
  hours?: [number, number];       // e.g. [6, 22], default [7, 21]
  slot_height_mm?: number;        // height per 30-min slot, default: 5
  show_lines?: boolean;           // ruled lines within each slot, default: true
  use_global_entries?: boolean;   // default: true
  entries?: CalendarEntry[];
}
```

#### `DividerBlock`

```typescript
{
  type: 'divider';
  style?: 'solid' | 'dashed' | 'double' | 'decorative';
  margin_mm?: number;  // vertical margin, default: 2
}
```

#### `SpacerBlock`

```typescript
{
  type: 'spacer';
  height_mm?: number;  // default: 10
}
```

### `CalendarEntry` (shared data type)

```typescript
interface CalendarEntry {
  id?: string;
  title: string;
  description?: string;
  start_at: string;      // ISO 8601 datetime, or ISO date for all-day
  end_at: string;        // ISO 8601 datetime, or ISO date for all-day
  all_day: boolean;
  color?: string;        // hex e.g. '#4285F4', rendered as left border / background tint
  calendar?: string;     // source calendar label (e.g. 'Work', 'Personal')
}
```

---

## Example Configuration

```json
{
  "title": "Morning Brief",
  "date": "2026-03-20",
  "paper_size": "A4",
  "orientation": "portrait",
  "calendar_entries": [
    {
      "title": "Team standup",
      "start_at": "2026-03-20T09:00:00",
      "end_at": "2026-03-20T09:15:00",
      "all_day": false,
      "color": "#4285F4",
      "calendar": "Work"
    },
    {
      "title": "Doctor appointment",
      "start_at": "2026-03-20T14:30:00",
      "end_at": "2026-03-20T15:00:00",
      "all_day": false,
      "color": "#E57373"
    }
  ],
  "pages": [
    {
      "layout": "two-column",
      "columns": [
        [
          { "type": "title", "text": "Morning Brief", "date_format": "EEEE, MMMM d, yyyy", "style": "newspaper" },
          { "type": "weather", "location": "Berlin, DE", "unit": "celsius", "display": "forecast-3" },
          { "type": "divider" },
          { "type": "markdown", "content": "## Top of Mind\n- [ ] Review Q1 goals\n- [ ] Reply to Sarah\n- [ ] Book dentist" }
        ],
        [
          { "type": "calendar-day", "date": "2026-03-20", "hours": [7, 21] },
          { "type": "writing-lines", "label": "Notes", "lines": 8 }
        ]
      ]
    },
    {
      "layout": "single",
      "blocks": [
        { "type": "calendar-week", "start_date": "2026-03-16", "hours": [8, 19] }
      ]
    }
  ]
}
```

---

## Layer 2 — Visual Editor

Located at `/i/[slug]/newspaper/`. A client-side editor that produces and persists the `NewspaperConfig` JSON.

### Features

- **Page management** — add/remove/reorder pages; toggle layout (single / two-column)
- **Block palette** — drag blocks from a sidebar into columns
- **Block config panels** — clicking a block opens an inline config form (no separate modal)
- **Calendar entry manager** — a sheet/drawer to add/edit/delete `CalendarEntry` records in the shared pool; can also import from Google Calendar (ticket 020 integration)
- **Live JSON preview** — collapsible panel showing the raw config
- **PDF preview** — "Preview" button triggers `POST /api/newspaper/preview` which returns a PDF blob rendered in an `<iframe>`
- **Save** — persists config to `newspaper_templates` table

### Database: `newspaper_templates`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `instance_id` | uuid FK | NOT NULL |
| `user_id` | uuid FK | NOT NULL |
| `name` | text | e.g. "Morning Brief" |
| `config` | jsonb | Full `NewspaperConfig` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

RLS: standard instance member pattern.

---

## Layer 3 — Scheduler

### Database: `newspaper_schedules`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `template_id` | uuid FK → newspaper_templates | |
| `instance_id` | uuid FK | |
| `user_id` | uuid FK | |
| `cron_expression` | text | e.g. `'0 6 * * *'` (daily at 06:00) |
| `timezone` | text | e.g. `'Europe/Berlin'` |
| `enabled` | boolean | default true |
| `delivery` | jsonb | `DeliveryConfig` (see below) |
| `last_run_at` | timestamptz | |
| `last_pdf_path` | text | Supabase Storage path of last PDF |
| `created_at` / `updated_at` | timestamptz | |

### `DeliveryConfig`

```typescript
interface DeliveryConfig {
  kindle?: {
    enabled: boolean;
    email: string;   // foo@kindle.com
  };
  storage?: {
    enabled: boolean;
    keep_last_n?: number;  // rotate old PDFs, default: 7
  };
}
```

### Scheduler implementation

Supabase has no built-in cron runner. Options (in order of preference):

1. **Supabase Edge Function + pg_cron** — `pg_cron` triggers a Postgres function which calls a Supabase Edge Function via `http` extension. The Edge Function calls the Next.js `/api/newspaper/generate` route.
2. **External cron** (GitHub Actions, Fly.io cron, server cron) — simpler but less integrated.
3. **Vercel Cron** — if deployed on Vercel, configure cron jobs in `vercel.json`.

The scheduler should be deployable independently of the UI. The recommended approach for this project: **Vercel Cron** (`vercel.json` cron entries) calling `/api/newspaper/[scheduleId]/run` with a shared secret.

### PDF storage

Generated PDFs stored in Supabase Storage bucket `newspaper-pdfs` at path:
```
{instance_id}/{template_id}/{YYYY-MM-DD}.pdf
```

Public URLs gated by RLS on the storage bucket (or signed URLs).

---

## Layer 4 — API & External Delivery

### API routes

#### `GET /api/newspaper/[templateId]/pdf`
Returns the latest stored PDF (or generates on-the-fly if no stored version exists).

Query params:
- `?key=<api_key>` — for unauthenticated external access (HomeAssistant)
- `?date=2026-03-20` — fetch a specific date's PDF

Response: `application/pdf` with `Content-Disposition: attachment`.

#### `POST /api/newspaper/[templateId]/generate`
Triggers an on-demand generation:
1. Load template config from DB
2. Fetch dynamic data (weather, Google Calendar events)
3. Inject into config
4. Run engine → PDF buffer
5. Store in Supabase Storage
6. Return `{ url, generated_at }`

Auth: session cookie or `Authorization: Bearer <api_key>`.

#### `POST /api/newspaper/[scheduleId]/run`
Called by the cron runner. Looks up schedule → template, generates PDF, applies delivery config (Kindle email, storage rotation).

Auth: shared secret in `NEWSPAPER_CRON_SECRET` env var.

### API keys: `newspaper_api_keys` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `instance_id` | uuid FK | |
| `user_id` | uuid FK | |
| `name` | text | e.g. "HomeAssistant" |
| `key_hash` | text | SHA-256 hash of the actual key |
| `scopes` | text[] | e.g. `['read:pdf']` |
| `last_used_at` | timestamptz | |
| `created_at` | timestamptz | |

Key is shown once at creation time (never stored in plaintext).

### HomeAssistant integration

HA can call the PDF endpoint and send it to a Bluetooth printer using a local HA integration (e.g. `brother_label_printer` or a custom shell command via `rest_command`). The setup doc should describe:

1. Create API key in Memento settings
2. Add `rest_command.print_newspaper` in HA `configuration.yaml`
3. Create an automation that triggers on time → calls rest_command

### Kindle delivery

Send the PDF as an email attachment to the user's `@kindle.com` address using a transactional email provider (Resend / SendGrid / SES). The delivery config stores the Kindle email. The sender domain must be in the user's approved Kindle document sources.

Install: `pnpm add resend` (already likely to be added for other features).

---

## Sub-tickets

| # | Title | Layer | Priority |
|---|-------|-------|----------|
| 047 | PDF Engine — config schema + block renderers + md-to-pdf integration | Engine | P0 |
| 048 | Visual Editor — page/block editor + template CRUD | Editor | P0 |
| 049 | Scheduler — cron config, Vercel cron, Supabase Storage | Scheduler | P1 |
| 050 | API — PDF download endpoint + API key auth | API | P1 |
| 051 | Kindle delivery — Resend integration + delivery config UI | Delivery | P2 |
| 052 | HomeAssistant integration guide + API docs | Docs/API | P2 |
| 053 | Google Calendar → CalendarEntry import (uses ticket 020 data) | Editor | P2 |

---

## Open questions / decisions

1. **Weather API** — which provider? Open-Meteo (free, no key), OpenWeatherMap, or WeatherAPI? Recommend Open-Meteo: free, no signup, good JSON API.
2. **md-to-pdf in serverless** — Puppeteer/Chromium may not run on Vercel's free tier (file size limits, sandbox). If so, fallback: use `@sparticuz/chromium` + `puppeteer-core` directly, which is known to work on Vercel. Or render HTML → use a headless Chrome via Browserless.io.
3. **Cron runner** — Vercel Cron (if deployed there) vs. external. Decide before building ticket 049.
4. **PDF storage retention** — how many days to keep? Configurable per schedule or global setting?
5. **Font embedding** — for print quality, use a web-safe serif (Georgia) or embed a custom font (e.g. EB Garamond) via CSS `@font-face` in the PDF template.
6. **Two-column layout in md-to-pdf** — pure Markdown can't do columns. Must use HTML `<div class="two-col">` wrappers. The engine will wrap column content in divs with CSS grid/columns. This needs careful testing.
