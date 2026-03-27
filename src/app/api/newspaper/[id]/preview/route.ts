import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { render } from "@/modules/newspaper/engine";
import { resolveGoogleCalendarSources } from "@/modules/newspaper/lib/resolve-google-sources";
import { syncCalendar, syncCalendarList } from "@/modules/google-calendar/lib/sync";
import type { NewspaperConfig } from "@/modules/newspaper/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("newspaper_templates")
    .select("config, instance_id")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const config = data.config as NewspaperConfig;
    const instanceId = data.instance_id as string;

    // Auto-sync Google Calendar events before rendering
    if (config.google_calendar_sources?.length) {
      await Promise.all([
        ...config.google_calendar_sources.map(({ account_id }) =>
          syncCalendarList(account_id, user.id, instanceId)
        ),
        ...config.google_calendar_sources.flatMap(({ account_id, calendar_ids }) =>
          calendar_ids.map((calId) => syncCalendar(account_id, calId, user.id, instanceId))
        ),
      ]);
    }

    const googleEntries = await resolveGoogleCalendarSources(config);
    const mergedConfig: NewspaperConfig = {
      ...config,
      calendar_entries: [...(config.calendar_entries ?? []), ...googleEntries],
    };

    const pdfBuffer = await render(mergedConfig);
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
