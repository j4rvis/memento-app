import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { NewspaperConfig, CalendarEntry, GoogleCalendarSource } from "./types";

export async function resolveGoogleCalendarSources(
  config: NewspaperConfig
): Promise<CalendarEntry[]> {
  const sources = config.google_calendar_sources;
  if (!sources || sources.length === 0) return [];

  const supabase = createServiceRoleClient();
  const entries: CalendarEntry[] = [];

  for (const source of sources) {
    const calendarIds = source.calendar_ids ?? [];
    if (calendarIds.length === 0) continue;

    // Fetch calendar metadata for colors
    const { data: calendars } = await supabase
      .from("google_calendars")
      .select("google_calendar_id, name, color")
      .eq("google_account_id", source.account_id)
      .in("google_calendar_id", calendarIds);

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
      .in("calendar_id", calendarIds);

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

/**
 * Resolves `calendar_names` in each source to `calendar_ids` via the
 * `google_calendars` table. Returns new source objects with `calendar_names`
 * removed and their resolved IDs merged into `calendar_ids`.
 *
 * Unknown names are silently skipped. Sources without `calendar_names` pass
 * through unchanged.
 */
export async function resolveCalendarNames(
  sources: GoogleCalendarSource[],
  supabase: SupabaseClient
): Promise<GoogleCalendarSource[]> {
  return Promise.all(
    sources.map(async (source) => {
      if (!source.calendar_names || source.calendar_names.length === 0) {
        return source;
      }

      // Fetch calendar IDs matching any of the provided names (case-insensitive)
      const resolvedIds: string[] = [];
      for (const name of source.calendar_names) {
        const { data } = await supabase
          .from("google_calendars")
          .select("google_calendar_id")
          .eq("google_account_id", source.account_id)
          .ilike("name", name);

        for (const row of data ?? []) {
          resolvedIds.push(row.google_calendar_id as string);
        }
      }

      const existingIds = source.calendar_ids ?? [];
      const merged = Array.from(new Set([...existingIds, ...resolvedIds]));

      // Return without calendar_names — they've been resolved
      const { calendar_names: _removed, ...rest } = source;
      void _removed;
      return { ...rest, calendar_ids: merged };
    })
  );
}
