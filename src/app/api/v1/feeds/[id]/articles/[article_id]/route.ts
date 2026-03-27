import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateApiToken, requireScope } from "@/lib/api/auth";
import { ok, noContent, notFound, unprocessable } from "@/lib/api/response";
import { API_SCOPES } from "@/lib/api/types";

const ENTRY_FIELDS =
  "id,title,url,summary,author,published_at,is_read,is_starred,created_at";

type Params = { params: Promise<{ id: string; article_id: string }> };

async function findEntry(supabase: ReturnType<typeof import("@/lib/supabase/server").createServiceRoleClient>, feedId: string, articleId: string, instanceId: string) {
  const { data } = await supabase
    .from("feed_entries")
    .select(ENTRY_FIELDS)
    .eq("id", articleId)
    .eq("feed_id", feedId)
    .eq("instance_id", instanceId)
    .single();
  return data;
}

export async function GET(request: Request, { params }: Params): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.FEEDS_READ);
  if (scopeCheck) return scopeCheck;

  const { id: feedId, article_id: articleId } = await params;
  const supabase = createServiceRoleClient();
  const entry = await findEntry(supabase, feedId, articleId, auth.instanceId);

  if (!entry) return notFound("Article not found");

  return ok(entry);
}

export async function PATCH(request: Request, { params }: Params): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.FEEDS_WRITE);
  if (scopeCheck) return scopeCheck;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return unprocessable("Request body must be valid JSON");
  }

  const updates: Record<string, unknown> = {};
  if ("is_read" in body) updates.is_read = body.is_read;
  if ("is_starred" in body) updates.is_starred = body.is_starred;

  if (Object.keys(updates).length === 0) {
    return unprocessable("At least one of is_read or is_starred is required");
  }

  const { id: feedId, article_id: articleId } = await params;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("feed_entries")
    .update(updates)
    .eq("id", articleId)
    .eq("feed_id", feedId)
    .eq("instance_id", auth.instanceId)
    .select(ENTRY_FIELDS)
    .single();

  if (error || !data) return notFound("Article not found");

  return ok(data);
}

export async function DELETE(request: Request, { params }: Params): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.FEEDS_WRITE);
  if (scopeCheck) return scopeCheck;

  const { id: feedId, article_id: articleId } = await params;
  const supabase = createServiceRoleClient();

  const entry = await findEntry(supabase, feedId, articleId, auth.instanceId);
  if (!entry) return notFound("Article not found");

  await supabase
    .from("feed_entries")
    .delete()
    .eq("id", articleId)
    .eq("feed_id", feedId)
    .eq("instance_id", auth.instanceId);

  return noContent();
}
