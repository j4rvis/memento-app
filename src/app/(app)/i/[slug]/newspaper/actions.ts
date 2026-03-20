"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";
import type { NewspaperConfig } from "@/modules/newspaper/lib/types";

export async function listTemplates(slug: string) {
  const supabase = await createClient();
  const instanceId = await getInstanceIdFromSlug(slug);

  const { data, error } = await supabase
    .from("newspaper_templates")
    .select("id, name, created_at, updated_at")
    .eq("instance_id", instanceId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTemplate(slug: string, name: string): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);

  const defaultConfig: NewspaperConfig = {
    title: name,
    pages: [{ layout: "single", blocks: [] }],
  };

  const { data, error } = await supabase
    .from("newspaper_templates")
    .insert({
      instance_id: instanceId,
      user_id: user.id,
      name,
      config: defaultConfig,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper`);
  return data.id;
}

export async function updateTemplate(slug: string, id: string, config: NewspaperConfig) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("newspaper_templates")
    .update({ config })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper`);
  revalidatePath(`/i/${slug}/newspaper/${id}`);
}

export async function renameTemplate(slug: string, id: string, name: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("newspaper_templates")
    .update({ name })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper`);
  revalidatePath(`/i/${slug}/newspaper/${id}`);
}

export async function deleteTemplate(slug: string, id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("newspaper_templates")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper`);
  redirect(`/i/${slug}/newspaper`);
}
