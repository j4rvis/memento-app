import type { WeatherBlock } from '../../lib/types';

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers', 81: 'Showers', 82: 'Violent showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm w/ hail', 99: 'Thunderstorm w/ heavy hail',
};

const SHORT_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function wmoLabel(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? 'Unknown';
}

function unitLabel(unit: 'celsius' | 'fahrenheit'): string {
  return unit === 'celsius' ? '°C' : '°F';
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderWeather(block: WeatherBlock): string {
  const data = block.data;
  if (!data) {
    return `<div class="block-weather"><em>Weather data unavailable for ${esc(block.location)}</em></div>`;
  }

  const unit = unitLabel(data.unit);
  const display = block.display ?? 'forecast-3';
  const forecastDays = display === 'current' ? 0 : display === 'forecast-3' ? 3 : 5;

  const CARD = 'border:1px solid var(--np-border);border-top:3px solid var(--np-card-top-border);padding:3mm;margin-bottom:3mm;font-size:10px;background:var(--np-card-bg);page-break-inside:avoid;';

  let html = `<div style="${CARD}">`;

  // Location header
  html += `<div style="font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.04em;color:var(--np-accent);margin-bottom:2mm;">${esc(data.location)}</div>`;

  // Current conditions — table layout so it always renders side-by-side
  const hasForecast = forecastDays > 0 && data.forecast.length > 0;
  const currentBorder = hasForecast ? 'border-bottom:1px solid var(--np-border);' : '';
  html += `<table style="width:100%;border:none;border-collapse:collapse;margin-bottom:${hasForecast ? '2mm' : '0'};padding-bottom:${hasForecast ? '2mm' : '0'};${currentBorder}"><tr>`;
  html += `<td style="font-size:26px;font-weight:bold;line-height:1;padding-right:3mm;vertical-align:middle;white-space:nowrap;color:var(--np-text);">${Math.round(data.current.temperature)}${unit}</td>`;
  html += `<td style="vertical-align:middle;">`;
  html += `<div style="font-size:11px;font-weight:500;color:var(--np-accent);">${esc(wmoLabel(data.current.weathercode))}</div>`;
  html += `<div style="font-size:9px;color:var(--np-muted);margin-top:1mm;">Wind: ${Math.round(data.current.windspeed)} km/h</div>`;
  html += `</td></tr></table>`;

  // Forecast — table layout for reliable column rendering
  if (hasForecast) {
    const days = data.forecast.slice(0, forecastDays);
    html += `<table style="width:100%;border:none;border-collapse:collapse;"><tr>`;
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      // Parse date as local noon to get correct day-of-week
      const [y, m, d] = day.date.split('-').map(Number);
      const dt = new Date(y, m - 1, d, 12, 0, 0);
      const dayName = SHORT_DAY[dt.getDay()];
      const borderLeft = i > 0 ? 'border-left:1px solid var(--np-border);' : '';
      html += `<td style="text-align:center;vertical-align:top;${borderLeft}padding:1.5mm 1mm;font-size:9px;">`;
      html += `<div style="font-weight:bold;color:var(--np-accent);margin-bottom:1mm;">${dayName}</div>`;
      html += `<div style="color:var(--np-muted);font-size:8px;margin-bottom:0.5mm;">${esc(wmoLabel(day.weathercode))}</div>`;
      html += `<div style="font-weight:500;color:var(--np-text);">${Math.round(day.temp_max)}/${Math.round(day.temp_min)}${unit}</div>`;
      html += `</td>`;
    }
    html += `</tr></table>`;
  }

  html += `</div>`;
  return html;
}
