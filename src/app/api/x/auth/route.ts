import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl, buildState, generatePKCE } from "@/modules/external-feeds/lib/x-oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = buildState(user.id, slug, codeVerifier);
  return NextResponse.redirect(buildAuthUrl(state, codeChallenge));
}
