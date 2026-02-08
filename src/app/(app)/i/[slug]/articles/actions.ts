"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";
import { scrapeArticle } from "@/modules/articles/lib/scraper";
import { extractYouTubeId, isYouTubeUrl } from "@/modules/articles/lib/youtube";

export async function saveArticle(slug: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);
  const url = formData.get("url") as string;
  const isYoutube = isYouTubeUrl(url);
  const youtubeVideoId = isYoutube ? extractYouTubeId(url) : null;

  let title = url;
  let content = "";
  let excerpt = "";
  let author: string | null = null;
  let siteName: string | null = null;
  let imageUrl: string | null = null;
  let scrapeError: string | null = null;

  if (isYoutube) {
    title = `YouTube Video`;
    if (youtubeVideoId) {
      imageUrl = `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`;
    }
  } else {
    try {
      const scraped = await scrapeArticle(url);
      title = scraped.title;
      content = scraped.content;
      excerpt = scraped.excerpt;
      author = scraped.author;
      siteName = scraped.siteName;
      imageUrl = scraped.imageUrl;
    } catch (err) {
      scrapeError = (err as Error).message;
    }
  }

  const { error } = await supabase.from("articles").insert({
    user_id: user.id,
    instance_id: instanceId,
    url,
    title,
    content,
    excerpt,
    author,
    site_name: siteName,
    image_url: imageUrl,
    content_type: isYoutube ? "youtube" : "article",
    youtube_video_id: youtubeVideoId,
    scraped_at: scrapeError ? null : new Date().toISOString(),
    scrape_error: scrapeError,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/articles`);
}

export async function deleteArticle(slug: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/articles`);
  redirect(`/i/${slug}/articles`);
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
