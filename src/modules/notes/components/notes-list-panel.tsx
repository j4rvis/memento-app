"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, StickyNote, Pin } from "lucide-react";
import { useNotes } from "../lib/hooks";
import type { Note, NoteFolder } from "../lib/types";

function formatNoteTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  } else if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  } else {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
}

interface NotesListPanelProps {
  initialNotes: Note[];
  selectedNoteId: string | null;
  selectedFolderId: string | null;
  folders: NoteFolder[];
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
}

export function NotesListPanel({
  initialNotes,
  selectedNoteId,
  selectedFolderId,
  folders,
  onSelectNote,
  onCreateNote,
}: NotesListPanelProps) {
  const { data: allNotes } = useNotes(initialNotes as unknown[]);
  const notes = (allNotes ?? initialNotes) as Note[];

  const filtered = selectedFolderId
    ? notes.filter((n) => n.folder_id === selectedFolderId)
    : notes;

  const currentFolderName = selectedFolderId
    ? (folders.find((f) => f.id === selectedFolderId)?.name ?? "Folder")
    : "All Notes";

  return (
    <div
      className={cn(
        "border-r flex flex-col overflow-hidden",
        // Mobile: full width when no note selected, hidden when note selected
        selectedNoteId ? "hidden md:flex w-[260px] shrink-0" : "flex-1 md:flex md:w-[260px] md:flex-none md:shrink-0"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
        <span className="text-sm font-semibold truncate">{currentFolderName}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onCreateNote}
          title="New note"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile folder selector */}
      <div className="md:hidden px-3 py-1.5 border-b">
        <select
          className="w-full text-sm bg-background border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
          value={selectedFolderId ?? ""}
          onChange={(e) => {
            // handled by parent via onSelectFolder — we emit via a custom event
            const event = new CustomEvent("folderChange", { detail: e.target.value || null, bubbles: true });
            e.target.dispatchEvent(event);
          }}
        >
          <option value="">All Notes</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
            <StickyNote className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No notes</p>
          </div>
        ) : (
          filtered.map((note) => {
            const preview = note.content?.split("\n").find((l) => l.trim()) || "No additional text";
            return (
              <button
                key={note.id}
                className={cn(
                  "w-full text-left px-3 py-3 border-b hover:bg-accent transition-colors",
                  selectedNoteId === note.id && "bg-accent"
                )}
                onClick={() => onSelectNote(note.id)}
              >
                <div className="flex items-start justify-between gap-1 mb-0.5">
                  <span className="text-sm font-medium truncate flex-1">
                    {note.title || "Untitled"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {note.is_pinned && <Pin className="h-3 w-3 text-muted-foreground fill-current" />}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatNoteTime(note.updated_at)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{preview}</p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
