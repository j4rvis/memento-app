import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateApiToken, requireScope } from "@/lib/api/auth";
import { ok, notFound, unprocessable } from "@/lib/api/response";
import { API_SCOPES } from "@/lib/api/types";
import { resolveConfig } from "@/modules/newspaper/lib/resolve-config";
import { render } from "@/modules/newspaper/engine";
import type { NewspaperConfig } from "@/modules/newspaper/lib/types";

export async function POST(request: Request): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.NEWSPAPER_WRITE);
  if (scopeCheck) return scopeCheck;

  const url = new URL(request.url);
  const formatJson = url.searchParams.get("format") === "json";

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return unprocessable("Request body must be valid JSON");
  }

  const { template_id, config: inlineConfig } = body;

  if (!template_id && !inlineConfig) {
    return unprocessable("Either template_id or config is required");
  }

  const supabase = createServiceRoleClient();
  let config: NewspaperConfig;

  if (template_id) {
    const { data: template } = await supabase
      .from("newspaper_templates")
      .select("config")
      .eq("id", template_id)
      .eq("instance_id", auth.instanceId)
      .single();

    if (!template) return notFound("Template not found");
    config = template.config as NewspaperConfig;
  } else {
    config = inlineConfig as NewspaperConfig;
  }

  const resolvedConfig = await resolveConfig(config, {
    supabase,
    instanceId: auth.instanceId,
    userId: auth.userId,
  });

  const pdfBuffer = await render(resolvedConfig);
  const size_bytes = Buffer.isBuffer(pdfBuffer)
    ? pdfBuffer.length
    : (pdfBuffer as ArrayBuffer).byteLength;

  if (formatJson) {
    return ok({ generated_at: new Date().toISOString(), size_bytes });
  }

  return new Response(pdfBuffer, {
    status: 200,
    headers: { "content-type": "application/pdf" },
  });
}
