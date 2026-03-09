"use client";

import { AlignLeft } from "lucide-react";
import type { WidgetThumbnailProps } from "../types";

export function TextThumbnail({ title, config }: WidgetThumbnailProps) {
  const body = (config.body as string) ?? "";
  return (
    <div className="flex flex-col h-full p-2 gap-1">
      <div className="flex items-center gap-1 text-xs font-medium">
        <AlignLeft className="h-3 w-3 shrink-0" />
        <span className="truncate">{title}</span>
      </div>
      {body ? (
        <p className="text-xs opacity-50 line-clamp-3 leading-tight">{body}</p>
      ) : (
        <div className="space-y-1 opacity-30">
          {[1, 0.8, 0.9, 0.7].map((w, i) => (
            <div key={i} className="h-1.5 bg-current rounded" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}
