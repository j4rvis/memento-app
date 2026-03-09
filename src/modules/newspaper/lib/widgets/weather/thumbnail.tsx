"use client";

import { Cloud } from "lucide-react";
import type { WidgetThumbnailProps } from "../types";

export function WeatherThumbnail({ title, config }: WidgetThumbnailProps) {
  return (
    <div className="flex flex-col h-full p-2 gap-1">
      <div className="flex items-center gap-1 text-xs font-medium">
        <Cloud className="h-3 w-3 shrink-0" />
        <span className="truncate">{title}</span>
      </div>
      {typeof config.location === "string" && config.location && (
        <p className="text-xs opacity-60 truncate">{config.location}</p>
      )}
      <div className="flex items-baseline gap-1 opacity-40 mt-auto">
        <span className="text-lg font-bold">—°</span>
      </div>
    </div>
  );
}
