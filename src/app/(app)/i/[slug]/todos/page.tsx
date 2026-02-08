import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { TodoList } from "@/modules/todos/components/todo-list";
import { AddTodoForm } from "@/modules/todos/components/add-todo-form";
import { ProjectManager } from "@/modules/todos/components/project-manager";
import { ProjectFilter } from "@/modules/todos/components/project-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { CheckSquare } from "lucide-react";

export default async function TodosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  const { slug } = await params;
  const { project: projectFilter } = await searchParams;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("todo_projects")
    .select("*")
    .eq("instance_id", instance.id)
    .order("name");

  let todosQuery = supabase
    .from("todos")
    .select("*, todo_projects(id, name, color)")
    .eq("instance_id", instance.id)
    .order("is_completed", { ascending: true })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (projectFilter) {
    todosQuery = todosQuery.eq("project_id", projectFilter);
  }

  const { data: todos } = await todosQuery;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold">Todos</h1>
        <RefreshButton />
        <div className="flex-1" />
        <ProjectManager projects={projects ?? []} slug={slug} />
      </div>
      <ProjectFilter projects={projects ?? []} activeProject={projectFilter} slug={slug} />
      <AddTodoForm slug={slug} projects={projects ?? []} />
      {todos && todos.length > 0 ? (
        <TodoList todos={todos} slug={slug} />
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
