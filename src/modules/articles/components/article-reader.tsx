"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleRead, toggleArchive, deleteArticle } from "@/app/(app)/i/[slug]/articles/actions";
import { Archive, BookOpen, ExternalLink, Trash2 } from "lucide-react";

interface Article {
  id: string;
  title: string | null;
  url: string;
  content: string | null;
  author: string | null;
  site_name: string | null;
  content_type: string;
  youtube_video_id: string | null;
  is_read: boolean;
  is_archived: boolean;
}

export function ArticleReader({ article, slug }: { article: Article; slug: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {article.content_type === "other" && article.site_name
              ? article.site_name
              : article.content_type}
          </Badge>
          {article.content_type !== "other" && article.site_name && (
            <span className="text-sm text-muted-foreground">{article.site_name}</span>
          )}
          {article.author && (
            <span className="text-sm text-muted-foreground">by {article.author}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold">{article.title || "Untitled"}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => toggleRead(slug, article.id)}>
          <BookOpen className="mr-2 h-4 w-4" />
          {article.is_read ? "Mark Unread" : "Mark Read"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => toggleArchive(slug, article.id)}>
          <Archive className="mr-2 h-4 w-4" />
          {article.is_archived ? "Unarchive" : "Archive"}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Original
          </a>
        </Button>
        <Button variant="destructive" size="sm" onClick={() => deleteArticle(slug, article.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

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
      ) : article.content ? (
        <article
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      ) : (
        <p className="text-muted-foreground">No content available.</p>
      )}
    </div>
  );
}
