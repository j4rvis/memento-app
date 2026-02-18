"use client";

import { BookOpen, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { RefreshButton } from "@/components/shared/refresh-button";
import { EmptyState } from "@/components/shared/empty-state";
import { saveArticle } from "@/app/(app)/i/[slug]/articles/actions";
import { useInstanceSlug } from "@/lib/instance/context";
import { ArticleCard } from "./article-card";
import type { Article, ArticleTag } from "../lib/types";

interface ArticlesListPanelProps {
  articles: Article[];
  selectedTagId: string | null;
  tags: ArticleTag[];
  onSelectTag: (id: string | null) => void;
}

export function ArticlesListPanel({
  articles,
  selectedTagId,
  tags,
  onSelectTag,
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
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">
            {currentTagName}
          </span>
          <span className="text-xs text-muted-foreground">
            ({filtered.length})
          </span>
        </div>
        <RefreshButton />
      </div>

      {/* Mobile tag selector */}
      <div className="md:hidden px-4 py-2 border-b shrink-0">
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

      {/* Save URL form */}
      <div className="px-4 py-3 border-b shrink-0">
        <form
          action={async (formData) => {
            await saveArticle(slug, formData);
          }}
          className="flex gap-2"
        >
          <Input
            name="url"
            type="url"
            placeholder="Paste a URL to bookmark..."
            required
            className="flex-1"
          />
          <SubmitButton pendingText="Saving...">Save</SubmitButton>
        </form>
      </div>

      {/* Article grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((article) => {
              const tagName = article.tag_id
                ? (tags.find((t) => t.id === article.tag_id)?.name ?? undefined)
                : undefined;
              return (
                <ArticleCard
                  key={article.id}
                  article={article}
                  slug={slug}
                  tagName={tagName}
                />
              );
            })}
          </div>
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
                  : "Save your first bookmark by pasting a URL above."
            }
          />
        )}
      </div>
    </div>
  );
}
