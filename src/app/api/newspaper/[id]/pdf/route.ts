import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { render } from "@/modules/newspaper/engine";
import { authenticateApiRequest } from "@/modules/newspaper/lib/api-auth";
import { resolveConfig } from "@/modules/newspaper/lib/resolve-config";
import type { NewspaperConfig } from "@/modules/newspaper/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params;

  const auth = await authenticateApiRequest(request, templateId, "read:pdf");
  if (auth instanceof NextResponse) return auth;
  const { userId, instanceId } = auth;

  // Accept ?generate=true and ?date= without error (no-op until ticket 049)
  const serviceClient = createServiceRoleClient();
  const { data: template } = await serviceClient
    .from("newspaper_templates")
    .select("config")
    .eq("id", templateId)
    .single();

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const config = template.config as NewspaperConfig;

    const resolvedConfig = await resolveConfig(config, {
      supabase: serviceClient,
      instanceId,
      userId,
    });

    const pdfBuffer = await render(resolvedConfig);
    const date = new Date().toISOString().slice(0, 10);
    const title = (config.title ?? "newspaper")
      .replace(/[^\x00-\x7F]/g, "")  // strip non-ASCII (e.g. em dash)
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase() || "newspaper";

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${title}-${date}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF render error:", err);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }
}
