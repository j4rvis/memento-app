import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyState, exchangeCode, fetchGoogleEmail } from "@/modules/google-calendar/lib/oauth";
import { encryptToken } from "@/modules/google-calendar/lib/encryption";
import { syncAccount } from "@/modules/google-calendar/lib/sync";

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

  try {
    ({ userId, slug } = verifyState(state));
  } catch {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  let tokens;
  try {
    tokens = await exchangeCode(code);
  } catch {
    return NextResponse.redirect(
      new URL(`/i/${slug}/settings?error=google_auth_failed`, origin)
    );
  }

  const email = await fetchGoogleEmail(tokens.access_token);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const supabase = createServiceRoleClient();

  const { data: instance } = await supabase
    .from("instances")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!instance) {
    return NextResponse.json({ error: "Instance not found" }, { status: 404 });
  }

  const { data: account, error: upsertError } = await supabase
    .from("google_accounts")
    .upsert(
      {
        user_id: userId,
        instance_id: instance.id,
        google_email: email,
        access_token: encryptToken(tokens.access_token),
        refresh_token: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
        token_expires_at: expiresAt,
        scopes: tokens.scope.split(" "),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,instance_id,google_email" }
    )
    .select("id")
    .single();

  if (upsertError || !account) {
    return NextResponse.redirect(
      new URL(`/i/${slug}/settings?error=google_save_failed`, origin)
    );
  }

  // Fire-and-forget initial sync
  syncAccount(account.id, userId, instance.id).catch(console.error);

  return NextResponse.redirect(new URL(`/i/${slug}/settings`, origin));
}
