"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { WidgetConfigProps } from "../types";

export function RssConfig({ config = {}, feeds = [] }: WidgetConfigProps) {
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
}
