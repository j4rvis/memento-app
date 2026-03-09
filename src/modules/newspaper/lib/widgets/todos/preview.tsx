"use client";

import type { WidgetPreviewProps } from "../types";

export function TodosPreview({ block }: WidgetPreviewProps) {
  const todos = (block.data as Array<{
    title: string;
    is_completed: boolean;
    priority: number;
    due_date: string | null;
  }>) || [];

  return (
    <div>
      {/* Section label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.65rem",
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

      {todos.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {todos.map((todo, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.4rem",
                fontSize: "0.82em",
                lineHeight: 1.5,
                paddingBottom: "0.2rem",
                marginBottom: "0.2rem",
                borderBottom: i < todos.length - 1 ? "1px dotted currentColor" : undefined,
                opacity: todo.is_completed ? 0.45 : 1,
              }}
            >
              <span style={{ opacity: 0.4, fontSize: "0.8em", flexShrink: 0 }}>◆</span>
              <span
                style={{
                  flex: 1,
                  textDecoration: todo.is_completed ? "line-through" : undefined,
                }}
              >
                {todo.title}
              </span>
              {todo.due_date && (
                <span style={{ fontSize: "0.75em", opacity: 0.5, fontStyle: "italic", flexShrink: 0 }}>
                  {new Date(todo.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: "0.8em", opacity: 0.5, fontStyle: "italic" }}>Nothing on the list.</p>
      )}
    </div>
  );
}
