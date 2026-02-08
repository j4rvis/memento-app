"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createNote() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("notes")
    .insert({ user_id: user.id, title: "Untitled Note" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/notes/${data.id}`);
}

export async function updateNote(id: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  const { error } = await supabase
    .from("notes")
    .update({ title, content })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
}

export async function deleteNote(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  redirect("/notes");
}

export async function togglePin(id: string) {
  const supabase = await createClient();

  const { data: note } = await supabase
    .from("notes")
    .select("is_pinned")
    .eq("id", id)
    .single();

  if (!note) throw new Error("Note not found");

  const { error } = await supabase
    .from("notes")
    .update({ is_pinned: !note.is_pinned })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
}
