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

  const [editionResult, newspaperResult] = await Promise.all([
    editionId
      ? supabase.from("newspaper_editions").select("*").eq("id", editionId).single()
      : supabase
          .from("newspaper_editions")
          .select("*")
          .eq("newspaper_id", id)
          .order("generated_at", { ascending: false })
          .limit(1)
          .single(),
    supabase.from("newspapers").select("print_config").eq("id", id).single(),
  ]);

  const edition = editionResult.data;
  if (!edition) notFound();

  const rawPc = newspaperResult.data?.print_config;
  const printConfig = (rawPc && typeof rawPc === "object" && !Array.isArray(rawPc)
    ? rawPc
    : {}) as Record<string, string>;

  return (
    <>
      <style>{`
        @media print {
          [data-sidebar="sidebar"],
          [data-slot="sidebar-gap"],
          header,
          nav {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
      `}</style>

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

        <NewspaperPreview edition={edition} printConfig={printConfig} />
      </div>
    </>
  );
}
