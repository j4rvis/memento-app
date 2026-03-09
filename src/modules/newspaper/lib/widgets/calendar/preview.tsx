"use client";

import type { WidgetPreviewProps } from "../types";

export function CalendarPreview({ block }: WidgetPreviewProps) {
  const todos = (block.data as Array<{
    title: string;
    due_date: string;
    priority: number;
    is_completed: boolean;
  }>) || [];

  const grouped: Record<string, typeof todos> = {};
  for (const todo of todos) {
    const day = todo.due_date;
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(todo);
  }
  const days = Object.keys(grouped).sort();

  return (
    <div>
      <h3 className="font-semibold mb-2">{block.title}</h3>
      {days.length > 0 ? (
        <div className="space-y-3">
          {days.map((day) => (
            <div key={day}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {new Date(day).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </p>
              <ul className="space-y-0.5">
                {grouped[day].map((todo, i) => (
                  <li key={i} className="text-sm flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                    {todo.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No upcoming items</p>
      )}
    </div>
  );
}
