"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";

function generateClientId(): string {
  return "mc_" + randomBytes(16).toString("hex");
}

function generateSecret(): string {
  return randomBytes(32).toString("hex"); // 64 hex chars = 256 bits
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function listApiClients(slug: string) {
  const instanceId = await getInstanceIdFromSlug(slug);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("api_clients")
    .select("id, client_id, name, scopes, is_active, last_used_at, created_at")
    .eq("instance_id", instanceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createApiClient(
  slug: string,
  { name, scopes }: { name: string; scopes: string[] }
): Promise<{ clientId: string; clientSecret: string }> {
  const instanceId = await getInstanceIdFromSlug(slug);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const serviceClient = createServiceRoleClient();
  const clientId = generateClientId();
  const rawSecret = generateSecret();
  const secretHash = sha256(rawSecret);

  const { error } = await serviceClient.from("api_clients").insert({
    client_id: clientId,
    client_secret_hash: secretHash,
    instance_id: instanceId,
    user_id: user.id,
    name,
    scopes,
    is_active: true,
  });

  if (error) throw error;

  revalidatePath(`/i/${slug}/settings/api`);
  return { clientId, clientSecret: rawSecret };
}

export async function revokeApiClient(slug: string, clientId: string): Promise<void> {
  const instanceId = await getInstanceIdFromSlug(slug);
  const serviceClient = createServiceRoleClient();

  const { error } = await serviceClient
    .from("api_clients")
    .update({ is_active: false })
    .eq("id", clientId)
    .eq("instance_id", instanceId);

  if (error) throw error;

  revalidatePath(`/i/${slug}/settings/api`);
}
