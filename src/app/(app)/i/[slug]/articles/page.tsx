import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { ArticlesLayout } from "@/modules/articles/components/articles-layout";

export default async function ArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ article?: string; tag?: string }>;
}) {
  const { slug } = await params;
  const { article: initialArticleId, tag: initialTagParam } = await searchParams;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const [{ data: articles }, { data: tags }] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, url, excerpt, author, site_name, content_type, category, tag_id, youtube_video_id, is_read, is_archived, created_at, instance_id, user_id")
      .eq("instance_id", instance.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(50),
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
        initialArticleId={initialArticleId ?? null}
        initialTagParam={initialTagParam ?? null}
      />
    </Suspense>
  );
}
