import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { ArticlesLayout } from "@/modules/articles/components/articles-layout";

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const [{ data: articles }, { data: tags }] = await Promise.all([
    supabase
      .from("articles")
      .select("*")
      .eq("instance_id", instance.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("article_tags")
      .select("*")
      .eq("instance_id", instance.id)
      .order("name", { ascending: true }),
  ]);

  return (
    <Suspense>
      <ArticlesLayout
        initialArticles={articles ?? []}
        initialTags={tags ?? []}
      />
    </Suspense>
  );
}
