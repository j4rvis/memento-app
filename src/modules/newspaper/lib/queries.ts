import { createClient } from "@/lib/supabase/client";

export async function fetchNewspapers(instanceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("newspapers")
    .select("*, newspaper_blocks(count)")
    .eq("instance_id", instanceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
