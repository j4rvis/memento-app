import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export interface ScrapedArticle {
  title: string;
  content: string;
  excerpt: string;
  author: string | null;
  siteName: string | null;
  imageUrl: string | null;
}

export async function scrapeArticle(url: string): Promise<ScrapedArticle> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Memento/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    throw new Error("Could not parse article content");
  }

  // Try to extract og:image
  const metaImage = dom.window.document.querySelector(
    'meta[property="og:image"]'
  );
  const imageUrl = metaImage?.getAttribute("content") || null;

  // Try to extract og:site_name
  const metaSiteName = dom.window.document.querySelector(
    'meta[property="og:site_name"]'
  );
  const siteName =
    metaSiteName?.getAttribute("content") || article.siteName || null;

  return {
    title: article.title ?? "Untitled",
    content: article.content ?? "",
    excerpt: article.excerpt || "",
    author: article.byline || null,
    siteName,
    imageUrl,
  };
}
