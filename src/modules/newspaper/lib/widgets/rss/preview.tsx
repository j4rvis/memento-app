"use client";

import type { WidgetPreviewProps } from "../types";

export function RssPreview({ block }: WidgetPreviewProps) {
  const entries = (block.data as Array<{
    title: string;
    url: string;
    summary: string;
    published_at: string;
  }>) || [];

  return (
    <div>
      <h3 className="font-semibold mb-2">{block.title}</h3>
      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={i} className="text-sm">
              <p className="font-medium">{entry.title}</p>
              {entry.summary && (
                <p className="text-muted-foreground line-clamp-2">{entry.summary}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No entries</p>
      )}
    </div>
  );
}
