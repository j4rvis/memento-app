import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeArticle } from "@/modules/articles/lib/scraper";
import { extractYouTubeId, isYouTubeUrl } from "@/modules/articles/lib/youtube";

// PWA Share Target handler
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const sharedUrl = (formData.get("url") as string) ||
    (formData.get("text") as string) ||
    (formData.get("title") as string);

  if (!sharedUrl) {
    return NextResponse.redirect(new URL("/articles", request.url));
  }

  // Extract URL from text that might contain a URL
  const urlMatch = sharedUrl.match(/https?:\/\/[^\s]+/);
  const url = urlMatch ? urlMatch[0] : sharedUrl;

  const isYoutube = isYouTubeUrl(url);
  const youtubeVideoId = isYoutube ? extractYouTubeId(url) : null;

  let title = url;
  let content = "";
  let excerpt = "";
  let author: string | null = null;
  let siteName: string | null = null;
  let imageUrl: string | null = null;

  if (isYoutube && youtubeVideoId) {
    title = "YouTube Video";
    imageUrl = `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`;
  } else {
    try {
      const scraped = await scrapeArticle(url);
      title = scraped.title;
      content = scraped.content;
      excerpt = scraped.excerpt;
      author = scraped.author;
      siteName = scraped.siteName;
      imageUrl = scraped.imageUrl;
    } catch {
      // Save with minimal data if scraping fails
    }
  }

  await supabase.from("articles").insert({
    user_id: user.id,
    url,
    title,
    content,
    excerpt,
    author,
    site_name: siteName,
    image_url: imageUrl,
    content_type: isYoutube ? "youtube" : "article",
    youtube_video_id: youtubeVideoId,
    scraped_at: new Date().toISOString(),
  });

  return NextResponse.redirect(new URL("/articles", request.url));
}
