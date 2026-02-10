import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { ArticleCard } from "@/modules/articles/components/article-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { RefreshButton } from "@/components/shared/refresh-button";
import { BookOpen, Folder, UtensilsCrossed, FileText, Video, LinkIcon } from "lucide-react";
import { saveArticle } from "./actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ARTICLE_FOLDERS = ["Recipes", "Articles", "Videos", "Links"] as const;

const FOLDER_ICONS: Record<string, typeof Folder> = {
  Recipes: UtensilsCrossed,
  Articles: FileText,
  Videos: Video,
  Links: LinkIcon,
};

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

  const totalCount = allArticles?.length ?? 0;
  const folderCounts: Record<string, number> = {};
  for (const folder of ARTICLE_FOLDERS) {
    folderCounts[folder] = allArticles?.filter((a) => a.category === folder).length ?? 0;
  }

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

      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold">
          {categoryFilter ?? "Articles"}
        </h1>
        <RefreshButton />
      </div>

      {/* Mobile: horizontal folder pills */}
      <div className="flex gap-1.5 overflow-x-auto md:hidden">
        <Link href={`/i/${slug}/articles`}>
          <div className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap border",
            !categoryFilter ? "bg-primary text-primary-foreground border-primary" : "border-border"
          )}>
            <Folder className="h-3.5 w-3.5" />
            All ({totalCount})
          </div>
        </Link>
        {ARTICLE_FOLDERS.map((folder) => {
          const Icon = FOLDER_ICONS[folder];
          return (
            <Link key={folder} href={`/i/${slug}/articles?category=${encodeURIComponent(folder)}`}>
              <div className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap border",
                categoryFilter === folder ? "bg-primary text-primary-foreground border-primary" : "border-border"
              )}>
                <Icon className="h-3.5 w-3.5" />
                {folder} ({folderCounts[folder]})
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop: sidebar + grid */}
      <div className="flex gap-6">
        {/* Sidebar - hidden on mobile */}
        <nav className="hidden md:block w-48 shrink-0">
          <div className="space-y-1 sticky top-4">
            <Link
              href={`/i/${slug}/articles`}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                !categoryFilter
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Folder className="h-4 w-4" />
              <span className="flex-1">All</span>
              <span className="text-xs opacity-70">{totalCount}</span>
            </Link>
            {ARTICLE_FOLDERS.map((folder) => {
              const Icon = FOLDER_ICONS[folder];
              return (
                <Link
                  key={folder}
                  href={`/i/${slug}/articles?category=${encodeURIComponent(folder)}`}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    categoryFilter === folder
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{folder}</span>
                  <span className="text-xs opacity-70">{folderCounts[folder]}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Article grid */}
        <div className="flex-1 min-w-0">
          {articles && articles.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} slug={slug} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title={categoryFilter ? `No ${categoryFilter.toLowerCase()} yet` : "No articles yet"}
              description={categoryFilter
                ? `Save an article and assign it to "${categoryFilter}" to see it here.`
                : "Save your first article by pasting a URL above."
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
