"use client";

import type { WidgetPreviewProps } from "../types";

export function ImagePreview({ block }: WidgetPreviewProps) {
  const config = block.config as { url?: string; caption?: string; keywords?: string };

  const seed = config.keywords
    ? config.keywords.replace(/[^a-zA-Z0-9]/g, "-")
    : block.title.replace(/[^a-zA-Z0-9]/g, "-") || "newspaper";
  const src = config.url || `https://picsum.photos/seed/${seed}/900/450`;

  return (
    <div style={{ margin: "0.25rem 0", breakInside: "avoid" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={config.caption || block.title}
        style={{
          width: "100%",
          height: "auto",
          maxHeight: "360px",
          objectFit: "cover",
          display: "block",
        }}
      />
      {config.caption && (
        <p
          style={{
            fontSize: "0.65em",
            fontStyle: "italic",
            textAlign: "center",
            marginTop: "0.3rem",
            opacity: 0.65,
            borderBottom: "1px solid currentColor",
            paddingBottom: "0.4rem",
            letterSpacing: "0.02em",
          }}
        >
          {config.caption}
        </p>
      )}
    </div>
  );
}
