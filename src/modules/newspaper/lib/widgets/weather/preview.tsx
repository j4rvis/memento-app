"use client";

import type { WidgetPreviewProps } from "../types";

export interface WeatherData {
  location: string;
  error?: string;
  current?: {
    temperature: number;
    apparent_temperature: number;
    condition: string;
    wind_speed: number;
  };
  forecast?: Array<{
    date: string;
    condition: string;
    max: number;
    min: number;
  }>;
}

export function WeatherPreview({ block }: WidgetPreviewProps) {
  const data = block.data as WeatherData | null;

  if (!data || data.error) {
    return (
      <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
        <p
          style={{
            fontSize: "0.7em",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 700,
            opacity: 0.55,
          }}
        >
          {block.title}
        </p>
        <p style={{ fontSize: "0.75em", opacity: 0.5, fontStyle: "italic", marginTop: "0.25rem" }}>
          {data?.error ?? "Weather data unavailable"}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0.25rem 0" }}>
      {/* Header row: location + current temp */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.4rem" }}>
        <p
          style={{
            fontSize: "0.7em",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 700,
            opacity: 0.7,
          }}
        >
          {data.location}
        </p>
        {data.current && (
          <p
            style={{
              fontSize: "1.4em",
              fontWeight: 700,
              lineHeight: 1,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            {Math.round(data.current.temperature)}°
          </p>
        )}
      </div>

      {data.current && (
        <p
          style={{
            fontSize: "0.72em",
            opacity: 0.65,
            fontStyle: "italic",
            marginBottom: "0.5rem",
          }}
        >
          {data.current.condition} · Feels like {Math.round(data.current.apparent_temperature)}° ·{" "}
          Wind {Math.round(data.current.wind_speed)} km/h
        </p>
      )}

      {/* Forecast: compact inline */}
      {data.forecast && data.forecast.length > 0 && (
        <>
          <div style={{ height: "1px", background: "currentColor", opacity: 0.2, marginBottom: "0.4rem" }} />
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {data.forecast.map((day) => (
              <div key={day.date} style={{ flex: 1, textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "0.6em",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    opacity: 0.6,
                  }}
                >
                  {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p
                  style={{
                    fontSize: "0.65em",
                    fontStyle: "italic",
                    opacity: 0.55,
                    lineHeight: 1.3,
                    margin: "0.1rem 0",
                  }}
                >
                  {day.condition}
                </p>
                <p style={{ fontSize: "0.65em", opacity: 0.75 }}>
                  {Math.round(day.max)}° / {Math.round(day.min)}°
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
