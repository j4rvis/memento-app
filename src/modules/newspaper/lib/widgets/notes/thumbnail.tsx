"use client";

import { FileText } from "lucide-react";
import type { WidgetThumbnailProps } from "../types";

export function NotesThumbnail({ title }: WidgetThumbnailProps) {
  return (
    <div className="flex flex-col h-full p-2 gap-1">
      <div className="flex items-center gap-1 text-xs font-medium">
        <FileText className="h-3 w-3 shrink-0" />
        <span className="truncate">{title}</span>
      </div>
      <div className="space-y-1 opacity-50">
        {[0.8, 0.6, 0.9].map((w, i) => (
          <div key={i} className="h-1.5 bg-current rounded" style={{ width: `${w * 100}%` }} />
        ))}
      </div>
    </div>
  );
}
