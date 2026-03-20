import { notFound } from "next/navigation";
import { resolveInstance } from "@/lib/instance/server";
import { createClient } from "@/lib/supabase/server";
import { NewspaperEditorClient } from "@/modules/newspaper/components/newspaper-editor-client";
import type { NewspaperConfig } from "@/modules/newspaper/lib/types";

export default async function NewspaperEditorPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("newspaper_templates")
    .select("id, name, config")
    .eq("id", id)
    .eq("instance_id", instance.id)
    .single();

  if (error || !data) notFound();

  return (
    <NewspaperEditorClient
      slug={slug}
      templateId={data.id}
      initialName={data.name}
      initialConfig={data.config as NewspaperConfig}
    />
  );
}
