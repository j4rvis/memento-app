import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateApiToken, requireScope } from "@/lib/api/auth";
import { ok } from "@/lib/api/response";
import { API_SCOPES } from "@/lib/api/types";

export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.GOOGLE_READ);
  if (scopeCheck) return scopeCheck;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("google_accounts")
    .select("id, google_email, created_at")
    .eq("instance_id", auth.instanceId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ok(
    (data ?? []).map((a) => ({
      id: a.id,
      email: a.google_email,
      created_at: a.created_at,
    }))
  );
}
