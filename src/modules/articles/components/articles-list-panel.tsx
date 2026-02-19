"use client";

import { BookOpen, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState } from "@/components/shared/empty-state";
import { saveArticle } from "@/app/(app)/i/[slug]/articles/actions";
import { useInstanceSlug } from "@/lib/instance/context";
import { cn } from "@/lib/utils";
import { ArticleListItem } from "./article-list-item";
import type { Article, ArticleTag } from "../lib/types";

interface ArticlesListPanelProps {
  articles: Article[];
  selectedTagId: string | null;
  selectedArticleId: string | null;
  tags: ArticleTag[];
  onSelectTag: (id: string | null) => void;
  onSelectArticle: (id: string) => void;
}

export function ArticlesListPanel({
  articles,
  selectedTagId,
  selectedArticleId,
  tags,
  onSelectTag,
  onSelectArticle,
}: ArticlesListPanelProps) {
  const slug = useInstanceSlug();

  const isInbox = selectedTagId === "inbox";

  const filtered = isInbox
    ? articles.filter((a) => a.tag_id === null)
    : selectedTagId
      ? articles.filter((a) => a.tag_id === selectedTagId)
      : articles;

  const currentTagName = isInbox
    ? "Inbox"
    : selectedTagId
      ? (tags.find((t) => t.id === selectedTagId)?.name ?? "Tag")
      : "All Bookmarks";

  return (
    <div
      className={cn(
        "border-r flex flex-col overflow-hidden",
        selectedArticleId
          ? "hidden md:flex md:w-[260px] md:shrink-0"
          : "flex-1 md:flex md:w-[260px] md:flex-none md:shrink-0",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
        <span className="text-sm font-semibold truncate flex-1">{currentTagName}</span>
        <span className="text-xs text-muted-foreground shrink-0">({filtered.length})</span>
      </div>

      {/* Mobile tag selector */}
      <div className="md:hidden px-3 py-1.5 border-b shrink-0">
        <select
          className="w-full text-sm bg-background border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
          value={selectedTagId ?? ""}
          onChange={(e) => onSelectTag(e.target.value || null)}
        >
          <option value="inbox">Inbox (untagged)</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
          <option value="">All Bookmarks</option>
        </select>
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map((article) => {
            const tagName = article.tag_id
              ? (tags.find((t) => t.id === article.tag_id)?.name ?? undefined)
              : undefined;
            return (
              <ArticleListItem
                key={article.id}
                article={article}
                tagName={tagName}
                isSelected={selectedArticleId === article.id}
                onSelect={onSelectArticle}
              />
            );
          })
        ) : (
          <EmptyState
            icon={isInbox ? Inbox : BookOpen}
            title={
              isInbox
                ? "Inbox is empty"
                : selectedTagId
                  ? `No bookmarks in "${currentTagName}"`
                  : "No bookmarks yet"
            }
            description={
              isInbox
                ? "Drag a bookmark here to remove its tag, or all bookmarks already have tags."
                : selectedTagId
                  ? `Drag a bookmark onto "${currentTagName}" in the tag panel to add it here.`
                  : "Save your first bookmark by pasting a URL below."
            }
          />
        )}
      </div>

      {/* Save URL form — pinned at bottom */}
      <div className="px-3 py-2 border-t shrink-0">
        <form
          action={async (formData) => {
            await saveArticle(slug, formData);
          }}
          className="flex gap-1.5"
        >
          <Input
            name="url"
            type="url"
            placeholder="Paste URL to save..."
            required
            className="flex-1 h-8 text-xs"
          />
          <SubmitButton pendingText="..." size="sm" className="h-8 text-xs shrink-0">
            Save
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
