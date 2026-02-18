import { createClient } from "@/lib/supabase/client";

export async function fetchArticles(instanceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("instance_id", instanceId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchArticleTags(instanceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("article_tags")
    .select("*")
    .eq("instance_id", instanceId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}
