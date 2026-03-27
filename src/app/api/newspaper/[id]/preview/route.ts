import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { render } from "@/modules/newspaper/engine";
import { resolveConfig } from "@/modules/newspaper/lib/resolve-config";
import type { NewspaperConfig } from "@/modules/newspaper/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("newspaper_templates")
    .select("config, instance_id")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const config = data.config as NewspaperConfig;
    const instanceId = data.instance_id as string;
    const serviceClient = createServiceRoleClient();

    const resolvedConfig = await resolveConfig(config, {
      supabase: serviceClient,
      instanceId,
      userId: user.id,
    });

    const pdfBuffer = await render(resolvedConfig);
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("PDF render error:", err);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }
}
