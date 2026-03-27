import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateKeyRequest } from "@/modules/newspaper/lib/api-auth";

/**
 * GET /api/newspaper/calendars
 *
 * Returns all Google accounts and their calendars for the authenticated
 * instance. Use the returned account_id and calendar names when building
 * configs for /api/newspaper/render or stored templates.
 *
 * Auth: API key (Bearer header or ?key= param) with scope "read:pdf",
 *       or session cookie + ?instance_id=<uuid>
 *
 * Response:
 * {
 *   "accounts": [
 *     {
 *       "account_id": "uuid",
 *       "email": "user@gmail.com",
 *       "calendars": [
 *         { "id": "calendar-google-id", "name": "Work", "color": "#4285F4" }
 *       ]
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateKeyRequest(request, "read:pdf");
  if (auth instanceof NextResponse) return auth;
  const { instanceId } = auth;

  const supabase = createServiceRoleClient();

  const { data: accounts, error } = await supabase
    .from("google_accounts")
    .select("id, google_email")
    .eq("instance_id", instanceId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch google_accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ accounts: [] });
  }

  const accountIds = accounts.map((a) => a.id);

  const { data: calendars, error: calError } = await supabase
    .from("google_calendars")
    .select("google_account_id, google_calendar_id, name, color")
    .in("google_account_id", accountIds)
    .order("name", { ascending: true });

  if (calError) {
    console.error("Failed to fetch google_calendars:", calError);
    return NextResponse.json({ error: "Failed to fetch calendars" }, { status: 500 });
  }

  const calendarsByAccount = new Map<string, { id: string; name: string; color: string | null }[]>();
  for (const cal of calendars ?? []) {
    const list = calendarsByAccount.get(cal.google_account_id) ?? [];
    list.push({
      id: cal.google_calendar_id as string,
      name: cal.name as string,
      color: cal.color as string | null,
    });
    calendarsByAccount.set(cal.google_account_id, list);
  }

  return NextResponse.json({
    accounts: accounts.map((account) => ({
      account_id: account.id,
      email: account.google_email,
      calendars: calendarsByAccount.get(account.id) ?? [],
    })),
  });
}
