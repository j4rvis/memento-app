import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { TodosPageClient } from "@/modules/todos/components/todos-page-client";

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
    <TodosPageClient
      initialTodos={todos ?? []}
      initialProjects={projects ?? []}
      projectFilter={projectFilter}
    />
  );
}
