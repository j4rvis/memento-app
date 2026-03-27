import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateApiToken, requireScope } from "@/lib/api/auth";
import { ok, notFound } from "@/lib/api/response";
import { API_SCOPES } from "@/lib/api/types";

const ENTRY_FIELDS =
  "id,title,url,summary,author,published_at,is_read,is_starred,created_at";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.FEEDS_READ);
  if (scopeCheck) return scopeCheck;

  const { id: feedId } = await params;
  const supabase = createServiceRoleClient();

  // Verify feed exists and belongs to instance
  const { data: feed } = await supabase
    .from("feeds")
    .select("id")
    .eq("id", feedId)
    .eq("instance_id", auth.instanceId)
    .single();

  if (!feed) return notFound("Feed not found");

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const isReadParam = url.searchParams.get("is_read");

  let query = supabase
    .from("feed_entries")
    .select(ENTRY_FIELDS)
    .eq("feed_id", feedId)
    .eq("instance_id", auth.instanceId);

  if (isReadParam !== null) {
    query = query.eq("is_read", isReadParam === "true");
  }

  const { data, error } = await query
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return ok(data ?? []);
}
