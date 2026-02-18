"use client";

import { useTodos, useTodoProjects } from "../lib/hooks";
import { TodoList } from "./todo-list";
import { AddTodoForm } from "./add-todo-form";
import { ProjectManager } from "./project-manager";
import { ProjectFilter } from "./project-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { CheckSquare } from "lucide-react";
import { useInstanceSlug } from "@/lib/instance/context";

export function TodosPageClient({
  initialTodos,
  initialProjects,
  projectFilter,
}: {
  initialTodos: unknown[];
  initialProjects: unknown[];
  projectFilter?: string;
}) {
  const slug = useInstanceSlug();
  const { data: todos } = useTodos(projectFilter, initialTodos);
  const { data: projects } = useTodoProjects(initialProjects);
  const displayTodos = (todos ?? initialTodos) as {
    id: string;
    title: string;
    description: string | null;
    is_completed: boolean;
    due_date: string | null;
    priority: number;
    todo_projects: { id: string; name: string; color: string } | null;
  }[];
  const displayProjects = (projects ?? initialProjects) as {
    id: string;
    name: string;
    color: string;
    is_shared: boolean;
  }[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold">Todos</h1>
        <RefreshButton />
        <div className="flex-1" />
        <ProjectManager projects={displayProjects} slug={slug} />
      </div>
      <ProjectFilter projects={displayProjects} activeProject={projectFilter} slug={slug} />
      <AddTodoForm slug={slug} projects={displayProjects} />
      {displayTodos.length > 0 ? (
        <TodoList todos={displayTodos} slug={slug} />
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="No todos yet"
          description="Add your first todo to get started."
        />
      )}
    </div>
  );
}
