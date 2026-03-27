import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { render } from "@/modules/newspaper/engine";
import { authenticateApiRequest } from "@/modules/newspaper/lib/api-auth";
import { resolveConfig } from "@/modules/newspaper/lib/resolve-config";
import type { NewspaperConfig } from "@/modules/newspaper/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params;

  const auth = await authenticateApiRequest(request, templateId, "write:generate");
  if (auth instanceof NextResponse) return auth;
  const { userId, instanceId } = auth;

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
    const generated_at = new Date().toISOString();
    const size_bytes = Buffer.isBuffer(pdfBuffer)
      ? pdfBuffer.length
      : (pdfBuffer as ArrayBuffer).byteLength;

    return NextResponse.json({
      path: null, // populated in ticket 049 when Storage is available
      generated_at,
      size_bytes,
    });
  } catch (err) {
    console.error("PDF render error:", err);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }
}
