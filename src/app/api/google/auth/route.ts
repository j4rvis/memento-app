import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl, buildState } from "@/modules/google-calendar/lib/oauth";

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

  const state = buildState(user.id, slug);
  return NextResponse.redirect(buildAuthUrl(state));
}
