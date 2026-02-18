import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { ArticlesPageClient } from "@/modules/articles/components/articles-page-client";

export default async function ArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { slug } = await params;
  const { category: categoryFilter } = await searchParams;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  // Fetch all non-archived articles to compute counts
  const { data: allArticles } = await supabase
    .from("articles")
    .select("id, category")
    .eq("instance_id", instance.id)
    .eq("is_archived", false);

  // Fetch filtered articles
  let query = supabase
    .from("articles")
    .select("*")
    .eq("instance_id", instance.id)
    .eq("is_archived", false);

  if (categoryFilter) {
    query = query.eq("category", categoryFilter);
  }

  const { data: articles } = await query.order("created_at", { ascending: false });

  return (
    <ArticlesPageClient
      initialArticles={articles ?? []}
      initialAllArticles={allArticles ?? []}
      categoryFilter={categoryFilter}
    />
  );
}
