import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { NotesLayout } from "@/modules/notes/components/notes-layout";
import type { Note, NoteFolder } from "@/modules/notes/lib/types";

export default async function NotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ note?: string; folder?: string }>;
}) {
  const { slug } = await params;
  const { note: noteId, folder: folderId } = await searchParams;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const [{ data: notes }, { data: folders }] = await Promise.all([
    supabase
      .from("notes")
      .select("*")
      .eq("instance_id", instance.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false }),
    supabase
      .from("note_folders")
      .select("*")
      .eq("instance_id", instance.id)
      .order("name", { ascending: true }),
  ]);

  return (
    <NotesLayout
      initialNotes={(notes ?? []) as Note[]}
      initialFolders={(folders ?? []) as NoteFolder[]}
      initialNoteId={noteId ?? null}
      initialFolderId={folderId ?? null}
    />
  );
}
