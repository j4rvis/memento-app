import { createClient } from "@/lib/supabase/client";

export async function fetchNotes(instanceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("instance_id", instanceId)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}
