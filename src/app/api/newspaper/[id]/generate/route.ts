import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { render } from "@/modules/newspaper/engine";
import { authenticateApiRequest } from "@/modules/newspaper/lib/api-auth";
import { resolveGoogleCalendarSources } from "@/modules/newspaper/lib/resolve-google-sources";
import { syncCalendar, syncCalendarList } from "@/modules/google-calendar/lib/sync";
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
