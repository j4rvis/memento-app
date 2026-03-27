import { createServiceRoleClient } from "@/lib/supabase/server";
import { decryptToken, encryptToken } from "./encryption";
import { refreshAccessToken } from "./oauth";
import type { GoogleCalendarApiEvent, GoogleCalendarListEntry } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

const CALENDAR_LIST_URL =
  "https://www.googleapis.com/calendar/v3/users/me/calendarList";
const CALENDAR_EVENTS_BASE =
  "https://www.googleapis.com/calendar/v3/calendars";

async function getValidAccessToken(
  supabase: SupabaseClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  account: any
): Promise<string> {
  let accessToken: string;
  try {
    accessToken = decryptToken(account.access_token as string);
  } catch {
    throw new Error(
      `Token decryption failed for account ${account.google_email} — please reconnect your Google account in Settings.`
    );
  }

  const expiresAt = new Date(account.token_expires_at as string).getTime();
  if (Date.now() + 5 * 60 * 1000 >= expiresAt) {
    if (!account.refresh_token) throw new Error("No refresh token available");
    let refreshToken: string;
    try {
      refreshToken = decryptToken(account.refresh_token as string);
    } catch {
      throw new Error(
        `Token decryption failed for account ${account.google_email} — please reconnect your Google account in Settings.`
      );
    }
    const tokens = await refreshAccessToken(refreshToken);
    accessToken = tokens.access_token;
    await supabase
      .from("google_accounts")
      .update({
        access_token: encryptToken(accessToken),
        token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
      })
      .eq("id", account.id);
  }

  return accessToken;
}

export async function syncCalendarList(
  accountId: string,
  userId: string,
  instanceId: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: account } = await supabase
    .from("google_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (!account) throw new Error("Google account not found");

  const accessToken = await getValidAccessToken(supabase, account);

  const res = await fetch(`${CALENDAR_LIST_URL}?minAccessRole=reader`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Calendar list fetch failed: ${await res.text()}`);

  const data = await res.json();
  const items: GoogleCalendarListEntry[] = data.items ?? [];

  if (items.length > 0) {
    const rows = items.map((item) => ({
      google_account_id: accountId,
      instance_id: instanceId,
      user_id: userId,
      google_calendar_id: item.id,
      name: item.summary,
      color: item.backgroundColor ?? null,
      description: item.description ?? null,
      access_role: item.accessRole,
      synced_at: new Date().toISOString(),
    }));

    await supabase
      .from("google_calendars")
      .upsert(rows, { onConflict: "google_account_id,google_calendar_id" });

    // Remove calendars no longer returned by Google
    const activeIds = items.map((i) => i.id);
    await supabase
      .from("google_calendars")
      .delete()
      .eq("google_account_id", accountId)
      .not("google_calendar_id", "in", `(${activeIds.map((id) => `"${id}"`).join(",")})`);
  }
}

export async function syncCalendar(
  accountId: string,
  calendarId: string,
  userId: string,
  instanceId: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: account } = await supabase
    .from("google_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (!account) throw new Error("Google account not found");

  const accessToken = await getValidAccessToken(supabase, account);

  // Fetch events: past 7 days to next 60 days
  const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    maxResults: "500",
  });

  const encodedCalId = encodeURIComponent(calendarId);
  const res = await fetch(
    `${CALENDAR_EVENTS_BASE}/${encodedCalId}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) throw new Error(`Calendar fetch failed: ${await res.text()}`);
  const data = await res.json();
  const events: GoogleCalendarApiEvent[] = data.items ?? [];

  if (events.length > 0) {
    const rows = events.map((event) => ({
      google_account_id: accountId,
      instance_id: instanceId,
      user_id: userId,
      google_event_id: event.id,
      calendar_id: calendarId,
      title: event.summary ?? "(No title)",
      description: event.description ?? null,
      start_at: event.start.dateTime ?? event.start.date!,
      end_at: event.end.dateTime ?? event.end.date!,
      all_day: !event.start.dateTime,
      location: event.location ?? null,
      color: event.colorId ?? null,
      recurrence: event.recurrence ?? null,
      synced_at: new Date().toISOString(),
    }));

    await supabase
      .from("google_calendar_events")
      .upsert(rows, { onConflict: "google_account_id,google_event_id" });
  }

  await supabase
    .from("google_accounts")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", accountId);
}

export async function syncAccount(
  accountId: string,
  userId: string,
  instanceId: string
): Promise<void> {
  await syncCalendar(accountId, "primary", userId, instanceId);
}
