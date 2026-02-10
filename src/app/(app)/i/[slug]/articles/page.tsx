import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { ArticleCard } from "@/modules/articles/components/article-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { saveArticle } from "./actions";
import Link from "next/link";

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

  // Fetch distinct categories
  const { data: catRows } = await supabase
    .from("articles")
    .select("category")
    .eq("instance_id", instance.id)
    .not("category", "is", null);

  const categories = [...new Set(catRows?.map((r) => r.category as string) ?? [])].sort();

  // Fetch articles with optional category filter
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
    <div className="space-y-4">
      <form action={async (formData) => { "use server"; await saveArticle(slug, formData); }} className="flex gap-2">
        <Input
          name="url"
          type="url"
          placeholder="Paste an article or YouTube URL..."
          required
          className="flex-1"
        />
        <SubmitButton pendingText="Saving...">Save Article</SubmitButton>
      </form>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Articles</h1>
          <RefreshButton />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <Link href={`/i/${slug}/articles`}>
            <Badge
              variant={!categoryFilter ? "default" : "outline"}
              className="cursor-pointer"
            >
              All
            </Badge>
          </Link>
          {categories.map((cat) => (
            <Link key={cat} href={`/i/${slug}/articles?category=${encodeURIComponent(cat)}`}>
              <Badge
                variant={categoryFilter === cat ? "default" : "outline"}
                className="cursor-pointer"
              >
                {cat}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {articles && articles.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} slug={slug} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No articles yet"
          description={categoryFilter
            ? `No articles in "${categoryFilter}". Try a different category or save a new article.`
            : "Save your first article by pasting a URL above."
          }
        />
      )}
    </div>
  );
}
