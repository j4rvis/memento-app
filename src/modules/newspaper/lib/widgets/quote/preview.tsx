"use client";

import type { WidgetPreviewProps } from "../types";

export function QuotePreview({ block }: WidgetPreviewProps) {
  const config = block.config as { text?: string; attribution?: string };
  const text = config.text || block.title;

  return (
    <div
      style={{
        borderTop: "2px solid currentColor",
        borderBottom: "2px solid currentColor",
        padding: "1.25rem 1rem",
        textAlign: "center",
        margin: "0.25rem 0",
        breakInside: "avoid",
      }}
    >
      <p
        style={{
          fontSize: "1.15em",
          fontStyle: "italic",
          lineHeight: 1.6,
          letterSpacing: "0.01em",
          position: "relative",
        }}
      >
        <span
          aria-hidden
          style={{
            display: "block",
            fontSize: "3em",
            lineHeight: 0.6,
            opacity: 0.25,
            fontStyle: "normal",
            fontWeight: 900,
            marginBottom: "0.1em",
            fontFamily: "Georgia, serif",
          }}
        >
          &ldquo;
        </span>
        {text}
        <span
          aria-hidden
          style={{
            display: "block",
            fontSize: "3em",
            lineHeight: 0.6,
            opacity: 0.25,
            fontStyle: "normal",
            fontWeight: 900,
            marginTop: "0.1em",
            fontFamily: "Georgia, serif",
          }}
        >
          &rdquo;
        </span>
      </p>
      {config.attribution && (
        <p
          style={{
            marginTop: "0.75rem",
            fontSize: "0.68em",
            fontStyle: "normal",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: 0.65,
          }}
        >
          — {config.attribution}
        </p>
      )}
    </div>
  );
}
