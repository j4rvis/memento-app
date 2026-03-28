import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateApiToken, requireScope } from "@/lib/api/auth";
import { ok, noContent, notFound } from "@/lib/api/response";
import { API_SCOPES } from "@/lib/api/types";

const FEED_FIELDS = "id,title,url,site_url,description,last_fetched_at,provider,provider_resource_type,created_at";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.FEEDS_READ);
  if (scopeCheck) return scopeCheck;

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("feeds")
    .select(FEED_FIELDS)
    .eq("id", id)
    .eq("instance_id", auth.instanceId)
    .single();

  if (error || !data) return notFound("Feed not found");

  return ok(data);
}

export async function DELETE(request: Request, { params }: Params): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.FEEDS_WRITE);
  if (scopeCheck) return scopeCheck;

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("feeds")
    .select("id")
    .eq("id", id)
    .eq("instance_id", auth.instanceId)
    .single();

  if (!existing) return notFound("Feed not found");

  await supabase.from("feeds").delete().eq("id", id).eq("instance_id", auth.instanceId);

  return noContent();
}
