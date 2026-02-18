"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";
import { enrichUrl } from "@/modules/articles/lib/enricher";

export async function saveArticle(slug: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);
  const url = formData.get("url") as string;

  // Duplicate detection
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("instance_id", instanceId)
    .eq("url", url)
    .limit(1)
    .maybeSingle();

  if (existing) {
    redirect(`/i/${slug}/articles/${existing.id}`);
  }

  const enriched = await enrichUrl(url);

  const { error } = await supabase.from("articles").insert({
    user_id: user.id,
    instance_id: instanceId,
    url: enriched.url,
    title: enriched.title,
    content: enriched.content,
    excerpt: enriched.excerpt,
    author: enriched.author,
    site_name: enriched.siteName,
    image_url: enriched.imageUrl,
    content_type: enriched.contentType,
    youtube_video_id: enriched.youtubeVideoId,
    scraped_at: enriched.scrapeError ? null : new Date().toISOString(),
    scrape_error: enriched.scrapeError,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/articles`);
}

export async function updateArticle(slug: string, id: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const tagId = (formData.get("tag_id") as string)?.trim() || null;

  const { error } = await supabase
    .from("articles")
    .update({ title: title || null, content: content || null, tag_id: tagId })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/articles`);
  revalidatePath(`/i/${slug}/articles/${id}`);
}

export async function setArticleTag(slug: string, id: string, tagId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .update({ tag_id: tagId })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/articles`);
  revalidatePath(`/i/${slug}/articles/${id}`);
}

export async function deleteArticle(slug: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/articles`);
}

export async function toggleRead(slug: string, id: string) {
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("is_read")
    .eq("id", id)
    .single();

  if (!article) throw new Error("Article not found");

  const { error } = await supabase
    .from("articles")
    .update({ is_read: !article.is_read })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/articles`);
}

export async function toggleArchive(slug: string, id: string) {
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("is_archived")
    .eq("id", id)
    .single();

  if (!article) throw new Error("Article not found");

  const { error } = await supabase
    .from("articles")
    .update({ is_archived: !article.is_archived })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/articles`);
}

// ─── Article Tags CRUD ────────────────────────────────────────────────────────

export async function createTag(slug: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);

  const { data, error } = await supabase
    .from("article_tags")
    .insert({ name, instance_id: instanceId, user_id: user.id })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/articles`);
  return data.id as string;
}

export async function renameTag(slug: string, id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("article_tags")
    .update({ name })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/articles`);
}

export async function deleteTag(slug: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("article_tags")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/articles`);
}
