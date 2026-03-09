"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { WidgetConfigProps } from "../types";

export function ArticlesConfig({ config = {}, articles = [] }: WidgetConfigProps) {
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
