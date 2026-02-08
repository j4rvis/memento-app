"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";

export async function createNote(slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);

  const { data, error } = await supabase
    .from("notes")
    .insert({ user_id: user.id, instance_id: instanceId, title: "Untitled Note" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/i/${slug}/notes/${data.id}`);
}

export async function updateNote(slug: string, id: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  const { error } = await supabase
    .from("notes")
    .update({ title, content })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/notes`);
  revalidatePath(`/i/${slug}/notes/${id}`);
}

export async function deleteNote(slug: string, id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/notes`);
  redirect(`/i/${slug}/notes`);
}

export async function togglePin(slug: string, id: string) {
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
  revalidatePath(`/i/${slug}/notes`);
}
