import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseFeed } from "@/modules/feeds/lib/feed-parser";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: feeds } = await supabase
    .from("feeds")
    .select("id, url")
    .eq("user_id", user.id);

  if (!feeds) {
    return NextResponse.json({ message: "No feeds to refresh" });
  }

  const results = [];

  for (const feed of feeds) {
    try {
      const parsed = await parseFeed(feed.url);
      let newCount = 0;

      for (const entry of parsed.entries) {
        const { error } = await supabase.from("feed_entries").upsert(
          {
            feed_id: feed.id,
            user_id: user.id,
            guid: entry.guid,
            title: entry.title,
            url: entry.url,
            author: entry.author,
            content: entry.content,
            summary: entry.summary,
            image_url: entry.imageUrl,
            published_at: entry.publishedAt,
          },
          { onConflict: "feed_id,guid", ignoreDuplicates: true }
        );
        if (!error) newCount++;
      }

      await supabase
        .from("feeds")
        .update({ last_fetched_at: new Date().toISOString(), fetch_error: null })
        .eq("id", feed.id);

      results.push({ feed_id: feed.id, status: "ok", new_entries: newCount });
    } catch (err) {
      await supabase
        .from("feeds")
        .update({ fetch_error: (err as Error).message })
        .eq("id", feed.id);
      results.push({ feed_id: feed.id, status: "error", error: (err as Error).message });
    }
  }

  return NextResponse.json({ results });
}
