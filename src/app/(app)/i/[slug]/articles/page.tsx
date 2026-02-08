import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { ArticleCard } from "@/modules/articles/components/article-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { RefreshButton } from "@/components/shared/refresh-button";
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
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Articles</h1>
          <RefreshButton />
        </div>
      </div>

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
