import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Validates an API key from the request (Bearer header or ?key= param) and
 * returns the associated userId and instanceId without requiring a template ID.
 *
 * Used by ad-hoc endpoints that operate on a supplied config rather than a
 * stored template.
 */
export async function authenticateKeyRequest(
  request: NextRequest,
  requiredScope: string
): Promise<{ userId: string; instanceId: string } | NextResponse> {
  // 1. Try session cookie first
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Session auth — but we have no template to derive instanceId from.
    // Caller must supply ?instance_id= so we know which workspace to query.
    const instanceId = request.nextUrl.searchParams.get("instance_id");
    if (!instanceId) {
      return NextResponse.json(
        { error: "instance_id query parameter required for session auth" },
        { status: 400 }
      );
    }
    return { userId: user.id, instanceId };
  }

  // 2. Extract API key from Authorization: Bearer or ?key= param
  let rawKey: string | null = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    rawKey = authHeader.slice(7);
  } else {
    rawKey = request.nextUrl.searchParams.get("key");
  }

  if (!rawKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. SHA-256 hash the raw key
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 4. Look up key
  const serviceClient = createServiceRoleClient();
  const { data: apiKey } = await serviceClient
    .from("newspaper_api_keys")
    .select("id, user_id, instance_id, scopes")
    .eq("key_hash", keyHash)
    .single();

  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!apiKey.scopes.includes(requiredScope)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 5. Fire-and-forget: update last_used_at
  serviceClient
    .from("newspaper_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id)
    .then(() => {});

  return { userId: apiKey.user_id, instanceId: apiKey.instance_id };
}

export async function authenticateApiRequest(
  request: NextRequest,
  templateId: string,
  requiredScope: string
): Promise<{ userId: string; instanceId: string } | NextResponse> {
  // 1. Try session cookie first
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const serviceClient = createServiceRoleClient();
    const { data: template } = await serviceClient
      .from("newspaper_templates")
      .select("id, instance_id")
      .eq("id", templateId)
      .single();

    if (!template) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return { userId: user.id, instanceId: template.instance_id };
  }

  // 2. Extract API key from Authorization: Bearer or ?key= param
  let rawKey: string | null = null;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    rawKey = authHeader.slice(7);
  } else {
    rawKey = request.nextUrl.searchParams.get("key");
  }

  if (!rawKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. SHA-256 hash the raw key
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // 4. Look up key by hash (service role — pre-auth, bypasses RLS)
  const serviceClient = createServiceRoleClient();
  const { data: apiKey } = await serviceClient
    .from("newspaper_api_keys")
    .select("id, user_id, instance_id, scopes")
    .eq("key_hash", keyHash)
    .single();

  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 5. Scope check
  if (!apiKey.scopes.includes(requiredScope)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 6. Verify template exists and belongs to the same instance as the key
  const { data: template } = await serviceClient
    .from("newspaper_templates")
    .select("id, instance_id")
    .eq("id", templateId)
    .single();

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (template.instance_id !== apiKey.instance_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 7. Fire-and-forget: update last_used_at
  serviceClient
    .from("newspaper_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id)
    .then(() => {});

  return { userId: apiKey.user_id, instanceId: apiKey.instance_id };
}
