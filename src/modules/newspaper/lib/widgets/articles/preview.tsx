"use client";

import type { WidgetPreviewProps } from "../types";

export function ArticlesPreview({ block }: WidgetPreviewProps) {
  const articles = (block.data as Array<{
    title: string;
    url: string;
    excerpt: string;
    site_name: string;
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

      {articles.length > 0 ? (
        <div>
          {articles.map((article, i) => (
            <div
              key={i}
              style={{
                paddingBottom: "0.75rem",
                marginBottom: "0.75rem",
                borderBottom: i < articles.length - 1 ? "1px solid currentColor" : undefined,
              }}
            >
              <p
                style={{
                  fontSize: "1em",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  marginBottom: "0.15rem",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                {article.title}
              </p>
              {article.site_name && (
                <p
                  style={{
                    fontSize: "0.6em",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontStyle: "italic",
                    opacity: 0.55,
                    marginBottom: "0.3rem",
                  }}
                >
                  {article.site_name}
                </p>
              )}
              {article.excerpt && (
                <p
                  className={i === 0 ? "np-drop-cap" : undefined}
                  style={{
                    fontSize: "0.85em",
                    lineHeight: 1.55,
                    textAlign: "justify",
                    hyphens: "auto",
                  }}
                >
                  {article.excerpt}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: "0.8em", opacity: 0.5, fontStyle: "italic" }}>No articles</p>
      )}
    </div>
  );
}
