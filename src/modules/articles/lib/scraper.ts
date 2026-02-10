import * as cheerio from "cheerio";

export interface ScrapedArticle {
  title: string;
  content: string;
  excerpt: string;
  author: string | null;
  siteName: string | null;
  imageUrl: string | null;
}

export interface ScrapedMeta {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

const REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "nav",
  "footer",
  "header",
  "aside",
  "iframe",
  "form",
  '[role="navigation"]',
  '[role="banner"]',
  '[role="complementary"]',
  ".sidebar",
  ".nav",
  ".footer",
  ".header",
  ".ad",
  ".ads",
  ".advertisement",
  ".social-share",
  ".share",
  ".comments",
  ".comment",
  ".related",
].join(", ");

const CONTENT_SELECTORS = [
  "article",
  '[role="main"]',
  "main",
  ".post-content",
  ".article-content",
  ".article-body",
  ".entry-content",
  ".post-body",
  ".story-body",
];

function getMeta(
  $: cheerio.CheerioAPI,
  property: string
): string | null {
  return (
    $(`meta[property="${property}"]`).attr("content") ||
    $(`meta[name="${property}"]`).attr("content") ||
    null
  );
}

export function parseHtml(html: string, url: string): ScrapedArticle {
  const $ = cheerio.load(html);

  // Extract metadata before cleaning
  const imageUrl = getMeta($, "og:image");
  const siteName = getMeta($, "og:site_name");
  const metaAuthor =
    getMeta($, "author") ||
    $('meta[name="author"]').attr("content") ||
    $('[rel="author"]').first().text() ||
    null;
  const metaTitle =
    getMeta($, "og:title") || $("title").text() || null;
  const metaExcerpt =
    getMeta($, "og:description") || getMeta($, "description") || "";

  // Remove non-content elements
  $(REMOVE_SELECTORS).remove();

  // Find main content container
  let contentHtml = "";
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector);
    if (el.length > 0) {
      contentHtml = el.first().html() || "";
      break;
    }
  }

  // Fallback to body
  if (!contentHtml) {
    contentHtml = $("body").html() || "";
  }

  if (!contentHtml) {
    throw new Error("Could not parse article content");
  }

  // Derive title from first h1 inside content, or fall back to meta
  const h1 = $("h1").first().text().trim();
  const title = h1 || metaTitle || "Untitled";

  // Derive excerpt from meta or first paragraph text
  const firstParagraph = $("article p, main p, body p")
    .first()
    .text()
    .trim();
  const excerpt =
    metaExcerpt || (firstParagraph ? firstParagraph.slice(0, 300) : "");

  return {
    title,
    content: contentHtml,
    excerpt,
    author: metaAuthor,
    siteName,
    imageUrl,
  };
}

export async function scrapeArticle(url: string): Promise<ScrapedArticle> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Memento/1.0)",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const html = await response.text();
  return parseHtml(html, url);
}

export async function scrapeMetaTags(url: string): Promise<ScrapedMeta> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Memento/1.0)",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title = getMeta($, "og:title") || $("title").text() || null;
  const description = getMeta($, "og:description") || getMeta($, "description");
  const imageUrl = getMeta($, "og:image");
  const siteName = getMeta($, "og:site_name");

  return { title, description, imageUrl, siteName };
}
