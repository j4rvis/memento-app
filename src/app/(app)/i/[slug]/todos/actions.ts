"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";

export async function addTodo(slug: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const priority = parseInt(formData.get("priority") as string) || 0;
  const dueDate = (formData.get("due_date") as string) || null;

  const projectId = (formData.get("project_id") as string) || null;

  const { error } = await supabase.from("todos").insert({
    user_id: user.id,
    instance_id: instanceId,
    title,
    description,
    priority,
    due_date: dueDate || null,
    project_id: projectId || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/todos`);
}

export async function toggleTodo(slug: string, id: string) {
  const supabase = await createClient();

  const { data: todo } = await supabase
    .from("todos")
    .select("is_completed")
    .eq("id", id)
    .single();

  if (!todo) throw new Error("Todo not found");

  const { error } = await supabase
    .from("todos")
    .update({ is_completed: !todo.is_completed })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/todos`);
}

export async function updateTodo(slug: string, id: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const priority = parseInt(formData.get("priority") as string) || 0;
  const dueDate = (formData.get("due_date") as string) || null;

  const { error } = await supabase
    .from("todos")
    .update({
      title,
      description,
      priority,
      due_date: dueDate || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/todos`);
}

export async function deleteTodo(slug: string, id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/todos`);
}

// --- Project actions ---

export async function createProject(slug: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);
  const name = formData.get("name") as string;
  const color = (formData.get("color") as string) || "#6b7280";

  const { error } = await supabase.from("todo_projects").insert({
    user_id: user.id,
    instance_id: instanceId,
    name,
    color,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/todos`);
}

export async function updateProject(slug: string, id: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const color = (formData.get("color") as string) || "#6b7280";
  const isShared = formData.get("is_shared") === "true";

  const { error } = await supabase
    .from("todo_projects")
    .update({ name, color, is_shared: isShared })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/todos`);
}

export async function deleteProject(slug: string, id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("todo_projects").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/todos`);
}
