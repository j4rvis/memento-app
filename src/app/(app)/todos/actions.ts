"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addTodo(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const priority = parseInt(formData.get("priority") as string) || 0;
  const dueDate = (formData.get("due_date") as string) || null;

  const { error } = await supabase.from("todos").insert({
    user_id: user.id,
    title,
    description,
    priority,
    due_date: dueDate || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/todos");
}

export async function toggleTodo(id: string) {
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
  revalidatePath("/todos");
}

export async function updateTodo(id: string, formData: FormData) {
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
  revalidatePath("/todos");
}

export async function deleteTodo(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/todos");
}
