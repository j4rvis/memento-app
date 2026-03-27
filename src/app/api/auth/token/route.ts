import { createHash } from "crypto";
import { SignJWT } from "jose";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ok, unauthorized, badRequest } from "@/lib/api/response";

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON");
  }

  if (typeof body !== "object" || body === null) {
    return badRequest("Request body must be an object");
  }

  const { client_id, client_secret } = body as Record<string, unknown>;

  if (!client_id || typeof client_id !== "string") {
    return badRequest("client_id is required");
  }
  if (!client_secret || typeof client_secret !== "string") {
    return badRequest("client_secret is required");
  }

  const supabase = createServiceRoleClient();
  const { data: client } = await supabase
    .from("api_clients")
    .select("*")
    .eq("client_id", client_id)
    .single();

  if (!client || !client.is_active) {
    return unauthorized("INVALID_CREDENTIALS", "Invalid client credentials");
  }

  const hash = sha256(client_secret);
  if (hash !== client.client_secret_hash) {
    return unauthorized("INVALID_CREDENTIALS", "Invalid client credentials");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const token = await new SignJWT({
    instance_id: client.instance_id,
    scopes: client.scopes,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(client.user_id)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  // Update last_used_at (fire and forget)
  void supabase
    .from("api_clients")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", client.id);

  return ok({ access_token: token, token_type: "Bearer", expires_in: 86400 });
}
