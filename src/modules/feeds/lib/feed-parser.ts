import RSSParser from "rss-parser";

const parser = new RSSParser();

export interface ParsedFeed {
  title: string;
  description?: string;
  siteUrl?: string;
  entries: ParsedEntry[];
}

export interface ParsedEntry {
  guid: string;
  title?: string;
  url?: string;
  author?: string;
  content?: string;
  summary?: string;
  imageUrl?: string;
  publishedAt?: string;
}

export async function parseFeed(feedUrl: string): Promise<ParsedFeed> {
  const feed = await parser.parseURL(feedUrl);

  return {
    title: feed.title || feedUrl,
    description: feed.description,
    siteUrl: feed.link,
    entries: (feed.items || []).map((item) => ({
      guid: item.guid || item.link || item.title || "",
      title: item.title,
      url: item.link,
      author: item.creator || item.author,
      content: item["content:encoded"] || item.content,
      summary: item.contentSnippet || item.summary,
      imageUrl: item.enclosure?.url,
      publishedAt: item.isoDate || item.pubDate,
    })),
  };
}
