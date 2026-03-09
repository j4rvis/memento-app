"use client";

import type { WidgetPreviewProps } from "../types";
import type { WeatherData } from "../weather/preview";

export function HeaderPreview({ block }: WidgetPreviewProps) {
  const config = block.config as { location?: string; tagline?: string };
  const weather = block.data as WeatherData | null;

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const weatherLine =
    weather?.current && !weather.error
      ? `${weather.location} · ${Math.round(weather.current.temperature)}°C · ${weather.current.condition}`
      : null;

  return (
    <div style={{ textAlign: "center", padding: "0.5rem 0 1rem" }}>
      {/* Top ornamental rule */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <div style={{ flex: 1, height: "3px", background: "currentColor" }} />
        <div style={{ flex: 1, height: "1px", background: "currentColor", marginTop: "5px" }} />
      </div>

      {/* Dateline bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.6em",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: 0.7,
          padding: "0.25rem 0.25rem",
          borderTop: "1px solid currentColor",
          borderBottom: "1px solid currentColor",
          marginBottom: "0.75rem",
        }}
      >
        <span>{dayName}</span>
        {weatherLine && <span>{weatherLine}</span>}
        <span>{dateStr}</span>
      </div>

      {/* Masthead title */}
      <h1
        style={{
          fontSize: "3.5em",
          fontWeight: 900,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          margin: "0 0 0.2rem",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}
      >
        {block.title}
      </h1>

      {/* Tagline */}
      {config.tagline && (
        <p
          style={{
            fontSize: "0.75em",
            fontStyle: "italic",
            opacity: 0.65,
            letterSpacing: "0.04em",
            margin: "0.3rem 0 0.5rem",
          }}
        >
          {config.tagline}
        </p>
      )}

      {/* Bottom ornamental rule */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
        <div style={{ flex: 1, height: "1px", background: "currentColor", marginBottom: "5px" }} />
        <div style={{ flex: 1, height: "3px", background: "currentColor" }} />
      </div>
    </div>
  );
}
