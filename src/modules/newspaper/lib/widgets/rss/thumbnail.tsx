"use client";

import { Rss } from "lucide-react";
import type { WidgetThumbnailProps } from "../types";

export function RssThumbnail({ title }: WidgetThumbnailProps) {
  return (
    <div className="flex flex-col h-full p-2 gap-1">
      <div className="flex items-center gap-1 text-xs font-medium">
        <Rss className="h-3 w-3 shrink-0" />
        <span className="truncate">{title}</span>
      </div>
      <div className="space-y-1 opacity-50">
        {[1, 0.75, 0.85, 0.6].map((w, i) => (
          <div key={i} className="h-1.5 bg-current rounded" style={{ width: `${w * 100}%` }} />
        ))}
      </div>
    </div>
  );
}
