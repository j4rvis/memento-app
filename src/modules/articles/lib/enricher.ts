import { extractYouTubeId, isYouTubeUrl, fetchYouTubeOEmbed } from "./youtube";
import { detectPlatform, platformDisplayName } from "./platforms";
import { scrapeArticle, scrapeMetaTags } from "./scraper";

export interface EnrichedArticle {
  url: string;
  title: string;
  content: string;
  excerpt: string;
  author: string | null;
  siteName: string | null;
  imageUrl: string | null;
  contentType: "article" | "youtube" | "other";
  youtubeVideoId: string | null;
  scrapeError: string | null;
}

function parseInstagramSharedText(text: string): { title: string; content: string } | null {
  // Pattern: "Account on Instagram: "Post content here...""
  const igMatch = text.match(
    new RegExp('^(.+?)\\s+on\\s+Instagram:\\s*["\u201c](.+)["\u201d]$', 's')
  );
  if (igMatch) {
    return { title: igMatch[1].trim(), content: igMatch[2].trim() };
  }
  // Fallback: split at first colon
  const colonIdx = text.indexOf(":");
  if (colonIdx > 0 && colonIdx < text.length - 1) {
    return { title: text.slice(0, colonIdx).trim(), content: text.slice(colonIdx + 1).trim() };
  }
  return null;
}

export async function enrichUrl(
  url: string,
  options?: { sharedTitle?: string; sharedText?: string }
): Promise<EnrichedArticle> {
  const sharedTitle = options?.sharedTitle;
  const sharedText = options?.sharedText;

  // YouTube
  if (isYouTubeUrl(url)) {
    const videoId = extractYouTubeId(url);
    const oembed = await fetchYouTubeOEmbed(url);

    return {
      url,
      title: oembed?.title ?? sharedTitle ?? "YouTube Video",
      content: "",
      excerpt: "",
      author: oembed?.author_name ?? null,
      siteName: "YouTube",
      imageUrl:
        oembed?.thumbnail_url ??
        (videoId
          ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          : null),
      contentType: "youtube",
      youtubeVideoId: videoId,
      scrapeError: null,
    };
  }

  // Social media platforms — use lightweight meta scraping
  const platform = detectPlatform(url);
  if (platform) {
    // Parse shared text for Instagram (e.g. "Account on Instagram: "recipe content"")
    const parsed = sharedText ? parseInstagramSharedText(sharedText) : null;

    try {
      const meta = await scrapeMetaTags(url);
      return {
        url,
        title: parsed?.title ?? meta.title ?? sharedTitle ?? url,
        content: parsed?.content ?? "",
        excerpt: meta.description ?? "",
        author: null,
        siteName: meta.siteName ?? platformDisplayName(platform),
        imageUrl: meta.imageUrl,
        contentType: "other",
        youtubeVideoId: null,
        scrapeError: null,
      };
    } catch {
      return {
        url,
        title: parsed?.title ?? sharedTitle ?? url,
        content: parsed?.content ?? "",
        excerpt: "",
        author: null,
        siteName: platformDisplayName(platform),
        imageUrl: null,
        contentType: "other",
        youtubeVideoId: null,
        scrapeError: "Failed to fetch metadata",
      };
    }
  }

  // Regular article — full Readability scrape
  try {
    const scraped = await scrapeArticle(url);
    return {
      url,
      title: scraped.title || sharedTitle || url,
      content: scraped.content,
      excerpt: scraped.excerpt,
      author: scraped.author,
      siteName: scraped.siteName,
      imageUrl: scraped.imageUrl,
      contentType: "article",
      youtubeVideoId: null,
      scrapeError: null,
    };
  } catch (err) {
    return {
      url,
      title: sharedTitle ?? url,
      content: "",
      excerpt: "",
      author: null,
      siteName: null,
      imageUrl: null,
      contentType: "article",
      youtubeVideoId: null,
      scrapeError: (err as Error).message,
    };
  }
}
