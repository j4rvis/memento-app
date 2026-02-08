import { createClient } from "@/lib/supabase/server";
import { NoteCard } from "@/modules/notes/components/note-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { StickyNote, Plus } from "lucide-react";
import { createNote } from "./actions";

export default async function NotesPage() {
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notes</h1>
        <form action={createNote}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </form>
      </div>

      {notes && notes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
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
