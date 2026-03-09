"use client";

import { formatDate } from "@/lib/format";
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
      <h3 className="font-semibold mb-2">{block.title}</h3>
      {todos.length > 0 ? (
        <ul className="space-y-1">
          {todos.map((todo, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className={todo.is_completed ? "line-through" : ""}>{todo.title}</span>
              {todo.due_date && (
                <span className="text-xs text-muted-foreground">
                  (due {formatDate(todo.due_date)})
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No todos</p>
      )}
    </div>
  );
}
