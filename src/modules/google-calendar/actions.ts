"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";
import { syncAccount, syncCalendarList } from "./lib/sync";
import { revalidatePath } from "next/cache";

export async function listGoogleAccounts(slug: string) {
  const instanceId = await getInstanceIdFromSlug(slug);
  const supabase = await createClient();
  const { data } = await supabase
    .from("google_accounts")
    .select("id, google_email, updated_at")
    .eq("instance_id", instanceId)
    .order("created_at");
  return data ?? [];
}

export async function syncGoogleAccount(slug: string, accountId: string) {
  const instanceId = await getInstanceIdFromSlug(slug);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  // Sync calendar list first so the cache is fresh
  await syncCalendarList(accountId, user.id, instanceId);
  await syncAccount(accountId, user.id, instanceId);
  revalidatePath(`/i/${slug}/settings`);
}

export async function disconnectGoogleAccount(slug: string, accountId: string) {
  const instanceId = await getInstanceIdFromSlug(slug);
  const supabase = createServiceRoleClient();
  await supabase
    .from("google_accounts")
    .delete()
    .eq("id", accountId)
    .eq("instance_id", instanceId);
  revalidatePath(`/i/${slug}/settings`);
}

export async function listGoogleCalendars(slug: string, accountId: string) {
  const instanceId = await getInstanceIdFromSlug(slug);
  const supabase = await createClient();
  const { data } = await supabase
    .from("google_calendars")
    .select("google_calendar_id, name, color")
    .eq("google_account_id", accountId)
    .eq("instance_id", instanceId)
    .order("name");
  return data ?? [];
}

export async function syncGoogleCalendars(slug: string, accountId: string) {
  const instanceId = await getInstanceIdFromSlug(slug);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await syncCalendarList(accountId, user.id, instanceId);
  revalidatePath(`/i/${slug}/settings`);
}
