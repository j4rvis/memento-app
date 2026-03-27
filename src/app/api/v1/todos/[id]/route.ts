import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateApiToken, requireScope } from "@/lib/api/auth";
import { ok, noContent, notFound, unprocessable } from "@/lib/api/response";
import { API_SCOPES } from "@/lib/api/types";

const TODO_FIELDS =
  "id,title,description,is_completed,priority,due_date,project_id,created_at,updated_at";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.TODOS_READ);
  if (scopeCheck) return scopeCheck;

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("todos")
    .select(TODO_FIELDS)
    .eq("id", id)
    .eq("instance_id", auth.instanceId)
    .single();

  if (error || !data) return notFound("Todo not found");

  return ok(data);
}

export async function PUT(request: Request, { params }: Params): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.TODOS_WRITE);
  if (scopeCheck) return scopeCheck;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return unprocessable("Request body must be valid JSON");
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const allowed = ["title", "description", "is_completed", "priority", "due_date", "project_id"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("todos")
    .update(updates)
    .eq("id", id)
    .eq("instance_id", auth.instanceId)
    .select(TODO_FIELDS)
    .single();

  if (error || !data) return notFound("Todo not found");

  return ok(data);
}

export async function DELETE(request: Request, { params }: Params): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.TODOS_WRITE);
  if (scopeCheck) return scopeCheck;

  const { id } = await params;
  const supabase = createServiceRoleClient();

  // Check existence first
  const { data: existing } = await supabase
    .from("todos")
    .select("id")
    .eq("id", id)
    .eq("instance_id", auth.instanceId)
    .single();

  if (!existing) return notFound("Todo not found");

  await supabase.from("todos").delete().eq("id", id).eq("instance_id", auth.instanceId);

  return noContent();
}
