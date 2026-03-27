import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateApiToken, requireScope } from "@/lib/api/auth";
import { ok, noContent, notFound } from "@/lib/api/response";
import { API_SCOPES } from "@/lib/api/types";

const BOOKMARK_FIELDS =
  "id,url,title,excerpt,author,site_name,content_type,is_read,is_archived,created_at";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.BOOKMARKS_READ);
  if (scopeCheck) return scopeCheck;

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("articles")
    .select(BOOKMARK_FIELDS)
    .eq("id", id)
    .eq("instance_id", auth.instanceId)
    .single();

  if (error || !data) return notFound("Bookmark not found");

  return ok(data);
}

export async function DELETE(request: Request, { params }: Params): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.BOOKMARKS_WRITE);
  if (scopeCheck) return scopeCheck;

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("id", id)
    .eq("instance_id", auth.instanceId)
    .single();

  if (!existing) return notFound("Bookmark not found");

  await supabase.from("articles").delete().eq("id", id).eq("instance_id", auth.instanceId);

  return noContent();
}
