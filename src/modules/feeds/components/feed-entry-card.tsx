"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink } from "lucide-react";
import { markAsRead, toggleStar } from "@/app/(app)/i/[slug]/feeds/actions";
import { cn } from "@/lib/utils";

interface FeedEntry {
  id: string;
  title: string | null;
  url: string | null;
  summary: string | null;
  author: string | null;
  published_at: string | null;
  is_read: boolean;
  is_starred: boolean;
  feeds?: { title: string } | null;
}

export function FeedEntryCard({ entry, slug }: { entry: FeedEntry; slug: string }) {
  return (
    <Card
      className={cn(
        "transition-colors",
        !entry.is_read && "border-l-4 border-l-primary"
      )}
      onClick={() => {
        if (!entry.is_read) markAsRead(slug, entry.id);
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-2 text-base">
              {entry.title || "Untitled"}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              {entry.feeds?.title && <span>{entry.feeds.title}</span>}
              {entry.author && <span>by {entry.author}</span>}
              {entry.published_at && (
                <span>{new Date(entry.published_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                toggleStar(slug, entry.id);
              }}
            >
              <Star
                className={cn("h-3.5 w-3.5", entry.is_starred && "fill-yellow-500 text-yellow-500")}
              />
            </Button>
            {entry.url && (
              <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {entry.summary && (
        <CardContent>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {entry.summary}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
