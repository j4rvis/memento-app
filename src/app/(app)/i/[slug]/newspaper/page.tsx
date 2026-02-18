import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { NewspapersPageClient } from "@/modules/newspaper/components/newspapers-page-client";

export default async function NewspaperPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const { data: newspapers } = await supabase
    .from("newspapers")
    .select("*, newspaper_blocks(count)")
    .eq("instance_id", instance.id)
    .order("created_at", { ascending: false });

  return <NewspapersPageClient initialNewspapers={newspapers ?? []} />;
}
