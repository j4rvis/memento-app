import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { render } from "@/modules/newspaper/engine";
import type { NewspaperConfig } from "@/modules/newspaper/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("newspaper_templates")
    .select("config")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const pdfBuffer = await render(data.config as NewspaperConfig);
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("PDF render error:", err);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }
}
