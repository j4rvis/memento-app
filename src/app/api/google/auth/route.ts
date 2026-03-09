import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl } from "@/modules/google-calendar/lib/oauth";
import { signState } from "@/modules/google-calendar/lib/encryption";
import { randomBytes } from "crypto";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const nonce = randomBytes(16).toString("hex");
  const payload = Buffer.from(JSON.stringify({ userId: user.id, slug, nonce })).toString(
    "base64url"
  );
  const state = signState(payload);

  return NextResponse.redirect(buildAuthUrl(state));
}
