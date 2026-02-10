"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, Trash2, ExternalLink } from "lucide-react";
import { deleteArticle, toggleArchive } from "@/app/(app)/i/[slug]/articles/actions";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

interface Article {
  id: string;
  title: string | null;
  url: string;
  excerpt: string | null;
  site_name: string | null;
  content_type: string;
  category: string | null;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
}

export function ArticleCard({ article, slug }: { article: Article; slug: string }) {
  const contentLabel =
    article.content_type === "other" && article.site_name
      ? article.site_name
      : article.content_type;

  return (
    <Card
      className={cn(
        "group relative transition-shadow hover:shadow-md",
        article.is_archived && "opacity-60",
        !article.is_read && "border-l-2 border-l-primary"
      )}
    >
      <Link href={`/i/${slug}/articles/${article.id}`} className="absolute inset-0 z-0" />
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Badge variant="secondary" className="text-[10px] leading-tight px-1.5 py-0">
            {contentLabel}
          </Badge>
          {article.category && (
            <Badge variant="outline" className="text-[10px] leading-tight px-1.5 py-0">
              {article.category}
            </Badge>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground">
            {formatDate(article.created_at)}
          </span>
        </div>
        <h3
          className={cn(
            "text-sm line-clamp-2 mb-1",
            !article.is_read && "font-semibold"
          )}
        >
          {article.title || "Untitled"}
        </h3>
        {article.excerpt && (
          <p className="line-clamp-1 text-xs text-muted-foreground mb-1.5">
            {article.excerpt}
          </p>
        )}
        <div className="relative z-10 flex items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => { e.preventDefault(); toggleArchive(slug, article.id); }}
          >
            <Archive className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => { e.preventDefault(); deleteArticle(slug, article.id); }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
