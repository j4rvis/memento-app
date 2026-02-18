import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { NotesPageClient } from "@/modules/notes/components/notes-page-client";

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

  return <NotesPageClient initialNotes={notes ?? []} />;
}
