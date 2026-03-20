import type { WeatherData } from '../../lib/types';

interface GeocodingResult {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    country?: string;
  }>;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weathercode: number;
    windspeed_10m: number;
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

async function geocode(location: string): Promise<{ lat: number; lon: number; name: string }> {
  // Support "lat,lon" format directly
  const latLon = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (latLon) {
    return { lat: parseFloat(latLon[1]), lon: parseFloat(latLon[2]), name: location };
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed for "${location}": ${res.status}`);

  const data = (await res.json()) as GeocodingResult;
  const first = data.results?.[0];
  if (!first) throw new Error(`No geocoding results for "${location}"`);

  const displayName = [first.name, first.country].filter(Boolean).join(', ');
  return { lat: first.latitude, lon: first.longitude, name: displayName };
}

export async function fetchWeather(
  location: string,
  unit: 'celsius' | 'fahrenheit' = 'celsius',
  forecastDays = 5,
): Promise<WeatherData> {
  const { lat, lon, name } = await geocode(location);

  const tempUnit = unit === 'celsius' ? 'celsius' : 'fahrenheit';
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weathercode,windspeed_10m` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=${tempUnit}` +
    `&forecast_days=${forecastDays}` +
    `&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);

  const data = (await res.json()) as OpenMeteoResponse;

  return {
    location: name,
    unit,
    current: {
      temperature: data.current.temperature_2m,
      weathercode: data.current.weathercode,
      windspeed: data.current.windspeed_10m,
    },
    forecast: data.daily.time.map((date, i) => ({
      date,
      weathercode: data.daily.weathercode[i],
      temp_max: data.daily.temperature_2m_max[i],
      temp_min: data.daily.temperature_2m_min[i],
    })),
  };
}
