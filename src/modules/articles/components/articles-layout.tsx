"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { useInstance } from "@/lib/instance/context";
import { queryKeys } from "@/lib/query/keys";
import { setArticleTag } from "@/app/(app)/i/[slug]/articles/actions";
import { useArticles, useArticleTags } from "../lib/hooks";
import { TagsPanel } from "./tags-panel";
import { ArticlesListPanel } from "./articles-list-panel";
import { ArticleContentPanel } from "./article-content-panel";
import type { Article, ArticleTag } from "../lib/types";

interface ArticlesLayoutProps {
  initialArticles: Article[];
  initialTags: ArticleTag[];
  initialArticleId?: string | null;
  initialTagParam?: string | null;
}

export function ArticlesLayout({
  initialArticles,
  initialTags,
  initialArticleId,
  initialTagParam,
}: ArticlesLayoutProps) {
  const { instance, slug } = useInstance();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Derive selectedTagId from the raw tag param
  // no param → "inbox", "all" → null (all bookmarks), uuid → specific tag
  const [tagParam, setTagParam] = useState<string | null>(initialTagParam ?? null);
  const selectedTagId: string | null =
    tagParam === null ? "inbox" : tagParam === "all" ? null : tagParam;

  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    initialArticleId ?? null,
  );
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  const { data: tagsData } = useArticleTags(initialTags);
  const tags = (tagsData ?? initialTags) as ArticleTag[];

  const { data: articlesData } = useArticles(initialArticles as unknown[]);
  const articles = (articlesData ?? initialArticles) as Article[];

  const selectedArticle = selectedArticleId
    ? (articles.find((a) => a.id === selectedArticleId) ?? null)
    : null;

  // Keep URL in sync with state
  useEffect(() => {
    const params = new URLSearchParams();
    if (tagParam === "all") params.set("tag", "all");
    else if (tagParam) params.set("tag", tagParam);
    if (selectedArticleId) params.set("article", selectedArticleId);
    const query = params.toString();
    router.replace(`/i/${slug}/articles${query ? `?${query}` : ""}`);
  }, [selectedArticleId, tagParam, slug, router]);

  const handleSelectTag = useCallback((id: string | null) => {
    // "inbox" → null tagParam, null → "all", uuid → uuid
    const newTagParam = id === "inbox" ? null : id === null ? "all" : id;
    setTagParam(newTagParam);
    setSelectedArticleId(null);
  }, []);

  const handleSelectArticle = useCallback((id: string) => {
    setSelectedArticleId(id);
  }, []);

  const handleArticleGone = useCallback((id: string) => {
    if (selectedArticleId === id) {
      setSelectedArticleId(null);
    }
  }, [selectedArticleId]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const handleDragStart = useCallback(
    (event: { active: { id: string | number } }) => {
      const article = articles.find((a) => a.id === event.active.id);
      setActiveArticle(article ?? null);
    },
    [articles],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveArticle(null);
      const { active, over } = event;
      if (!over) return;

      const articleId = active.id as string;
      const dropId = over.id as string;
      // "remove-tag" (All Bookmarks) and "inbox" both clear the tag
      const newTagId = dropId === "remove-tag" || dropId === "inbox" ? null : dropId;

      // Optimistic update — triggers re-filter immediately
      queryClient.setQueryData(
        queryKeys.articles.list(instance.id),
        (old: Article[] | undefined) =>
          old?.map((a) => (a.id === articleId ? { ...a, tag_id: newTagId } : a)),
      );

      setArticleTag(slug, articleId, newTagId);
    },
    [slug, instance.id, queryClient],
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="-m-4 -mb-18 md:-m-6 md:-mb-6 h-[calc(100vh-3.5rem)] flex overflow-hidden border-t">
        <TagsPanel
          initialTags={initialTags}
          selectedTagId={selectedTagId}
          onSelectTag={handleSelectTag}
        />
        <ArticlesListPanel
          articles={articles}
          selectedTagId={selectedTagId}
          selectedArticleId={selectedArticleId}
          tags={tags}
          onSelectTag={handleSelectTag}
          onSelectArticle={handleSelectArticle}
        />
        <ArticleContentPanel
          article={selectedArticle}
          tags={tags}
          onBack={() => setSelectedArticleId(null)}
          onArticleGone={handleArticleGone}
          slug={slug}
        />
      </div>

      {/* Floating drag preview */}
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeArticle ? (
          <div className="rounded-md border bg-card px-3 py-2 shadow-lg text-sm font-medium max-w-[200px] truncate opacity-90 pointer-events-none">
            {activeArticle.title ?? "Untitled"}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
