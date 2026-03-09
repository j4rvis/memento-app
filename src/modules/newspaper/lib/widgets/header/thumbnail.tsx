"use client";

import type { WidgetThumbnailProps } from "../types";

export function HeaderThumbnail({ title }: WidgetThumbnailProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-1 py-2">
      <div className="w-full border-t-2 border-double border-current opacity-40" />
      <span className="text-xs font-bold font-serif truncate">{title}</span>
      <div className="w-full border-b-2 border-double border-current opacity-40" />
    </div>
  );
}
