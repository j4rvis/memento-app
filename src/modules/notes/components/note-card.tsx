"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pin, Trash2 } from "lucide-react";
import { togglePin, deleteNote } from "@/app/(app)/notes/actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  updated_at: string;
}

export function NoteCard({ note }: { note: Note }) {
  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <Link href={`/notes/${note.id}`} className="absolute inset-0 z-0" />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-1 text-base">
            {note.title || "Untitled"}
          </CardTitle>
          <div className="relative z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.preventDefault();
                togglePin(note.id);
              }}
            >
              <Pin className={cn("h-3.5 w-3.5", note.is_pinned && "fill-current")} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.preventDefault();
                deleteNote(note.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {note.content || "Empty note"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {new Date(note.updated_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
