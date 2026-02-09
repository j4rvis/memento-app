import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichUrl } from "@/modules/articles/lib/enricher";

// PWA Share Target handler
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Find the user's owner instance
  const { data: membership } = await supabase
    .from("instance_memberships")
    .select("instance_id, role, instances(slug)")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.redirect(new URL("/i", request.url));
  }

  const instanceId = membership.instance_id;
  const instanceSlug = (membership.instances as unknown as { slug: string }).slug;

  const formData = await request.formData();
  const sharedTitle = (formData.get("title") as string) || undefined;
  const sharedText =
    (formData.get("url") as string) ||
    (formData.get("text") as string) ||
    (formData.get("title") as string);

  if (!sharedText) {
    return NextResponse.redirect(new URL(`/i/${instanceSlug}/articles`, request.url));
  }

  // Extract URL from text that might contain a URL, strip trailing punctuation
  const urlMatch = sharedText.match(/https?:\/\/[^\s]+/);
  const url = urlMatch ? urlMatch[0].replace(/[.,;:!?)]+$/, "") : sharedText;

  // Duplicate detection
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("instance_id", instanceId)
    .eq("url", url)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.redirect(
      new URL(`/i/${instanceSlug}/articles/${existing.id}`, request.url)
    );
  }

  const enriched = await enrichUrl(url, { sharedTitle });

  await supabase.from("articles").insert({
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

  return NextResponse.redirect(new URL(`/i/${instanceSlug}/articles`, request.url));
}
