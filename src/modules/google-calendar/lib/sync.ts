import { createServiceRoleClient } from "@/lib/supabase/server";
import { decryptToken, encryptToken } from "./encryption";
import { refreshAccessToken } from "./oauth";

const CALENDAR_EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

interface GoogleEventItem {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
  recurrence?: string[];
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface GoogleEventsResponse {
  items: GoogleEventItem[];
  nextPageToken?: string;
}

/** Syncs Google Calendar events for a given account. Uses service role to bypass RLS. */
export async function syncAccount(accountId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: account, error: accountError } = await supabase
    .from("google_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (accountError || !account) throw new Error("Account not found");

  // Refresh access token if it expires within 5 minutes
  let accessToken = decryptToken(account.access_token);
  const expiresAt = new Date(account.token_expires_at).getTime();
  const fiveMinutes = 5 * 60 * 1000;

  if (Date.now() + fiveMinutes >= expiresAt) {
    const refreshToken = decryptToken(account.refresh_token);
    const refreshed = await refreshAccessToken(refreshToken);
    accessToken = refreshed.access_token;
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

    await supabase
      .from("google_accounts")
      .update({
        access_token: encryptToken(accessToken),
        token_expires_at: newExpiresAt,
      })
      .eq("id", accountId);
  }

  // Fetch events: past 7 days → next 60 days
  const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const allItems: GoogleEventItem[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${CALENDAR_EVENTS_URL}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);

    const data = (await res.json()) as GoogleEventsResponse;
    allItems.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  // Upsert events
  const now = new Date().toISOString();
  const rows = allItems.map((item) => {
    const allDay = !item.start.dateTime;
    const startAt = item.start.dateTime ?? `${item.start.date}T00:00:00Z`;
    const endAt = item.end.dateTime ?? `${item.end.date}T00:00:00Z`;

    return {
      google_account_id: accountId,
      instance_id: account.instance_id,
      user_id: account.user_id,
      google_event_id: item.id,
      calendar_id: "primary",
      title: item.summary ?? "(No title)",
      description: item.description ?? null,
      start_at: startAt,
      end_at: endAt,
      all_day: allDay,
      location: item.location ?? null,
      color: item.colorId ?? null,
      recurrence: item.recurrence ?? null,
      synced_at: now,
    };
  });

  if (rows.length > 0) {
    const { error } = await supabase
      .from("google_calendar_events")
      .upsert(rows, { onConflict: "google_account_id,google_event_id" });
    if (error) throw new Error(`Upsert failed: ${error.message}`);
  }

  // Clean up events that are no longer in the synced range
  await supabase
    .from("google_calendar_events")
    .delete()
    .eq("google_account_id", accountId)
    .lt("end_at", timeMin);
}
