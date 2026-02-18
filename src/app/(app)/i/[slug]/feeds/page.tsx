import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { FeedsPageClient } from "@/modules/feeds/components/feeds-page-client";

export default async function FeedsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const { data: feeds } = await supabase
    .from("feeds")
    .select("id, title, url")
    .eq("instance_id", instance.id)
    .order("title");

  // Fix N+1: single query for all unread counts instead of per-feed queries
  const feedIds = (feeds || []).map((f) => f.id);
  const unreadEntries = feedIds.length > 0
    ? (await supabase
        .from("feed_entries")
        .select("feed_id")
        .in("feed_id", feedIds)
        .eq("is_read", false)).data
    : [];

  const countMap = new Map<string, number>();
  for (const entry of unreadEntries || []) {
    countMap.set(entry.feed_id, (countMap.get(entry.feed_id) || 0) + 1);
  }

  const feedsWithCounts = (feeds || []).map((feed) => ({
    ...feed,
    unread_count: countMap.get(feed.id) || 0,
  }));

  const { data: entries } = await supabase
    .from("feed_entries")
    .select("*, feeds(title)")
    .eq("instance_id", instance.id)
    .order("published_at", { ascending: false })
    .limit(50);

  return (
    <FeedsPageClient
      initialFeeds={feedsWithCounts}
      initialEntries={entries ?? []}
    />
  );
}
