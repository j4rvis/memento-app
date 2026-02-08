"use client";

import { useState, useOptimistic } from "react";
import { Button } from "@/components/ui/button";
import { TodoItem } from "./todo-item";
import { toggleTodo } from "@/app/(app)/i/[slug]/todos/actions";

type Filter = "all" | "active" | "completed";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  priority: number;
  todo_projects: { id: string; name: string; color: string } | null;
}

export function TodoList({ todos, slug }: { todos: Todo[]; slug: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [optimisticTodos, setOptimisticTodo] = useOptimistic(
    todos,
    (state, toggledId: string) =>
      state.map((t) =>
        t.id === toggledId ? { ...t, is_completed: !t.is_completed } : t
      )
  );

  async function handleToggle(id: string) {
    setOptimisticTodo(id);
    await toggleTodo(slug, id);
  }

  const filtered = optimisticTodos.filter((todo) => {
    if (filter === "active") return !todo.is_completed;
    if (filter === "completed") return todo.is_completed;
    return true;
  });

  const activeCount = optimisticTodos.filter((t) => !t.is_completed).length;

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
          <TodoItem key={todo.id} todo={todo} slug={slug} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  );
}
