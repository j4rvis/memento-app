import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Instance, InstanceRole, InstanceSettings } from "./types";

export const resolveInstance = cache(async function resolveInstance(slug: string): Promise<{
  instance: Instance;
  role: InstanceRole;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: instance } = await supabase
    .from("instances")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!instance) notFound();

  const { data: membership } = await supabase
    .from("instance_memberships")
    .select("role")
    .eq("instance_id", instance.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  return {
    instance: {
      ...instance,
      settings: instance.settings as InstanceSettings,
    },
    role: membership.role,
  };
});

export const getInstanceIdFromSlug = cache(async function getInstanceIdFromSlug(slug: string): Promise<string> {
  const supabase = await createClient();

  const { data: instance } = await supabase
    .from("instances")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!instance) throw new Error("Instance not found");
  return instance.id;
});
