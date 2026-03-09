"use client";

import type { WidgetPreviewProps } from "../types";

interface TodoItem {
  title: string;
  due_date: string;
  priority: number;
  is_completed: boolean;
}

export function CalendarPreview({ block }: WidgetPreviewProps) {
  const todos = (block.data as TodoItem[]) || [];

  // Group by date
  const grouped: Record<string, TodoItem[]> = {};
  for (const todo of todos) {
    if (!grouped[todo.due_date]) grouped[todo.due_date] = [];
    grouped[todo.due_date].push(todo);
  }
  const days = Object.keys(grouped).sort();

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

      {days.length > 0 ? (
        <div>
          {days.map((day, di) => {
            // Parse as local date (avoid UTC offset issues)
            const [year, month, d] = day.split("-").map(Number);
            const date = new Date(year, month - 1, d);
            const dayNum = date.toLocaleDateString("en-US", { day: "numeric" });
            const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
            const monthName = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div
                key={day}
                style={{
                  marginBottom: "0.9rem",
                  paddingBottom: di < days.length - 1 ? "0.9rem" : 0,
                  borderBottom: di < days.length - 1 ? "1px solid currentColor" : undefined,
                  opacity: di < days.length - 1 ? 1 : 0.85,
                }}
              >
                {/* Day header — appointment-book style */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.5rem",
                    marginBottom: "0.45rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.6em",
                      fontWeight: 900,
                      lineHeight: 1,
                      fontFamily: "'Playfair Display', Georgia, serif",
                      opacity: isToday ? 1 : 0.85,
                    }}
                  >
                    {dayNum}
                  </span>
                  <div>
                    <p
                      style={{
                        fontSize: "0.6em",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        lineHeight: 1,
                        opacity: 0.7,
                      }}
                    >
                      {dayName}
                    </p>
                    <p
                      style={{
                        fontSize: "0.55em",
                        letterSpacing: "0.08em",
                        opacity: 0.45,
                        lineHeight: 1,
                      }}
                    >
                      {monthName}
                      {isToday && (
                        <span style={{ marginLeft: "0.4em", fontStyle: "italic" }}>Today</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Events */}
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {grouped[day].map((todo, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "0.35rem",
                        fontSize: "0.8em",
                        lineHeight: 1.5,
                        paddingLeft: "0.75rem",
                        opacity: todo.is_completed ? 0.4 : 1,
                      }}
                    >
                      <span style={{ opacity: 0.35, fontSize: "0.7em", flexShrink: 0 }}>◆</span>
                      <span
                        style={{
                          textDecoration: todo.is_completed ? "line-through" : undefined,
                        }}
                      >
                        {todo.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ fontSize: "0.8em", opacity: 0.5, fontStyle: "italic" }}>
          Nothing scheduled. A blank page is a gift.
        </p>
      )}
    </div>
  );
}
