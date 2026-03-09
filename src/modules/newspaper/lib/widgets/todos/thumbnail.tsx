"use client";

import { CheckSquare } from "lucide-react";
import type { WidgetThumbnailProps } from "../types";

export function TodosThumbnail({ title, config }: WidgetThumbnailProps) {
  return (
    <div className="flex flex-col h-full p-2 gap-1">
      <div className="flex items-center gap-1 text-xs font-medium">
        <CheckSquare className="h-3 w-3 shrink-0" />
        <span className="truncate">{title}</span>
      </div>
      <div className="space-y-0.5 opacity-50">
        {Array.from({ length: Math.min((config.max_items as number) ?? 3, 3) }).map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm border border-current shrink-0" />
            <div className="h-1.5 bg-current rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
