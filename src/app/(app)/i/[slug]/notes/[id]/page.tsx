import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { NoteEditor } from "@/modules/notes/components/note-editor";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  await resolveInstance(slug);
  const supabase = await createClient();

  const { data: note } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .single();

  if (!note) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/i/${slug}/notes`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Notes
        </Link>
      </Button>
      <NoteEditor note={note} slug={slug} />
    </div>
  );
}
