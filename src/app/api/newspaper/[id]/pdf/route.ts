import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { render } from "@/modules/newspaper/engine";
import { authenticateApiRequest } from "@/modules/newspaper/lib/api-auth";
import { resolveGoogleCalendarSources } from "@/modules/newspaper/lib/resolve-google-sources";
import { syncCalendar, syncCalendarList } from "@/modules/google-calendar/lib/sync";
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

    // Auto-sync Google Calendar events before rendering
    if (config.google_calendar_sources?.length) {
      await Promise.all([
        ...config.google_calendar_sources.map(({ account_id }) =>
          syncCalendarList(account_id, userId, instanceId)
        ),
        ...config.google_calendar_sources.flatMap(({ account_id, calendar_ids }) =>
          calendar_ids.map((calId) => syncCalendar(account_id, calId, userId, instanceId))
        ),
      ]);
    }

    const googleEntries = await resolveGoogleCalendarSources(config);
    const mergedConfig: NewspaperConfig = {
      ...config,
      calendar_entries: [...(config.calendar_entries ?? []), ...googleEntries],
    };

    const pdfBuffer = await render(mergedConfig);
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
