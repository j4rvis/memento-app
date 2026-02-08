import { createClient } from "@/lib/supabase/server";
import { FeedEntryCard } from "@/modules/feeds/components/feed-entry-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Rss, ArrowLeft, RefreshCw } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { refreshFeed, markAllAsRead } from "../actions";

export default async function FeedDetailPage({
  params,
}: {
  params: Promise<{ feedId: string }>;
}) {
  const { feedId } = await params;
  const supabase = await createClient();

  const { data: feed } = await supabase
    .from("feeds")
    .select("*")
    .eq("id", feedId)
    .single();

  if (!feed) notFound();

  const { data: entries } = await supabase
    .from("feed_entries")
    .select("*, feeds(title)")
    .eq("feed_id", feedId)
    .order("published_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/feeds">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{feed.title}</h1>
        <div className="ml-auto flex gap-2">
          <form action={async () => { "use server"; await markAllAsRead(feedId); }}>
            <Button variant="outline" size="sm" type="submit">
              Mark All Read
            </Button>
          </form>
          <form action={async () => { "use server"; await refreshFeed(feedId); }}>
            <Button variant="outline" size="sm" type="submit">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </form>
        </div>
      </div>

      {feed.description && (
        <p className="text-muted-foreground">{feed.description}</p>
      )}

      {entries && entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry) => (
            <FeedEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Rss}
          title="No entries"
          description="This feed has no entries. Try refreshing it."
        />
      )}
    </div>
  );
}
