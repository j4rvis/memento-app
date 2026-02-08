import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { NoteCard } from "@/modules/notes/components/note-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/shared/refresh-button";
import { StickyNote, Plus } from "lucide-react";
import { createNote } from "./actions";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("instance_id", instance.id)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Notes</h1>
          <RefreshButton />
        </div>
        <form action={async () => { "use server"; await createNote(slug); }}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </form>
      </div>

      {notes && notes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
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
