"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface FeedOption {
  id: string;
  title: string;
}

export interface ArticleOption {
  id: string;
  title: string;
}

interface Props {
  blockType: string;
  config?: Record<string, unknown>;
  feeds?: FeedOption[];
  articles?: ArticleOption[];
}

export function BlockConfigFields({ blockType, config = {}, feeds = [], articles = [] }: Props) {
  switch (blockType) {
    case "weather":
      return (
        <div className="space-y-1">
          <Label className="text-xs">Location</Label>
          <Input
            name="config_location"
            defaultValue={(config.location as string) ?? ""}
            placeholder="e.g. Berlin"
            className="h-8 text-sm"
          />
        </div>
      );

    case "rss":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Feed</Label>
            <select
              name="config_feed_id"
              defaultValue={(config.feed_id as string) ?? ""}
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              <option value="">— select a feed —</option>
              {feeds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max items</Label>
            <Input
              name="config_max_items"
              type="number"
              min={1}
              max={20}
              defaultValue={(config.max_items as number) ?? 5}
              className="h-8 text-sm w-24"
            />
          </div>
        </div>
      );

    case "notes":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Filter</Label>
            <select
              name="config_filter"
              defaultValue={(config.filter as string) ?? "all"}
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">All notes</option>
              <option value="pinned">Pinned only</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max items</Label>
            <Input
              name="config_max_items"
              type="number"
              min={1}
              max={20}
              defaultValue={(config.max_items as number) ?? 5}
              className="h-8 text-sm w-24"
            />
          </div>
        </div>
      );

    case "todos":
      return (
        <div className="space-y-1">
          <Label className="text-xs">Max items</Label>
          <Input
            name="config_max_items"
            type="number"
            min={1}
            max={50}
            defaultValue={(config.max_items as number) ?? 10}
            className="h-8 text-sm w-24"
          />
        </div>
      );

    case "text":
      return (
        <div className="space-y-1">
          <Label className="text-xs">Content</Label>
          <textarea
            name="config_body"
            defaultValue={(config.body as string) ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm h-24 resize-none"
            placeholder="Static text content…"
          />
        </div>
      );

    case "articles":
      return <ArticlesConfigFields config={config} articles={articles} />;

    case "calendar":
      return (
        <div className="space-y-1">
          <Label className="text-xs">Days ahead</Label>
          <Input
            name="config_days_ahead"
            type="number"
            min={1}
            max={30}
            defaultValue={(config.days_ahead as number) ?? 7}
            className="h-8 text-sm w-24"
          />
        </div>
      );

    default:
      return null;
  }
}

function ArticlesConfigFields({
  config,
  articles,
}: {
  config: Record<string, unknown>;
  articles: ArticleOption[];
}) {
  const [mode, setMode] = useState<string>((config.mode as string) ?? "latest");
  const selectedIds = (config.article_ids as string[]) ?? [];

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">Mode</Label>
        <select
          name="config_mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="latest">Latest</option>
          <option value="random">Random</option>
          <option value="category">By category</option>
          <option value="specific">Specific articles</option>
        </select>
      </div>

      {mode !== "specific" && (
        <div className="space-y-1">
          <Label className="text-xs">Count</Label>
          <Input
            name="config_count"
            type="number"
            min={1}
            max={20}
            defaultValue={(config.count as number) ?? 5}
            className="h-8 text-sm w-24"
          />
        </div>
      )}

      {mode === "category" && (
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Input
            name="config_category"
            defaultValue={(config.category as string) ?? ""}
            placeholder="e.g. tech"
            className="h-8 text-sm"
          />
        </div>
      )}

      {mode === "specific" && articles.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs">Articles</Label>
          <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border p-2">
            {articles.map((a) => (
              <label key={a.id} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="config_article_ids"
                  value={a.id}
                  defaultChecked={selectedIds.includes(a.id)}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-xs line-clamp-2">{a.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {mode === "specific" && articles.length === 0 && (
        <p className="text-xs text-muted-foreground">No articles saved yet.</p>
      )}
    </div>
  );
}
