import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { ArticleCard } from "@/modules/articles/components/article-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen } from "lucide-react";
import { saveArticle } from "./actions";

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("instance_id", instance.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Articles</h1>
      </div>

      <form action={async (formData) => { "use server"; await saveArticle(slug, formData); }} className="flex gap-2">
        <Input
          name="url"
          type="url"
          placeholder="Paste an article or YouTube URL..."
          required
          className="flex-1"
        />
        <Button type="submit">Save Article</Button>
      </form>

      {articles && articles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} slug={slug} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No articles yet"
          description="Save your first article by pasting a URL above."
        />
      )}
    </div>
  );
}
