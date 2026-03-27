import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { render } from "@/modules/newspaper/engine";
import { authenticateKeyRequest } from "@/modules/newspaper/lib/api-auth";
import { resolveConfig } from "@/modules/newspaper/lib/resolve-config";
import type { NewspaperConfig } from "@/modules/newspaper/lib/types";

/**
 * POST /api/newspaper/render
 *
 * Ad-hoc render endpoint. Accepts a NewspaperConfig JSON body, resolves all
 * dynamic expressions (DateExpr, TodosBlock, ArticlesBlock, calendar_names),
 * and returns the result as a PDF.
 *
 * Nothing is persisted — the config is resolved and rendered on the fly.
 *
 * Auth:
 *   - API key (Bearer header or ?key= param) with scope "read:pdf"
 *   - Session cookie + ?instance_id=<uuid> query param
 *
 * Request body: NewspaperConfig JSON
 * Response: application/pdf
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateKeyRequest(request, "read:pdf");
  if (auth instanceof NextResponse) return auth;
  const { userId, instanceId } = auth;

  let config: NewspaperConfig;
  try {
    config = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!config || typeof config !== "object" || !config.title || !Array.isArray(config.pages)) {
    return NextResponse.json(
      { error: "Body must be a valid NewspaperConfig (requires title and pages)" },
      { status: 422 }
    );
  }

  try {
    const serviceClient = createServiceRoleClient();

    const resolvedConfig = await resolveConfig(config, {
      supabase: serviceClient,
      instanceId,
      userId,
    });

    const pdfBuffer = await render(resolvedConfig);
    const date = new Date().toISOString().slice(0, 10);
    const title = (config.title ?? "newspaper")
      .replace(/[^\x00-\x7F]/g, "")
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
    console.error("Ad-hoc render error:", err);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }
}
