"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";

export async function updateInstance(slug: string, formData: FormData) {
  const supabase = await createClient();
  const instanceId = await getInstanceIdFromSlug(slug);

  const name = formData.get("name") as string;
  const newSlug = formData.get("slug") as string;

  const { error } = await supabase
    .from("instances")
    .update({ name, slug: newSlug })
    .eq("id", instanceId);

  if (error) throw new Error(error.message);

  if (newSlug !== slug) {
    redirect(`/i/${newSlug}/settings`);
  }
  revalidatePath(`/i/${slug}/settings`);
}

export async function updateFeatures(slug: string, formData: FormData) {
  const supabase = await createClient();
  const instanceId = await getInstanceIdFromSlug(slug);

  const features = {
    todos: formData.get("todos") === "on",
    notes: formData.get("notes") === "on",
    feeds: formData.get("feeds") === "on",
    articles: formData.get("articles") === "on",
    newspaper: formData.get("newspaper") === "on",
  };

  const { error } = await supabase
    .from("instances")
    .update({ settings: { features } })
    .eq("id", instanceId);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}`);
}

export async function removeMember(slug: string, membershipId: string) {
  const supabase = await createClient();
  await getInstanceIdFromSlug(slug); // validates access

  const { error } = await supabase
    .from("instance_memberships")
    .delete()
    .eq("id", membershipId);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/settings/members`);
}

export async function updateMemberRole(
  slug: string,
  membershipId: string,
  role: "admin" | "member"
) {
  const supabase = await createClient();
  await getInstanceIdFromSlug(slug);

  const { error } = await supabase
    .from("instance_memberships")
    .update({ role })
    .eq("id", membershipId);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/settings/members`);
}
