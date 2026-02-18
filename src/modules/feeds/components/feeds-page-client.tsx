"use client";

import { useFeedsWithCounts, useFeedEntries } from "../lib/hooks";
import { FeedList } from "./feed-list";
import { FeedEntryCard } from "./feed-entry-card";
import { AddFeedDialog } from "./add-feed-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Rss } from "lucide-react";
import { markAllAsRead } from "@/app/(app)/i/[slug]/feeds/actions";
import { useInstanceSlug } from "@/lib/instance/context";

export function FeedsPageClient({
  initialFeeds,
  initialEntries,
}: {
  initialFeeds: unknown[];
  initialEntries: unknown[];
}) {
  const slug = useInstanceSlug();
  const { data: feeds } = useFeedsWithCounts(initialFeeds);
  const { data: entries } = useFeedEntries(initialEntries);

  const displayFeeds = (feeds ?? initialFeeds) as { id: string; title: string; url: string; unread_count: number }[];
  const displayEntries = (entries ?? initialEntries) as {
    id: string;
    title: string | null;
    url: string | null;
    summary: string | null;
    author: string | null;
    published_at: string | null;
    is_read: boolean;
    is_starred: boolean;
    feeds?: { title: string } | null;
  }[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Feeds</h1>
          <RefreshButton />
        </div>
        <AddFeedDialog slug={slug} />
      </div>

      {displayFeeds.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="space-y-4">
            <FeedList feeds={displayFeeds} slug={slug} />
          </aside>
          <div className="space-y-4">
            <div className="flex justify-end">
              <form action={async () => {
                for (const feed of displayFeeds) {
                  await markAllAsRead(slug, feed.id);
                }
              }}>
                <Button variant="outline" size="sm" type="submit">
                  Mark All Read
                </Button>
              </form>
            </div>
            {displayEntries.length > 0 ? (
              <div className="space-y-3">
                {displayEntries.map((entry) => (
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
