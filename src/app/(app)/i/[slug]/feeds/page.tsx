import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { FeedList } from "@/modules/feeds/components/feed-list";
import { FeedEntryCard } from "@/modules/feeds/components/feed-entry-card";
import { AddFeedDialog } from "@/modules/feeds/components/add-feed-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Rss } from "lucide-react";
import { markAllAsRead } from "./actions";

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

  const feedsWithCounts = await Promise.all(
    (feeds || []).map(async (feed) => {
      const { count } = await supabase
        .from("feed_entries")
        .select("*", { count: "exact", head: true })
        .eq("feed_id", feed.id)
        .eq("is_read", false);
      return { ...feed, unread_count: count || 0 };
    })
  );

  const { data: entries } = await supabase
    .from("feed_entries")
    .select("*, feeds(title)")
    .eq("instance_id", instance.id)
    .order("published_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Feeds</h1>
          <RefreshButton />
        </div>
        <AddFeedDialog slug={slug} />
      </div>

      {feeds && feeds.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="space-y-4">
            <FeedList feeds={feedsWithCounts} slug={slug} />
          </aside>
          <div className="space-y-4">
            <div className="flex justify-end">
              <form action={async () => {
                "use server";
                for (const feed of feeds) {
                  await markAllAsRead(slug, feed.id);
                }
              }}>
                <Button variant="outline" size="sm" type="submit">
                  Mark All Read
                </Button>
              </form>
            </div>
            {entries && entries.length > 0 ? (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <FeedEntryCard key={entry.id} entry={entry} slug={slug} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Rss}
                title="No entries"
                description="Your feeds are empty. Try refreshing them."
              />
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Rss}
          title="No feeds yet"
          description="Add your first RSS feed to start reading."
        />
      )}
    </div>
  );
}
