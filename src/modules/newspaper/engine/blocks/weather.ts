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

  let html = `<div class="block-weather">`;
  html += `<div style="font-size:10px;font-weight:bold;margin-bottom:1mm;">${esc(data.location)}</div>`;

  // Current conditions
  html += `<div class="weather-current">`;
  html += `<span class="weather-temp">${Math.round(data.current.temperature)}${unit}</span>`;
  html += `<span>`;
  html += `<div class="weather-desc">${esc(wmoLabel(data.current.weathercode))}</div>`;
  html += `<div class="weather-wind">Wind: ${Math.round(data.current.windspeed)} km/h</div>`;
  html += `</span>`;
  html += `</div>`;

  // Forecast
  if (forecastDays > 0 && data.forecast.length > 0) {
    const days = data.forecast.slice(0, forecastDays);
    html += `<div class="weather-forecast">`;
    for (const day of days) {
      const d = new Date(day.date);
      const dayName = SHORT_DAY[d.getDay()];
      html += `<div class="forecast-day">`;
      html += `<div class="forecast-date">${dayName}</div>`;
      html += `<div>${esc(wmoLabel(day.weathercode))}</div>`;
      html += `<div class="forecast-temps">${Math.round(day.temp_max)}/${Math.round(day.temp_min)}${unit}</div>`;
      html += `</div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}
