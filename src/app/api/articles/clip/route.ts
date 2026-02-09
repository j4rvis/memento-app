import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseHtml } from "@/modules/articles/lib/scraper";
import { isYouTubeUrl, extractYouTubeId, fetchYouTubeOEmbed } from "@/modules/articles/lib/youtube";
import { detectPlatform, platformDisplayName } from "@/modules/articles/lib/platforms";

interface ClipRequest {
  url: string;
  html: string;
  instance_id?: string;
  meta: {
    title?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogSiteName?: string;
    author?: string;
  };
}

export async function POST(request: NextRequest) {
  // Auth via Bearer token
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authorization } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Parse request body
  let body: ClipRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { url, html, meta, instance_id } = body;
  if (!url || !html) {
    return NextResponse.json({ error: "url and html are required" }, { status: 400 });
  }

  // Resolve instance: use provided instance_id or fall back to owner instance
  let instanceId: string;

  if (instance_id) {
    // Validate that user is a member of the requested instance
    const { data: membership } = await supabase
      .from("instance_memberships")
      .select("instance_id")
      .eq("user_id", user.id)
      .eq("instance_id", instance_id)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this instance" }, { status: 403 });
    }

    instanceId = membership.instance_id;
  } else {
    // Fall back to owner instance
    const { data: membership } = await supabase
      .from("instance_memberships")
      .select("instance_id")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "No instance found" }, { status: 404 });
    }

    instanceId = membership.instance_id;
  }

  // Duplicate detection
  const { data: existing } = await supabase
    .from("articles")
    .select("id, title")
    .eq("instance_id", instanceId)
    .eq("url", url)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      existing: existing.id,
      title: existing.title,
      url,
    });
  }

  // Determine content type
  let title = meta.ogTitle || meta.title || url;
  let content = "";
  let excerpt = meta.ogDescription || "";
  let author: string | null = meta.author || null;
  let siteName: string | null = meta.ogSiteName || null;
  let imageUrl: string | null = meta.ogImage || null;
  let contentType: "article" | "youtube" | "other" = "article";
  let youtubeVideoId: string | null = null;
  let scrapeError: string | null = null;

  if (isYouTubeUrl(url)) {
    contentType = "youtube";
    youtubeVideoId = extractYouTubeId(url);
    const oembed = await fetchYouTubeOEmbed(url);
    if (oembed) {
      title = oembed.title || title;
      author = oembed.author_name || author;
      imageUrl = oembed.thumbnail_url || imageUrl;
    }
    siteName = "YouTube";
  } else if (detectPlatform(url)) {
    contentType = "other";
    siteName = siteName || platformDisplayName(detectPlatform(url)!);
    // Try parsing HTML for social platforms too
    try {
      const parsed = parseHtml(html, url);
      if (parsed.content) content = parsed.content;
      if (parsed.excerpt) excerpt = parsed.excerpt || excerpt;
      title = parsed.title || title;
      author = parsed.author || author;
      siteName = parsed.siteName || siteName;
      imageUrl = parsed.imageUrl || imageUrl;
    } catch {
      // Social pages often fail Readability — that's fine, we have meta
    }
  } else {
    // Regular article — parse with Readability
    try {
      const parsed = parseHtml(html, url);
      title = parsed.title || title;
      content = parsed.content;
      excerpt = parsed.excerpt || excerpt;
      author = parsed.author || author;
      siteName = parsed.siteName || siteName;
      imageUrl = parsed.imageUrl || imageUrl;
    } catch {
      scrapeError = "Could not parse article content";
    }
  }

  const { data: article, error: insertError } = await supabase
    .from("articles")
    .insert({
      user_id: user.id,
      instance_id: instanceId,
      url,
      title,
      content,
      excerpt,
      author,
      site_name: siteName,
      image_url: imageUrl,
      content_type: contentType,
      youtube_video_id: youtubeVideoId,
      scraped_at: scrapeError ? null : new Date().toISOString(),
      scrape_error: scrapeError,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to save article" }, { status: 500 });
  }

  return NextResponse.json({ id: article.id, title, url });
}
