"use client";

import type { WidgetPreviewProps } from "../types";

export function RssPreview({ block }: WidgetPreviewProps) {
  const entries = (block.data as Array<{
    title: string;
    url: string;
    summary: string;
    published_at: string;
  }>) || [];

  return (
    <div>
      {/* Section label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "currentColor", opacity: 0.3 }} />
        <span
          style={{
            fontSize: "0.6em",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            opacity: 0.55,
            whiteSpace: "nowrap",
          }}
        >
          {block.title}
        </span>
        <div style={{ flex: 1, height: "1px", background: "currentColor", opacity: 0.3 }} />
      </div>

      {entries.length > 0 ? (
        <div>
          {entries.map((entry, i) => (
            <div
              key={i}
              style={{
                paddingBottom: "0.75rem",
                marginBottom: "0.75rem",
                borderBottom: i < entries.length - 1 ? "1px solid currentColor" : undefined,
                opacity: i < entries.length - 1 ? 1 : 0.85,
              }}
            >
              {/* Headline */}
              <p
                style={{
                  fontSize: "1em",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  marginBottom: "0.2rem",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                {entry.title}
              </p>
              {/* Byline */}
              {entry.published_at && (
                <p
                  style={{
                    fontSize: "0.6em",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    opacity: 0.55,
                    marginBottom: "0.35rem",
                    fontStyle: "italic",
                  }}
                >
                  {new Date(entry.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
              {/* Summary with drop cap on first entry */}
              {entry.summary && (
                <p
                  className={i === 0 ? "np-drop-cap" : undefined}
                  style={{
                    fontSize: "0.85em",
                    lineHeight: 1.55,
                    textAlign: "justify",
                    hyphens: "auto",
                  }}
                >
                  {entry.summary}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: "0.8em", opacity: 0.5, fontStyle: "italic" }}>No entries</p>
      )}
    </div>
  );
}
