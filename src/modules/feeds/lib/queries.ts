import { createClient } from "@/lib/supabase/client";

export async function fetchFeedsWithCounts(instanceId: string) {
  const supabase = createClient();

  const { data: feeds, error: feedsError } = await supabase
    .from("feeds")
    .select("id, title, url")
    .eq("instance_id", instanceId)
    .order("title");
  if (feedsError) throw feedsError;
  if (!feeds?.length) return [];

  // Single query instead of N+1: fetch all unread entry feed_ids
  const feedIds = feeds.map((f) => f.id);
  const { data: entries, error: entriesError } = await supabase
    .from("feed_entries")
    .select("feed_id")
    .in("feed_id", feedIds)
    .eq("is_read", false);
  if (entriesError) throw entriesError;

  const countMap = new Map<string, number>();
  for (const entry of entries || []) {
    countMap.set(entry.feed_id, (countMap.get(entry.feed_id) || 0) + 1);
  }

  return feeds.map((feed) => ({
    ...feed,
    unread_count: countMap.get(feed.id) || 0,
  }));
}

export async function fetchFeedEntries(instanceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feed_entries")
    .select("*, feeds(title)")
    .eq("instance_id", instanceId)
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}
