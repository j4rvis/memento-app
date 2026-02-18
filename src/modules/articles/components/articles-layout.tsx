"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import type { Article, ArticleTag } from "../lib/types";

interface ArticlesLayoutProps {
  initialArticles: Article[];
  initialTags: ArticleTag[];
}

export function ArticlesLayout({
  initialArticles,
  initialTags,
}: ArticlesLayoutProps) {
  const { instance, slug } = useInstance();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // No param → "inbox" (default), "all" → null (all bookmarks), uuid → specific tag
  const rawTag = searchParams.get("tag");
  const selectedTagId: string | null = rawTag === null ? "inbox" : rawTag === "all" ? null : rawTag;
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  const { data: tagsData } = useArticleTags(initialTags);
  const tags = (tagsData ?? initialTags) as ArticleTag[];

  const { data: articlesData } = useArticles(initialArticles as unknown[]);
  const articles = (articlesData ?? initialArticles) as Article[];

  const handleSelectTag = useCallback((id: string | null) => {
    const params = new URLSearchParams();
    if (id === null) params.set("tag", "all");       // null = All Bookmarks → ?tag=all
    else if (id !== "inbox") params.set("tag", id);  // uuid = specific tag
    // id === "inbox" → no param (default inbox)
    const query = params.toString();
    router.replace(`/i/${slug}/articles${query ? `?${query}` : ""}`);
  }, [slug, router]);

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
      const newTagId = (dropId === "remove-tag" || dropId === "inbox") ? null : dropId;

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
          tags={tags}
          onSelectTag={handleSelectTag}
        />
      </div>

      {/* Floating drag preview — snaps center to cursor */}
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
