"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";
import { randomBytes, createHash } from "crypto";

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

export async function createApiKey(
  slug: string,
  { name, scopes }: { name: string; scopes: string[] }
): Promise<{ rawKey: string }> {
  const instanceId = await getInstanceIdFromSlug(slug);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const rawKey = "mnp_" + randomBytes(32).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const serviceClient = createServiceRoleClient();
  const { error } = await serviceClient.from("newspaper_api_keys").insert({
    instance_id: instanceId,
    user_id: user.id,
    name,
    key_hash: keyHash,
    scopes,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/settings`);
  return { rawKey };
}

export async function revokeApiKey(slug: string, keyId: string) {
  await getInstanceIdFromSlug(slug); // validates access
  const supabase = await createClient();

  const { error } = await supabase
    .from("newspaper_api_keys")
    .delete()
    .eq("id", keyId);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/settings`);
}

export async function disconnectExternalConnection(
  slug: string,
  connectionId: string
) {
  const instanceId = await getInstanceIdFromSlug(slug);
  const supabase = createServiceRoleClient();
  await supabase
    .from("external_connections")
    .delete()
    .eq("id", connectionId)
    .eq("instance_id", instanceId);
  revalidatePath(`/i/${slug}/settings/integrations`);
}
