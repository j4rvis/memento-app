import { createClient } from "@/lib/supabase/client";

export async function fetchArticleCounts(instanceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id, category")
    .eq("instance_id", instanceId)
    .eq("is_archived", false);
  if (error) throw error;
  return data;
}

export async function fetchArticles(instanceId: string, category?: string) {
  const supabase = createClient();
  let query = supabase
    .from("articles")
    .select("*")
    .eq("instance_id", instanceId)
    .eq("is_archived", false);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
