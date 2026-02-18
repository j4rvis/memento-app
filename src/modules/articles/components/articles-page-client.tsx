"use client";

import { useArticles, useArticleCounts } from "../lib/hooks";
import { ArticleCard } from "./article-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { RefreshButton } from "@/components/shared/refresh-button";
import { BookOpen, Folder, UtensilsCrossed, FileText, Video, LinkIcon } from "lucide-react";
import { saveArticle } from "@/app/(app)/i/[slug]/articles/actions";
import { useInstanceSlug } from "@/lib/instance/context";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ARTICLE_FOLDERS = ["Recipes", "Articles", "Videos", "Links"] as const;

const FOLDER_ICONS: Record<string, typeof Folder> = {
  Recipes: UtensilsCrossed,
  Articles: FileText,
  Videos: Video,
  Links: LinkIcon,
};

export function ArticlesPageClient({
  initialArticles,
  initialAllArticles,
  categoryFilter,
}: {
  initialArticles: unknown[];
  initialAllArticles: unknown[];
  categoryFilter?: string;
}) {
  const slug = useInstanceSlug();
  const { data: allArticles } = useArticleCounts(initialAllArticles);
  const { data: articles } = useArticles(categoryFilter, initialArticles);

  const displayAll = (allArticles ?? initialAllArticles) as { id: string; category: string }[];
  const displayArticles = (articles ?? initialArticles) as { id: string }[];

  const totalCount = displayAll.length;
  const folderCounts: Record<string, number> = {};
  for (const folder of ARTICLE_FOLDERS) {
    folderCounts[folder] = displayAll.filter((a) => a.category === folder).length;
  }

  return (
    <div className="space-y-4">
      <form action={async (formData) => { await saveArticle(slug, formData); }} className="flex gap-2">
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
          {displayArticles.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {(displayArticles as { id: string; [key: string]: unknown }[]).map((article) => (
                <ArticleCard key={article.id} article={article as never} slug={slug} />
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
