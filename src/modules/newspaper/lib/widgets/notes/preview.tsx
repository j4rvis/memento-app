"use client";

import type { WidgetPreviewProps } from "../types";

export function NotesPreview({ block }: WidgetPreviewProps) {
  const notes = (block.data as Array<{
    title: string;
    content: string;
    is_pinned: boolean;
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

      {notes.length > 0 ? (
        <div>
          {notes.map((note, i) => (
            <div
              key={i}
              style={{
                marginBottom: "0.7rem",
                paddingBottom: "0.7rem",
                borderBottom: i < notes.length - 1 ? "1px solid currentColor" : undefined,
                opacity: i < notes.length - 1 ? 1 : 0.85,
              }}
            >
              <p
                style={{
                  fontSize: "0.85em",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  marginBottom: "0.2rem",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: note.is_pinned ? "italic" : undefined,
                }}
              >
                {note.is_pinned && (
                  <span style={{ opacity: 0.5, marginRight: "0.3em", fontSize: "0.8em" }}>★</span>
                )}
                {note.title}
              </p>
              {note.content && (
                <p
                  style={{
                    fontSize: "0.78em",
                    lineHeight: 1.5,
                    opacity: 0.7,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {note.content}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: "0.8em", opacity: 0.5, fontStyle: "italic" }}>No notes.</p>
      )}
    </div>
  );
}
