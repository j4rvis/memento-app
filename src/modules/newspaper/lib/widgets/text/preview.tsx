"use client";

import type { WidgetPreviewProps } from "../types";

export function TextPreview({ block }: WidgetPreviewProps) {
  const data = block.data as { body: string } | null;
  return (
    <div>
      <h3 className="font-semibold mb-2">{block.title}</h3>
      <p className="text-sm whitespace-pre-wrap">{data?.body || ""}</p>
    </div>
  );
}
