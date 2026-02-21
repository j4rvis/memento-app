"use client";

import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Archive, ExternalLink, Trash2, Tag, BookmarkX } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useInstance } from "@/lib/instance/context";
import { queryKeys } from "@/lib/query/keys";
import { toggleRead, toggleArchive, deleteArticle, setArticleTag } from "@/app/(app)/i/[slug]/articles/actions";
import { formatDate } from "@/lib/format";
import type { Article, ArticleTag } from "../lib/types";

function getInstagramEmbedUrl(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? `https://www.instagram.com/p/${match[1]}/embed/` : null;
}

function getInstagramShortTitle(author: string | null, createdAt: string): string {
  const date = new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (author) return `Instagram by ${author} · ${date}`;
  return `Instagram · ${date}`;
}

interface ArticleContentPanelProps {
  article: Article | null;
  tags: ArticleTag[];
  onBack: () => void;
  onArticleGone: (id: string) => void;
  slug: string;
}

export function ArticleContentPanel({
  article,
  tags,
  onBack,
  onArticleGone,
  slug,
}: ArticleContentPanelProps) {
  const { instance } = useInstance();
  const queryClient = useQueryClient();

  // Auto-mark as read when article opens
  useEffect(() => {
    if (!article || article.is_read) return;

    // Optimistic update
    queryClient.setQueryData(
      queryKeys.articles.list(instance.id),
      (old: Article[] | undefined) =>
        old?.map((a) => (a.id === article.id ? { ...a, is_read: true } : a)),
    );
    // Server update (toggleRead flips; current value is false → sets to true)
    toggleRead(slug, article.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id]);

  const handleToggleRead = useCallback(() => {
    if (!article) return;
    queryClient.setQueryData(
      queryKeys.articles.list(instance.id),
      (old: Article[] | undefined) =>
        old?.map((a) => (a.id === article.id ? { ...a, is_read: !a.is_read } : a)),
    );
    toggleRead(slug, article.id);
  }, [article, slug, instance.id, queryClient]);

  const handleArchive = useCallback(() => {
    if (!article) return;
    // Remove from list (archived articles are filtered out of the main list)
    queryClient.setQueryData(
      queryKeys.articles.list(instance.id),
      (old: Article[] | undefined) => old?.filter((a) => a.id !== article.id),
    );
    onArticleGone(article.id);
    toggleArchive(slug, article.id);
  }, [article, slug, instance.id, queryClient, onArticleGone]);

  const handleDelete = useCallback(() => {
    if (!article) return;
    queryClient.setQueryData(
      queryKeys.articles.list(instance.id),
      (old: Article[] | undefined) => old?.filter((a) => a.id !== article.id),
    );
    onArticleGone(article.id);
    deleteArticle(slug, article.id);
  }, [article, slug, instance.id, queryClient, onArticleGone]);

  const handleTagChange = useCallback((tagId: string | null) => {
    if (!article) return;
    queryClient.setQueryData(
      queryKeys.articles.list(instance.id),
      (old: Article[] | undefined) =>
        old?.map((a) => (a.id === article.id ? { ...a, tag_id: tagId } : a)),
    );
    setArticleTag(slug, article.id, tagId);
  }, [article, slug, instance.id, queryClient]);

  if (!article) {
    return (
      <div className="hidden md:flex flex-1 min-w-0 items-center justify-center text-muted-foreground">
        <div className="text-center">
          <BookmarkX className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Select a bookmark to read</p>
        </div>
      </div>
    );
  }

  const instagramEmbedUrl = getInstagramEmbedUrl(article.url);
  const contentLabel =
    article.content_type === "other" && article.site_name
      ? article.site_name
      : article.content_type;
  const currentTag = tags.find((t) => t.id === article.tag_id);

  return (
    <div className={cn("flex-1 min-w-0 flex flex-col overflow-hidden")}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b shrink-0 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 md:hidden"
          onClick={onBack}
          title="Back to bookmarks"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={handleToggleRead}
          title={article.is_read ? "Mark unread" : "Mark read"}
        >
          <BookOpen className="h-3.5 w-3.5 mr-1" />
          {article.is_read ? "Unread" : "Read"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={handleArchive}
          title="Archive"
        >
          <Archive className="h-3.5 w-3.5 mr-1" />
          Archive
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" asChild>
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Original
          </a>
        </Button>
        <div className="flex items-center gap-1">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={article.tag_id ?? ""}
            onChange={(e) => handleTagChange(e.target.value || null)}
            className="h-7 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="">No tag</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={handleDelete}
          title="Delete bookmark"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-3xl mx-auto w-full">
        {/* Metadata */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant="secondary">{contentLabel}</Badge>
          {currentTag && <Badge variant="outline">{currentTag.name}</Badge>}
          {article.content_type !== "other" && article.site_name && (
            <span className="text-sm text-muted-foreground">{article.site_name}</span>
          )}
          {article.author && (
            <span className="text-sm text-muted-foreground">by {article.author}</span>
          )}
          <span className="text-sm text-muted-foreground">{formatDate(article.created_at)}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-5">
          {instagramEmbedUrl
            ? getInstagramShortTitle(article.author, article.created_at)
            : (article.title || "Untitled")}
        </h1>

        {/* Content */}
        {article.content_type === "youtube" && article.youtube_video_id ? (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${article.youtube_video_id}`}
              className="h-full w-full rounded-lg"
              loading="lazy"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : instagramEmbedUrl ? (
          <div className="flex gap-6 flex-col sm:flex-row items-start justify-center">
            <div className="flex justify-center shrink-0">
              <iframe
                src={instagramEmbedUrl}
                className="rounded-lg border-0"
                width="400"
                height="520"
                loading="lazy"
                allowFullScreen
              />
            </div>
            {article.title && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed sm:max-w-xs">
                {article.title}
              </p>
            )}
          </div>
        ) : article.content ? (
          <article
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          <p className="text-muted-foreground">No content available.</p>
        )}
      </div>
    </div>
  );
}
