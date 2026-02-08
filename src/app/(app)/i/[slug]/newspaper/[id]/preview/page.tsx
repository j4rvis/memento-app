import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/modules/newspaper/components/print-button";
import { NewspaperPreview } from "@/modules/newspaper/components/newspaper-preview";

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ edition?: string }>;
}) {
  const { slug, id } = await params;
  const { edition: editionId } = await searchParams;
  await resolveInstance(slug);
  const supabase = await createClient();

  let edition;

  if (editionId) {
    const { data } = await supabase
      .from("newspaper_editions")
      .select("*")
      .eq("id", editionId)
      .single();
    edition = data;
  } else {
    const { data } = await supabase
      .from("newspaper_editions")
      .select("*")
      .eq("newspaper_id", id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();
    edition = data;
  }

  if (!edition) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/i/${slug}/newspaper/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Editor
          </Link>
        </Button>
        <div className="flex-1" />
        <PrintButton />
      </div>

      <NewspaperPreview edition={edition} />
    </div>
  );
}
