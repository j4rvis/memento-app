import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authorization } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { data: memberships } = await supabase
    .from("instance_memberships")
    .select("instance_id, role, instances(name, slug)")
    .eq("user_id", user.id)
    .order("role", { ascending: true });

  if (!memberships?.length) {
    return NextResponse.json({ instances: [] });
  }

  const instances = memberships.map((m) => {
    const inst = m.instances as unknown as { name: string; slug: string };
    return {
      id: m.instance_id,
      name: inst.name,
      slug: inst.slug,
      role: m.role,
    };
  });

  return NextResponse.json({ instances });
}
