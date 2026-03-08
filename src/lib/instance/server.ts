import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Instance, InstanceRole, InstanceSettings } from "./types";

export const resolveInstance = cache(async function resolveInstance(slug: string): Promise<{
  instance: Instance;
  role: InstanceRole;
}> {
  const supabase = await createClient();

  // Single query: join instances + instance_memberships.
  // RLS on instance_memberships (user_id = auth.uid()) filters to current user.
  // !inner means null result → notFound if user has no membership.
  const { data } = await supabase
    .from("instances")
    .select("*, instance_memberships!inner(role)")
    .eq("slug", slug)
    .single();

  if (!data) notFound();

  const memberships = data.instance_memberships as Array<{ role: InstanceRole }>;
  const membership = memberships[0];
  if (!membership) notFound();

  return {
    instance: {
      id: data.id,
      name: data.name,
      slug: data.slug,
      owner_id: data.owner_id,
      settings: data.settings as InstanceSettings,
      created_at: data.created_at,
      updated_at: data.updated_at,
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
