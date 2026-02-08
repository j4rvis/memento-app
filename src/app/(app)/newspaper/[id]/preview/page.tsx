import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { NewspaperPreview } from "@/modules/newspaper/components/newspaper-preview";

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edition?: string }>;
}) {
  const { id } = await params;
  const { edition: editionId } = await searchParams;
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
    // Get the latest edition
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
          <Link href={`/newspaper/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Editor
          </Link>
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {}}
          className="print-button"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <NewspaperPreview edition={edition} />

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.querySelector('.print-button')?.addEventListener('click', () => window.print());
          `,
        }}
      />
    </div>
  );
}
