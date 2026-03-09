"use client";

import type { WidgetPreviewProps } from "../types";

export function NotesPreview({ block }: WidgetPreviewProps) {
  const notes = (block.data as Array<{
    title: string;
    content: string;
    is_pinned: boolean;
  }>) || [];

  return (
    <div>
      <h3 className="font-semibold mb-2">{block.title}</h3>
      {notes.length > 0 ? (
        <div className="space-y-2">
          {notes.map((note, i) => (
            <div key={i} className="text-sm">
              <p className="font-medium">{note.title}</p>
              <p className="text-muted-foreground line-clamp-2">{note.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No notes</p>
      )}
    </div>
  );
}
