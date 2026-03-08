import { createClient } from "@/lib/supabase/client";

export async function fetchArticles(instanceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, url, excerpt, author, site_name, content_type, category, tag_id, youtube_video_id, is_read, is_archived, created_at, instance_id, user_id")
    .eq("instance_id", instanceId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function fetchArticleContent(instanceId: string, articleId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id, content")
    .eq("id", articleId)
    .eq("instance_id", instanceId)
    .single();
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
