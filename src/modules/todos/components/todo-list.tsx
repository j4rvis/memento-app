"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TodoItem } from "./todo-item";

type Filter = "all" | "active" | "completed";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  priority: number;
}

export function TodoList({ todos }: { todos: Todo[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = todos.filter((todo) => {
    if (filter === "active") return !todo.is_completed;
    if (filter === "completed") return todo.is_completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.is_completed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["all", "active", "completed"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          {activeCount} remaining
        </span>
      </div>

      <div className="space-y-2">
        {filtered.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    </div>
  );
}
