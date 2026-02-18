"use client";

import { useNotes } from "../lib/hooks";
import { NoteCard } from "./note-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/shared/refresh-button";
import { StickyNote, Plus } from "lucide-react";
import { createNote } from "@/app/(app)/i/[slug]/notes/actions";
import { useInstanceSlug } from "@/lib/instance/context";

export function NotesPageClient({
  initialNotes,
}: {
  initialNotes: unknown[];
}) {
  const slug = useInstanceSlug();
  const { data: notes } = useNotes(initialNotes);
  const displayNotes = notes ?? initialNotes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Notes</h1>
          <RefreshButton />
        </div>
        <form action={async () => { await createNote(slug); }}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </form>
      </div>

      {displayNotes && displayNotes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(displayNotes as { id: string; title: string; content: string; is_pinned: boolean; updated_at: string }[]).map((note) => (
            <NoteCard key={note.id} note={note} slug={slug} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Create your first note to get started."
        />
      )}
    </div>
  );
}
