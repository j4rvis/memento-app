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
      {/* Google Fonts for newspaper typography */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap"
      />

      <style>{`
        /* Drop cap for first letter of editorial paragraphs */
        .np-drop-cap::first-letter {
          float: left;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 3.4em;
          font-weight: 900;
          line-height: 0.78;
          margin-right: 0.06em;
          margin-top: 0.04em;
          color: inherit;
        }

        @media print {
          /*
           * Layout-flattening approach (correct for multi-page print):
           * Keep #np-print-target in document flow so content naturally
           * flows across pages. Strip the surrounding app chrome by
           * targeting its known data-slot attributes and HTML elements.
           */

          /* 1. Flatten SidebarProvider wrapper (flex → block) */
          [data-slot="sidebar-wrapper"] {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* 2. Hide sidebar rail and gap */
          [data-slot="sidebar"],
          [data-slot="sidebar-gap"] {
            display: none !important;
          }

          /* 3. SidebarInset <main>: remove inset shadow/rounding, make block */
          [data-slot="sidebar-inset"] {
            display: block !important;
            width: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          /* 4. Hide app header and bottom nav */
          header,
          nav {
            display: none !important;
          }

          /* 5. Inner <main> and its wrapper: remove padding */
          [data-slot="sidebar-inset"] main,
          [data-slot="sidebar-inset"] > main {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* 6. space-y wrapper inside main */
          [data-slot="sidebar-inset"] main > div {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* 7. Override inline styles on the newspaper container itself.
                !important beats inline styles in @media print rules. */
          #np-print-target {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
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
