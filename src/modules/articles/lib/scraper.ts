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

export interface ScrapedMeta {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

export function parseHtml(html: string, url: string): ScrapedArticle {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    throw new Error("Could not parse article content");
  }

  const metaImage = dom.window.document.querySelector(
    'meta[property="og:image"]'
  );
  const imageUrl = metaImage?.getAttribute("content") || null;

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
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  const getMeta = (property: string) =>
    doc.querySelector(`meta[property="${property}"]`)?.getAttribute("content") ||
    doc.querySelector(`meta[name="${property}"]`)?.getAttribute("content") ||
    null;

  const title =
    getMeta("og:title") || doc.querySelector("title")?.textContent || null;
  const description = getMeta("og:description") || getMeta("description");
  const imageUrl = getMeta("og:image");
  const siteName = getMeta("og:site_name");

  return { title, description, imageUrl, siteName };
}
