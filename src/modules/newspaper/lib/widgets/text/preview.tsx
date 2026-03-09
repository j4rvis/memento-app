"use client";

import type { WidgetPreviewProps } from "../types";

export function TextPreview({ block }: WidgetPreviewProps) {
  const data = block.data as { body: string } | null;
  const body = data?.body || "";
  // Split into paragraphs
  const paragraphs = body.split(/\n\n+/).filter(Boolean);
  const singleParagraph = paragraphs.length <= 1;

  return (
    <div>
      {/* Section label */}
      {block.title && (
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
      )}
      {singleParagraph ? (
        <p
          className="np-drop-cap"
          style={{
            fontSize: "0.88em",
            lineHeight: 1.6,
            textAlign: "justify",
            hyphens: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {body}
        </p>
      ) : (
        paragraphs.map((para, i) => (
          <p
            key={i}
            className={i === 0 ? "np-drop-cap" : undefined}
            style={{
              fontSize: "0.88em",
              lineHeight: 1.6,
              textAlign: "justify",
              hyphens: "auto",
              marginBottom: i < paragraphs.length - 1 ? "0.6em" : 0,
            }}
          >
            {para}
          </p>
        ))
      )}
    </div>
  );
}
