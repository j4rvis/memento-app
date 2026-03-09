"use client";

import type { WidgetPreviewProps } from "../types";

interface WeatherCurrent {
  temperature: number;
  apparent_temperature: number;
  condition: string;
  wind_speed: number;
}

interface WeatherForecastDay {
  date: string;
  condition: string;
  max: number;
  min: number;
}

export interface WeatherData {
  location: string;
  error?: string;
  current?: WeatherCurrent;
  forecast?: WeatherForecastDay[];
}

export function WeatherPreview({ block }: WidgetPreviewProps) {
  const data = block.data as WeatherData | null;

  if (!data) {
    return (
      <div className="text-center py-4">
        <h3 className="font-semibold">{block.title}</h3>
        <p className="text-muted-foreground text-sm">Weather data unavailable</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="text-center py-4">
        <h3 className="font-semibold">{block.title}</h3>
        <p className="text-muted-foreground text-sm">{data.location} — {data.error}</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <h3 className="font-semibold mb-2">{block.title}</h3>
      <p className="text-sm font-medium">{data.location}</p>
      {data.current && (
        <div className="mt-1">
          <span className="text-2xl font-bold">{Math.round(data.current.temperature)}°C</span>
          <span className="text-sm text-muted-foreground ml-2">{data.current.condition}</span>
          <p className="text-xs text-muted-foreground">
            Feels like {Math.round(data.current.apparent_temperature)}°C · Wind {Math.round(data.current.wind_speed)} km/h
          </p>
        </div>
      )}
      {data.forecast && data.forecast.length > 0 && (
        <div className="mt-2 flex gap-4">
          {data.forecast.map((day) => (
            <div key={day.date} className="text-xs">
              <p className="font-medium">{new Date(day.date).toLocaleDateString(undefined, { weekday: "short" })}</p>
              <p className="text-muted-foreground">{day.condition}</p>
              <p>{Math.round(day.max)}° / {Math.round(day.min)}°</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
