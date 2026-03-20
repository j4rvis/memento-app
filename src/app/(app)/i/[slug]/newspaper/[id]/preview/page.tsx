import { notFound } from "next/navigation";
import { resolveInstance } from "@/lib/instance/server";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewspaperPreviewPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("newspaper_templates")
    .select("id, name")
    .eq("id", id)
    .eq("instance_id", instance.id)
    .single();

  if (error || !data) notFound();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/i/${slug}/newspaper/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to editor
          </Link>
        </Button>
        <span className="text-sm font-medium">{data.name} — Preview</span>
      </div>
      <iframe
        src={`/api/newspaper/${id}/preview`}
        className="flex-1 w-full"
        title="PDF Preview"
      />
    </div>
  );
}
