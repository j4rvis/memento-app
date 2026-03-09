"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";
import { syncAccount } from "./lib/sync";

export async function listGoogleAccounts(slug: string) {
  const supabase = await createClient();
  const instanceId = await getInstanceIdFromSlug(slug);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("google_accounts")
    .select("id, google_email, scopes, synced_at:updated_at, token_expires_at")
    .eq("instance_id", instanceId)
    .eq("user_id", user.id)
    .order("created_at");

  return data ?? [];
}

export async function syncGoogleAccount(slug: string, accountId: string) {
  const supabase = await createClient();
  const instanceId = await getInstanceIdFromSlug(slug);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership
  const { data: account } = await supabase
    .from("google_accounts")
    .select("id")
    .eq("id", accountId)
    .eq("instance_id", instanceId)
    .eq("user_id", user.id)
    .single();

  if (!account) throw new Error("Account not found");

  await syncAccount(accountId);
  revalidatePath(`/i/${slug}/settings`);
}

export async function disconnectGoogleAccount(slug: string, accountId: string) {
  const supabase = await createClient();
  const instanceId = await getInstanceIdFromSlug(slug);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("google_accounts")
    .delete()
    .eq("id", accountId)
    .eq("instance_id", instanceId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/settings`);
}
