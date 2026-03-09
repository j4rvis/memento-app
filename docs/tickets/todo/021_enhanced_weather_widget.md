# 021 — Enhanced Weather Widget

## Goal
Upgrade the existing weather block to support richer data: moon phase, sunrise/sunset times, hourly forecast, 7-day forecast, and size-aware rendering for different grid spans.

## Background
The current weather block fetches from Open-Meteo (no API key) and shows current conditions + 3-day forecast. This ticket extends the data fetched and adds size-aware display so a 1×1 block shows a summary while a 2×2 block shows the full forecast.

## New Data Points (all from Open-Meteo — no API key)

### Additional API fields to request

**Hourly variables:**
- `precipitation_probability` — hourly rain chance
- `temperature_2m` — already fetched (ensure hourly)

**Daily variables:**
- `sunrise`, `sunset` — ISO8601 times
- `precipitation_probability_max`
- `uv_index_max`

**Current variables (add):**
- `apparent_temperature` — "feels like"
- `wind_speed_10m`, `wind_direction_10m`
- `relative_humidity_2m`
- `surface_pressure`

### Moon Phase (computed, no API)
Moon phase can be calculated from the Julian date. Implement `getMoonPhase(date: Date)` returning:
```ts
{
  phase: number        // 0–1 (0 = new moon, 0.5 = full moon)
  name: MoonPhaseName  // 'New Moon' | 'Waxing Crescent' | ... | 'Waning Crescent'
  emoji: string        // 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘
}
```

Use the standard astronomical formula (based on known new moon epoch + 29.53059 day synodic month).

## Size-Aware Widget Variants

| Grid Size | Display |
|-----------|---------|
| 1×1 | Current temp, weather icon/emoji, location, moon emoji |
| 2×1 (wide) | Current temp + feels like, wind, humidity, sunrise/sunset, moon phase |
| 1×2 (tall) | Current conditions + 3-day forecast vertically |
| 2×2 | Full: current, hourly bar (next 12h), 7-day forecast, sunrise/sunset, moon, UV, wind |

## Config Schema Update
```ts
interface WeatherConfig {
  location: string
  units?: 'celsius' | 'fahrenheit'  // new, default celsius
  show_hourly?: boolean              // new, default true
  show_weekly?: boolean              // new, default true
  show_moon?: boolean                // new, default true
  show_sun_times?: boolean           // new, default true
}
```

## Implementation

### `src/modules/newspaper/lib/weather.ts` (update)
- Extend `fetchWeatherData(location, config)` to fetch additional fields
- Add `getMoonPhase(date)` pure function
- Return richer `WeatherData` type

### `src/modules/newspaper/components/widgets/WeatherWidget.tsx` (new)
Size-aware React component:
```tsx
<WeatherWidget data={weatherData} colSpan={block.col_span} rowSpan={block.row_span} />
```

Internally renders one of:
- `WeatherCompact` — 1×1
- `WeatherWide` — 2×1
- `WeatherTall` — 1×2
- `WeatherFull` — 2×2

### Hourly Bar Component
Visual bar showing next 12 hours: time + temperature + rain probability icon (none / light / moderate / heavy).

### 7-Day Forecast Component
Table/grid: day name, icon, high/low temps, rain probability, UV index.

## Edition Snapshot
Weather data is fetched at edition generation time (existing pattern). The `content` JSONB will store the full richer data object. `WeatherWidget` renders from snapshot data — no live refetch in preview.

## Acceptance Criteria
- [ ] Moon phase correctly calculated (verify against known dates)
- [ ] Sunrise/sunset times display in local timezone (use Open-Meteo `timezone` param)
- [ ] Hourly bar shows next 12 hours of temp + rain probability
- [ ] 7-day forecast shows all days with high/low/UV/rain
- [ ] Widget renders correctly at all 4 size variants
- [ ] "Feels like", wind, humidity visible in appropriate sizes
- [ ] Units toggle (°C / °F) works
- [ ] Existing weather blocks continue to work (backward compatible config)
