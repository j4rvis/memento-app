import { createServiceRoleClient } from "@/lib/supabase/server";
import type { NewspaperConfig, CalendarEntry } from "./types";

export async function resolveGoogleCalendarSources(
  config: NewspaperConfig
): Promise<CalendarEntry[]> {
  const sources = config.google_calendar_sources;
  if (!sources || sources.length === 0) return [];

  const supabase = createServiceRoleClient();
  const entries: CalendarEntry[] = [];

  for (const source of sources) {
    if (!source.calendar_ids || source.calendar_ids.length === 0) continue;

    // Fetch calendar metadata for colors
    const { data: calendars } = await supabase
      .from("google_calendars")
      .select("google_calendar_id, name, color")
      .eq("google_account_id", source.account_id)
      .in("google_calendar_id", source.calendar_ids);

    const calendarColorMap = new Map(
      (calendars ?? []).map((c) => [c.google_calendar_id, c.color as string | null])
    );
    const calendarNameMap = new Map(
      (calendars ?? []).map((c) => [c.google_calendar_id, c.name as string])
    );

    // Fetch events for all selected calendars under this account
    const { data: events } = await supabase
      .from("google_calendar_events")
      .select("id, title, description, start_at, end_at, all_day, color, calendar_id")
      .eq("google_account_id", source.account_id)
      .in("calendar_id", source.calendar_ids);

    for (const event of events ?? []) {
      // Calendar-level color takes priority
      const calendarColor = calendarColorMap.get(event.calendar_id);
      const color = calendarColor ?? "#4285F4";

      entries.push({
        id: event.id,
        title: event.title,
        description: event.description ?? undefined,
        start_at: event.start_at,
        end_at: event.end_at,
        all_day: event.all_day,
        color,
        calendar: calendarNameMap.get(event.calendar_id) ?? event.calendar_id,
      });
    }
  }

  return entries;
}
