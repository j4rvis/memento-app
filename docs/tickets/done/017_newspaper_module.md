# 017 Newspaper Module Improvements

## Issues
- the module right now is not ready yet
- when I select a content block and change the block type it is actually not changing the title etc.
- the configuration should not be json like but have selects accordingly
- the weather was not working in the preview
- prepare a calendar block already
- also it should be possible to select an article from a list. Ideally also a random article or 3 from a certain category

## Plan

1. **DB migration** — add `calendar` to `block_type` enum
2. **`BlockConfigFields` component** — shared component rendering type-specific form fields (no raw JSON)
   - `weather`: location text input
   - `rss`: feed_id select + max_items number
   - `notes`: filter select (all/pinned) + max_items number
   - `text`: body textarea
   - `articles`: mode select (latest/random/category/specific) + count + category text or article checkboxes
   - `todos`: max_items number
   - `calendar`: days_ahead number
3. **`AddBlockForm`** — use `BlockConfigFields`, fix title not resetting on type change, accept feeds+articles as props
4. **`BlockEditor`** — add block type selector that resets title+config on change, use `BlockConfigFields`, accept feeds+articles props
5. **Server page `[id]/page.tsx`** — fetch feeds and articles (id+title) and pass to form components
6. **Actions** — update `addBlock`/`updateBlock` to parse structured `config_*` fields instead of raw JSON; update `generateEdition` for weather API, calendar block, and articles mode
7. **`newspaper-preview.tsx`** — update WeatherBlock with real weather data, add CalendarBlock renderer
8. **Update `feature-newspaper.md`** — document new block types and config schemas

## Summary

Overhauled the newspaper module to make it production-ready:

- **Block type change now resets title & config** in `BlockEditor` — a type selector replaces the badge, and changing type clears config and resets the title to the block type label.
- **Structured config UI** — replaced raw JSON textareas with `BlockConfigFields`, a shared component rendering type-appropriate form fields: selects, number inputs, textareas, and checkboxes (no JSON editing exposed to users).
- **Weather works** — integrated Open-Meteo API (free, no key needed); editions now include current temperature, conditions, feels-like, wind speed, and a 3-day forecast.
- **Calendar block** added — shows todos with due dates in the next N days, grouped by day in the preview.
- **Articles selection** — four modes: latest, random, by category, or specific (checkbox list). Count configurable in all but specific mode.
- **DB migration** — `calendar` added to `block_type` enum.

Completed: 2026-03-01
