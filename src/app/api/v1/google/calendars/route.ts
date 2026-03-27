import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateApiToken, requireScope } from "@/lib/api/auth";
import { ok } from "@/lib/api/response";
import { API_SCOPES } from "@/lib/api/types";

export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.GOOGLE_READ);
  if (scopeCheck) return scopeCheck;

  const url = new URL(request.url);
  const accountIdFilter = url.searchParams.get("account_id");

  const supabase = createServiceRoleClient();

  let accountQuery = supabase
    .from("google_accounts")
    .select("id, google_email")
    .eq("instance_id", auth.instanceId);

  if (accountIdFilter) {
    accountQuery = accountQuery.eq("id", accountIdFilter);
  }

  const { data: accounts, error: acctError } = await accountQuery.order("created_at", { ascending: true });
  if (acctError) throw acctError;

  if (!accounts || accounts.length === 0) {
    return ok([]);
  }

  const accountIds = accounts.map((a) => a.id);
  const { data: calendars, error: calError } = await supabase
    .from("google_calendars")
    .select("google_account_id, google_calendar_id, name, color")
    .in("google_account_id", accountIds)
    .order("name", { ascending: true });

  if (calError) throw calError;

  const calendarsByAccount = new Map<string, { google_calendar_id: string; name: string; color: string | null }[]>();
  for (const cal of calendars ?? []) {
    const list = calendarsByAccount.get(cal.google_account_id) ?? [];
    list.push({
      google_calendar_id: cal.google_calendar_id,
      name: cal.name,
      color: cal.color,
    });
    calendarsByAccount.set(cal.google_account_id, list);
  }

  return ok(
    accounts.map((account) => ({
      account_id: account.id,
      email: account.google_email,
      calendars: calendarsByAccount.get(account.id) ?? [],
    }))
  );
}
