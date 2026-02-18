"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  toggleRead,
  toggleArchive,
  deleteArticle,
  updateArticle,
  setArticleTag,
} from "@/app/(app)/i/[slug]/articles/actions";
import { Archive, BookOpen, ExternalLink, Trash2, Edit, Eye, Save, Tag } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useArticleTags } from "../lib/hooks";
import type { ArticleTag } from "../lib/types";

function getInstagramEmbedUrl(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? `https://www.instagram.com/p/${match[1]}/embed/` : null;
}

interface Article {
  id: string;
  title: string | null;
  url: string;
  content: string | null;
  excerpt: string | null;
  author: string | null;
  site_name: string | null;
  content_type: string;
  tag_id: string | null;
  youtube_video_id: string | null;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
}

export function ArticleReader({
  article,
  slug,
  initialTags,
}: {
  article: Article;
  slug: string;
  initialTags: ArticleTag[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(article.title ?? "");
  const [content, setContent] = useState(article.content ?? "");
  const [tagId, setTagId] = useState(article.tag_id ?? "");

  const { data: tagsData } = useArticleTags(initialTags);
  const tags = tagsData ?? initialTags;

  const instagramEmbedUrl = getInstagramEmbedUrl(article.url);

  const currentTag = tags.find((t) => t.id === article.tag_id);

  const handleDelete = async () => {
    await deleteArticle(slug, article.id);
    router.push(`/i/${slug}/articles`);
  };

  return (
    <div className="space-y-6">
      {/* Header metadata */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">
            {article.content_type === "other" && article.site_name
              ? article.site_name
              : article.content_type}
          </Badge>
          {currentTag && (
            <Badge variant="outline">{currentTag.name}</Badge>
          )}
          {article.content_type !== "other" && article.site_name && (
            <span className="text-sm text-muted-foreground">{article.site_name}</span>
          )}
          {article.author && (
            <span className="text-sm text-muted-foreground">by {article.author}</span>
          )}
          <span className="text-sm text-muted-foreground">
            {formatDate(article.created_at)}
          </span>
        </div>

        {editing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bookmark title"
            className="text-2xl font-bold"
          />
        ) : (
          <h1 className="text-3xl font-bold">{article.title || "Untitled"}</h1>
        )}
      </div>

      {/* Action buttons + edit form wrapper */}
      <form
        action={async (formData) => {
          await updateArticle(slug, article.id, formData);
          setEditing(false);
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            {editing ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </>
            )}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => toggleRead(slug, article.id)}>
            <BookOpen className="mr-2 h-4 w-4" />
            {article.is_read ? "Mark Unread" : "Mark Read"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => toggleArchive(slug, article.id)}>
            <Archive className="mr-2 h-4 w-4" />
            {article.is_archived ? "Unarchive" : "Archive"}
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Original
            </a>
          </Button>
          <div className="flex items-center gap-1">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <select
              value={article.tag_id ?? ""}
              onChange={(e) => setArticleTag(slug, article.id, e.target.value || null)}
              className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="">No tag</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          {editing && (
            <SubmitButton size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </SubmitButton>
          )}
        </div>

        {editing && (
          <div className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Tag</label>
              <select
                name="tag_id"
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">None</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <input type="hidden" name="title" value={title} />
            <div>
              <label className="text-sm font-medium mb-1 block">Content (HTML)</label>
              <Textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Article content..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
          </div>
        )}
      </form>

      {/* Content display */}
      {!editing && (
        <>
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
            <div className="space-y-6">
              {article.content && (
                <article className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                  {article.content}
                </article>
              )}
              <div className="flex justify-center">
                <iframe
                  src={instagramEmbedUrl}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                  className="rounded-lg border-0"
                  width="400"
                  height="520"
                  loading="lazy"
                />
              </div>
            </div>
          ) : article.content ? (
            <article
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <p className="text-muted-foreground">No content available.</p>
          )}
        </>
      )}
    </div>
  );
}
