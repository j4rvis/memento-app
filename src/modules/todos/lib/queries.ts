import { createClient } from "@/lib/supabase/client";

export async function fetchTodos(instanceId: string, projectFilter?: string) {
  const supabase = createClient();
  let query = supabase
    .from("todos")
    .select("*, todo_projects(id, name, color)")
    .eq("instance_id", instanceId)
    .order("is_completed", { ascending: true })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (projectFilter) {
    query = query.eq("project_id", projectFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchTodoProjects(instanceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("todo_projects")
    .select("*")
    .eq("instance_id", instanceId)
    .order("name");
  if (error) throw error;
  return data;
}
