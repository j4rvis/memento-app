import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { ArticleReader } from "@/modules/articles/components/article-reader";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const [{ data: article }, { data: tags }] = await Promise.all([
    supabase.from("articles").select("*").eq("id", id).single(),
    supabase
      .from("article_tags")
      .select("*")
      .eq("instance_id", instance.id)
      .order("name", { ascending: true }),
  ]);

  if (!article) notFound();

  // Mark as read (non-blocking, best-effort)
  if (!article.is_read) {
    try {
      await supabase
        .from("articles")
        .update({ is_read: true })
        .eq("id", id);
    } catch {
      // Silently ignore — viewing the article is more important than tracking read status
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/i/${slug}/articles`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Articles
        </Link>
      </Button>
      <ArticleReader article={article} slug={slug} initialTags={tags ?? []} />
    </div>
  );
}
