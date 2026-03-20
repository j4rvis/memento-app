# 047 — Newspaper PDF Engine

## Goal

Build a pure rendering engine that takes a `NewspaperConfig` JSON and returns a PDF buffer. No database access, no side effects — a function `render(config) → Promise<Buffer>`.

## Background

See `docs/story-newspaper.md` for the full system overview. This is the foundational ticket; all other newspaper tickets depend on it.

## Block Types to Support

| Block | Output |
|-------|--------|
| `title` | HTML masthead with optional date and border |
| `markdown` | GFM Markdown prose (lists, checkboxes, tables, etc.) |
| `weather` | HTML card with current conditions + optional forecast |
| `writing-lines` | HTML ruled lines (printable writing template) |
| `calendar-week` | HTML grid — days as columns, hour slots as rows |
| `calendar-day` | HTML timeline — hours as rows with ruled lines |
| `divider` | `<hr>` with style variants |
| `spacer` | `<div>` with explicit height |

## Config Schema

Define all TypeScript types in `src/modules/newspaper/lib/types.ts`:

- `NewspaperConfig` — top-level (title, date, paper_size, orientation, margins, calendar_entries, pages)
- `Page` — layout (`single | two-column | three-column`), blocks or columns
- All block interfaces (see story doc for full field list)
- `CalendarEntry` — id, title, description, start_at, end_at, all_day, color, calendar

## Rendering Pipeline

```
NewspaperConfig
  └─ inject dynamic data (weather already pre-fetched by caller)
  └─ for each Page → pageToHtml(page)
       └─ for each Block → blockToHtml(block)
  └─ wrap in full HTML document with base CSS
  └─ md-to-pdf (html mode) → Buffer
```

Use `md-to-pdf` in HTML input mode (pass full HTML string, not Markdown file path). This avoids Markdown-to-HTML conversion issues for complex blocks.

## Two-Column Layout

Wrap columns in `<div class="columns-2">` with CSS:
```css
.columns-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.columns-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; }
```

Page breaks must not split a calendar block — use `page-break-inside: avoid` on those elements.

## Weather Block

The engine expects weather data to already be present in the block config (pre-fetched by the caller). Add a fetcher helper `src/modules/newspaper/engine/fetchers/weather.ts` using Open-Meteo (free, no API key):

```
GET https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current=temperature_2m,weathercode,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=5
```

Use `https://geocoding-api.open-meteo.com/v1/search?name=<location>` to resolve city name → lat/lon.

The fetcher returns a `WeatherData` object that the caller injects into `WeatherBlock.data` before calling `render()`.

## Calendar Blocks

Calendar week: render an HTML table where columns = days (Mon–Sun) and rows = hour slots. Show `CalendarEntry` items from the shared `config.calendar_entries` pool (filtered to the displayed week) as coloured boxes positioned within the appropriate cell.

Calendar day: render an HTML table where rows = 30-minute slots. Show entries as coloured rows. Include light horizontal lines in empty slots (`show_lines: true`).

Entry colour: use the `color` field as a left border (`border-left: 3px solid <color>`) with a 10% opacity background tint.

## Print CSS

`src/modules/newspaper/engine/styles/base.css`:
- Paper size via `@page { size: A4; margin: 15mm; }`
- Font: Georgia serif, 11px base
- No screen-only elements
- `page-break-after: always` on page wrappers
- `page-break-inside: avoid` on calendar blocks and weather cards

## Puppeteer / Serverless Note

`md-to-pdf` uses Puppeteer internally. On Vercel serverless (and similar), standard Chromium won't work due to sandbox limits. Use `@sparticuz/chromium` + `puppeteer-core` and pass the executablePath to `md-to-pdf`'s launch options. Document this in a comment in `engine/index.ts`.

Install:
```
pnpm add md-to-pdf
pnpm add @sparticuz/chromium puppeteer-core
```

## File Structure

```
src/modules/newspaper/
├── lib/
│   └── types.ts                   # All config types (shared with editor)
└── engine/
    ├── index.ts                   # render(config): Promise<Buffer>
    ├── config-to-html.ts          # walks pages/blocks → full HTML string
    ├── blocks/
    │   ├── title.ts
    │   ├── markdown.ts            # use 'marked' or inline md-to-html
    │   ├── weather.ts
    │   ├── writing-lines.ts
    │   ├── calendar-week.ts
    │   ├── calendar-day.ts
    │   ├── divider.ts
    │   └── spacer.ts
    ├── fetchers/
    │   └── weather.ts             # Open-Meteo fetch + geocoding
    └── styles/
        └── base.css
```

## Plan

1. Install dependencies: `md-to-pdf`, `@sparticuz/chromium`, `puppeteer-core`, `marked`
2. Create `src/modules/newspaper/lib/types.ts` — all TypeScript interfaces from the story doc
3. Create `src/modules/newspaper/engine/styles/base.css` — print CSS
4. Create block renderers in `src/modules/newspaper/engine/blocks/` (8 files)
5. Create `src/modules/newspaper/engine/fetchers/weather.ts` — Open-Meteo fetcher
6. Create `src/modules/newspaper/engine/config-to-html.ts` — walks pages/blocks → full HTML string
7. Create `src/modules/newspaper/engine/index.ts` — `render(config)` using md-to-pdf with @sparticuz/chromium

## Acceptance Criteria

- [x] `render(config)` returns a valid PDF buffer for a config with every block type
- [x] Two-column and three-column layouts render correctly on A4
- [x] Calendar week block shows entries with correct day/time positioning
- [x] Calendar day block shows entries and ruled lines
- [x] Weather block renders current + forecast (when data injected)
- [x] Writing lines fill available height when `lines` is omitted
- [x] Page breaks occur between pages, not inside calendar/weather blocks
- [x] Works in Next.js server action and API route context
- [x] Puppeteer/Chromium setup documented for serverless deployment

## Summary

Implemented the full Newspaper PDF Engine — a pure `render(config: NewspaperConfig): Promise<Buffer>` function with no side effects.

**Files created:**
- `src/modules/newspaper/lib/types.ts` — all TypeScript interfaces (`NewspaperConfig`, `Page`, all 8 block types, `CalendarEntry`, `WeatherData`)
- `src/modules/newspaper/engine/index.ts` — `render()` entry point using `md-to-pdf` + `@sparticuz/chromium` with full serverless deployment documentation
- `src/modules/newspaper/engine/config-to-html.ts` — walks pages/blocks → complete HTML document string
- `src/modules/newspaper/engine/blocks/title.ts` — masthead with date formatting and border variants
- `src/modules/newspaper/engine/blocks/markdown.ts` — GFM Markdown via `marked`
- `src/modules/newspaper/engine/blocks/weather.ts` — current conditions + forecast card (uses pre-injected `WeatherData`)
- `src/modules/newspaper/engine/blocks/writing-lines.ts` — ruled lines with optional margin line
- `src/modules/newspaper/engine/blocks/calendar-week.ts` — weekly grid (Mon–Sun columns, hour rows, coloured entry tiles)
- `src/modules/newspaper/engine/blocks/calendar-day.ts` — daily timeline (30-min slots, ruled lines, coloured entries)
- `src/modules/newspaper/engine/blocks/divider.ts` — solid/dashed/double/decorative `<hr>` variants
- `src/modules/newspaper/engine/blocks/spacer.ts` — explicit-height spacer div
- `src/modules/newspaper/engine/fetchers/weather.ts` — Open-Meteo geocoding + forecast fetch returning `WeatherData`
- `src/modules/newspaper/engine/styles/base.css` — print-optimised CSS (A4 @page, Georgia serif, column grids, `page-break-inside: avoid` on calendar/weather)

**Dependencies added:** `md-to-pdf`, `@sparticuz/chromium`, `puppeteer-core`, `marked`

**Completed:** 2026-03-20
