import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateApiToken, requireScope } from "@/lib/api/auth";
import { ok, created, unprocessable } from "@/lib/api/response";
import { API_SCOPES } from "@/lib/api/types";

export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.TODOS_READ);
  if (scopeCheck) return scopeCheck;

  const supabase = createServiceRoleClient();
  const { data, error, count } = await supabase
    .from("todos")
    .select("id,title,description,is_completed,priority,due_date,project_id,created_at,updated_at", { count: "exact" })
    .eq("instance_id", auth.instanceId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ok(data ?? [], { total: count ?? 0 });
}

export async function POST(request: Request): Promise<Response> {
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

  const { title, description, priority, due_date, project_id } = body;

  if (!title || typeof title !== "string") {
    return unprocessable("title is required");
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("todos")
    .insert({
      title,
      description: description ?? null,
      priority: typeof priority === "number" ? priority : 0,
      due_date: due_date ?? null,
      project_id: project_id ?? null,
      instance_id: auth.instanceId,
      user_id: auth.userId,
      is_completed: false,
    })
    .select("id,title,description,is_completed,priority,due_date,project_id,created_at,updated_at")
    .single();

  if (error) throw error;

  return created(data);
}
