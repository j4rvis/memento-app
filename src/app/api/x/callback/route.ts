import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyState, exchangeCode } from "@/modules/external-feeds/lib/x-oauth";
import { fetchAuthenticatedUser } from "@/modules/external-feeds/lib/x-api";
import { encryptToken } from "@/modules/external-feeds/lib/encryption";

const X_TOKEN_SECRET = process.env.X_TOKEN_SECRET!;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, origin));
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  let userId: string;
  let slug: string;
  let codeVerifier: string;

  try {
    ({ userId, slug, codeVerifier } = verifyState(state));
  } catch {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  let tokens;
  try {
    tokens = await exchangeCode(code, codeVerifier);
  } catch {
    return NextResponse.redirect(
      new URL(`/i/${slug}/settings/integrations?error=x_auth_failed`, origin)
    );
  }

  let xUser;
  try {
    xUser = await fetchAuthenticatedUser(tokens.access_token);
  } catch {
    return NextResponse.redirect(
      new URL(`/i/${slug}/settings/integrations?error=x_auth_failed`, origin)
    );
  }

  const supabase = createServiceRoleClient();

  const { data: instance } = await supabase
    .from("instances")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!instance) {
    return NextResponse.json({ error: "Instance not found" }, { status: 404 });
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error: upsertError } = await supabase
    .from("external_connections")
    .upsert(
      {
        user_id: userId,
        instance_id: instance.id,
        provider: "x",
        provider_user_id: xUser.id,
        provider_username: xUser.username,
        access_token: encryptToken(tokens.access_token, X_TOKEN_SECRET),
        refresh_token: tokens.refresh_token
          ? encryptToken(tokens.refresh_token, X_TOKEN_SECRET)
          : null,
        token_expires_at: expiresAt,
        scopes: tokens.scope.split(" "),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,instance_id,provider" }
    );

  if (upsertError) {
    return NextResponse.redirect(
      new URL(`/i/${slug}/settings/integrations?error=x_save_failed`, origin)
    );
  }

  return NextResponse.redirect(
    new URL(`/i/${slug}/settings/integrations?connected=x`, origin)
  );
}
