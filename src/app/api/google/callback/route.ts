import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode, fetchGoogleUserInfo } from "@/modules/google-calendar/lib/oauth";
import { verifyState, encryptToken } from "@/modules/google-calendar/lib/encryption";
import { syncAccount } from "@/modules/google-calendar/lib/sync";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(new URL("/i", request.url));
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  // Verify state
  let slug: string;
  try {
    const payload = verifyState(state);
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    slug = decoded.slug;
  } catch {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  // Verify authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  // Exchange code for tokens
  const tokens = await exchangeCode(code);
  const userInfo = await fetchGoogleUserInfo(tokens.access_token);

  // Resolve instance_id from slug
  const { data: instance } = await supabase
    .from("instances")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!instance) return NextResponse.json({ error: "Instance not found" }, { status: 404 });

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Upsert google_accounts row
  const { data: account, error: upsertError } = await supabase
    .from("google_accounts")
    .upsert(
      {
        user_id: user.id,
        instance_id: instance.id,
        google_email: userInfo.email,
        access_token: encryptToken(tokens.access_token),
        refresh_token: encryptToken(tokens.refresh_token ?? ""),
        token_expires_at: expiresAt,
        scopes: tokens.scope.split(" "),
      },
      { onConflict: "user_id,instance_id,google_email" }
    )
    .select("id")
    .single();

  if (upsertError || !account) {
    return NextResponse.json({ error: "Failed to save account" }, { status: 500 });
  }

  // Trigger initial sync (non-blocking — don't await, redirect immediately)
  syncAccount(account.id).catch(console.error);

  return NextResponse.redirect(
    new URL(`/i/${slug}/settings?connected=google`, request.url)
  );
}
