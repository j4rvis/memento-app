"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";
import { deleteFeed, refreshFeed } from "@/app/(app)/i/[slug]/feeds/actions";
import { cn } from "@/lib/utils";

const PROVIDER_BADGE: Record<string, string> = {
  x: "𝕏",
};

interface Feed {
  id: string;
  title: string;
  url: string;
  provider?: string;
  unread_count: number;
}

export function FeedList({ feeds, slug }: { feeds: Feed[]; slug: string }) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      <Link
        href={`/i/${slug}/feeds`}
        className={cn(
          "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
          pathname === `/i/${slug}/feeds` && "bg-accent"
        )}
      >
        All Entries
      </Link>
      {feeds.map((feed) => (
        <div
          key={feed.id}
          className={cn(
            "group flex items-center rounded-md hover:bg-accent",
            pathname === `/i/${slug}/feeds/${feed.id}` && "bg-accent"
          )}
        >
          <Link
            href={`/i/${slug}/feeds/${feed.id}`}
            className="flex flex-1 items-center gap-2 px-3 py-2 text-sm"
          >
            {feed.provider && PROVIDER_BADGE[feed.provider] && (
              <span className="shrink-0 text-xs" title={feed.provider}>
                {PROVIDER_BADGE[feed.provider]}
              </span>
            )}
            <span className="truncate">{feed.title}</span>
            {feed.unread_count > 0 && (
              <span className="ml-auto shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {feed.unread_count}
              </span>
            )}
          </Link>
          <div className="flex pr-1 opacity-0 group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => refreshFeed(slug, feed.id)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => deleteFeed(slug, feed.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
