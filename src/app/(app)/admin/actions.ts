"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export async function enterWorkspace(instanceId: string, slug: string, role: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isSuperAdmin(user.email)) {
    throw new Error("Unauthorized");
  }

  const serviceClient = createServiceRoleClient();

  // Check if already a member
  const { data: existing } = await serviceClient
    .from("instance_memberships")
    .select("id")
    .eq("instance_id", instanceId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Update role
    await serviceClient
      .from("instance_memberships")
      .update({ role })
      .eq("id", existing.id);
  } else {
    // Create membership
    await serviceClient
      .from("instance_memberships")
      .insert({
        instance_id: instanceId,
        user_id: user.id,
        role,
      });
  }

  redirect(`/i/${slug}`);
}
