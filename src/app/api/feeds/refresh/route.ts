import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseFeed } from "@/modules/feeds/lib/feed-parser";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get instance_id from query param or refresh all user's feeds
  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get("instance_id");

  let feedQuery = supabase.from("feeds").select("id, url");
  if (instanceId) {
    feedQuery = feedQuery.eq("instance_id", instanceId);
  }

  const { data: feeds } = await feedQuery;

  if (!feeds || feeds.length === 0) {
    return NextResponse.json({ message: "No feeds to refresh" });
  }

  const results = [];

  for (const feed of feeds) {
    try {
      const parsed = await parseFeed(feed.url);
      let newCount = 0;

      // Get the feed's instance_id for inserting entries
      const { data: feedData } = await supabase
        .from("feeds")
        .select("instance_id")
        .eq("id", feed.id)
        .single();

      if (!feedData) continue;

      for (const entry of parsed.entries) {
        const { error } = await supabase.from("feed_entries").upsert(
          {
            feed_id: feed.id,
            user_id: user.id,
            instance_id: feedData.instance_id,
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
