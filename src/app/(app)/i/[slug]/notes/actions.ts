"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";

export async function createNote(slug: string, folderId?: string | null): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      instance_id: instanceId,
      title: "Untitled Note",
      folder_id: folderId ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/notes`);
  return data.id;
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
}

export async function deleteNote(slug: string, id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/notes`);
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

export async function createFolder(slug: string, name: string): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);

  const { data, error } = await supabase
    .from("note_folders")
    .insert({ user_id: user.id, instance_id: instanceId, name })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/notes`);
  return data.id;
}

export async function renameFolder(slug: string, id: string, name: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("note_folders")
    .update({ name })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/notes`);
}

export async function deleteFolder(slug: string, id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("note_folders").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/notes`);
}
