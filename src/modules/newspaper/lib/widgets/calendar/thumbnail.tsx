"use client";

import { CalendarDays } from "lucide-react";
import type { WidgetThumbnailProps } from "../types";

export function CalendarThumbnail({ title, config }: WidgetThumbnailProps) {
  return (
    <div className="flex flex-col h-full p-2 gap-1">
      <div className="flex items-center gap-1 text-xs font-medium">
        <CalendarDays className="h-3 w-3 shrink-0" />
        <span className="truncate">{title}</span>
      </div>
      <p className="text-xs opacity-50">{(config.days_ahead as number) ?? 7}d ahead</p>
      <div className="space-y-0.5 opacity-40 mt-1">
        {["Mon", "Tue", "Wed"].map((d) => (
          <div key={d} className="flex items-center gap-1 text-xs">
            <span className="w-6 shrink-0 text-[9px] font-medium">{d}</span>
            <div className="h-1.5 bg-current rounded flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
