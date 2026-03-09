# 034 — Finance Widget

## Goal
Add a stock, crypto, and currency price widget that snapshots market prices at edition generation time using the Yahoo Finance unofficial API (no API key required), rendered as a compact ticker table or card grid.

## Dependencies
- **Requires ticket 024** (widget registry)

## Schema Changes

Add `finance` to the `block_type` enum:

```sql
ALTER TYPE block_type ADD VALUE 'finance';
```

No new tables required — price data is fetched at generation time and snapshotted into the edition content.

## Implementation Notes

### Widget Config Shape

```ts
interface FinanceWidgetConfig {
  symbols: string[]        // e.g. ["AAPL", "BTC-USD", "EURUSD=X", "^FTSE"]
  show_change: boolean     // show daily change % and absolute change
  show_weekly_change: boolean
  show_chart: boolean      // sparkline for 7-day price history
  title?: string           // e.g. "Markets"
  layout: 'table' | 'cards'
}
```

### Data Fetching

Yahoo Finance chart endpoint (no auth required):

```
GET https://query1.finance.yahoo.com/v8/finance/chart/{symbol}
  ?interval=1d&range=7d
```

Returns OHLCV data. Extract:
- `meta.regularMarketPrice` — current price
- `meta.regularMarketChangePercent` — daily change %
- `meta.regularMarketChange` — absolute daily change
- `meta.currency` — e.g. "USD", "GBP"
- `meta.shortName` — e.g. "Apple Inc."
- `indicators.quote[0].close` — array of 7 daily closing prices (for sparkline)

Fetch all symbols in parallel (`Promise.all`). Handle fetch errors per-symbol gracefully (show "N/A" for failed symbols; do not fail the whole edition).

### Sparkline

For `show_chart: true`, compute a simple SVG sparkline from the 7 daily close prices:
- Inline SVG, ~80×24px
- Single path, no axes
- Colour: green if last price > first, red otherwise
- Generated server-side as an SVG string embedded in the snapshot

### Rendering

**Table layout**: columns — Name, Price (with currency symbol), Change %, optional Sparkline. One row per symbol.

**Cards layout**: a grid of small cards (2 per row for 1×n sizes, 3+ per row for wider). Each card: symbol ticker bold, name small, price large, change % with colour coding (green/red).

Size-aware:
- 1×1: table layout, up to 4 symbols, no sparkline
- 2×1: table layout, all symbols, no sparkline
- 2×2: cards layout, sparkline shown

### Rate Limiting / Caching

Yahoo Finance may throttle repeated requests. Add a 500ms delay between symbol fetches if fetching more than 5 symbols, or batch via a single multi-symbol call if the API supports it. Document that this API is unofficial and may break.

## New Files
```
src/modules/newspaper/lib/widgets/finance/index.ts
src/modules/newspaper/lib/widgets/finance/config.tsx
src/modules/newspaper/lib/widgets/finance/preview.tsx
src/modules/newspaper/lib/widgets/finance/thumbnail.tsx
src/modules/newspaper/lib/widgets/finance/sparkline.ts
supabase/migrations/YYYYMMDD_block_type_finance.sql
```

## Acceptance Criteria
- [ ] `finance` block type added to enum via migration
- [ ] Widget registered in the widget registry
- [ ] Fetches live prices for configured symbols at edition generation time
- [ ] Prices and change % snapshotted into edition content
- [ ] Per-symbol error handling — failed symbols show "N/A" without breaking the edition
- [ ] Table and cards layout modes render correctly
- [ ] Sparkline renders as inline SVG when `show_chart` is enabled
- [ ] Size-aware rendering across supported sizes
- [ ] Config form allows adding/removing symbols and toggling display options
