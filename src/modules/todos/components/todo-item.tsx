"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toggleTodo, updateTodo, deleteTodo } from "@/app/(app)/todos/actions";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  priority: number;
}

const priorityColors: Record<number, string> = {
  0: "",
  1: "border-l-blue-500",
  2: "border-l-yellow-500",
  3: "border-l-red-500",
};

const priorityLabels: Record<number, string> = {
  0: "None",
  1: "Low",
  2: "Medium",
  3: "High",
};

export function TodoItem({ todo }: { todo: Todo }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <form
        action={async (formData) => {
          await updateTodo(todo.id, formData);
          setIsEditing(false);
        }}
        className="flex items-center gap-2 rounded-lg border p-3"
      >
        <Input name="title" defaultValue={todo.title} required autoFocus />
        <select
          name="priority"
          defaultValue={todo.priority}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          {[0, 1, 2, 3].map((p) => (
            <option key={p} value={p}>{priorityLabels[p]}</option>
          ))}
        </select>
        <Input
          name="due_date"
          type="date"
          defaultValue={todo.due_date ?? ""}
          className="w-36"
        />
        <Button type="submit" size="icon" variant="ghost">
          <Check className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
          <X className="h-4 w-4" />
        </Button>
      </form>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-l-4 p-3",
        priorityColors[todo.priority],
        todo.is_completed && "opacity-50"
      )}
    >
      <button
        onClick={() => toggleTodo(todo.id)}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
          todo.is_completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground"
        )}
      >
        {todo.is_completed && <Check className="h-3 w-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("font-medium", todo.is_completed && "line-through")}>
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-sm text-muted-foreground">{todo.description}</p>
        )}
        {todo.due_date && (
          <p className="text-xs text-muted-foreground">
            Due: {new Date(todo.due_date).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => deleteTodo(todo.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
