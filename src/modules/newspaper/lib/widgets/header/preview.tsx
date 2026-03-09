"use client";

import type { WidgetPreviewProps } from "../types";
import type { WeatherData } from "../weather/preview";

export function HeaderPreview({ block }: WidgetPreviewProps) {
  const config = block.config as { location?: string; tagline?: string };
  const weather = block.data as WeatherData | null;

  const now = new Date();
  const dayName = now.toLocaleDateString(undefined, { weekday: "long" });
  const dateStr = now.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="border-b-4 border-double border-black dark:border-foreground py-4 text-center print:border-black">
      <div className="flex items-center justify-between text-xs text-muted-foreground print:text-gray-600 mb-1 px-2">
        <span>{dayName}</span>
        {weather?.current && (
          <span>
            {config.location} · {Math.round(weather.current.temperature)}°C · {weather.current.condition}
          </span>
        )}
        <span>{dateStr}</span>
      </div>
      <h1 className="text-4xl font-bold font-serif">{block.title}</h1>
      {config.tagline && (
        <p className="mt-1 text-sm italic text-muted-foreground print:text-gray-600">{config.tagline}</p>
      )}
    </div>
  );
}
