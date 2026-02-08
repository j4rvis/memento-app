"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, Trash2, ExternalLink } from "lucide-react";
import { deleteArticle, toggleArchive } from "@/app/(app)/i/[slug]/articles/actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  title: string | null;
  url: string;
  excerpt: string | null;
  site_name: string | null;
  image_url: string | null;
  content_type: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
}

export function ArticleCard({ article, slug }: { article: Article; slug: string }) {
  return (
    <Card className={cn("group relative transition-shadow hover:shadow-md", article.is_archived && "opacity-60")}>
      <Link href={`/i/${slug}/articles/${article.id}`} className="absolute inset-0 z-0" />
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                {article.content_type}
              </Badge>
              {article.site_name && (
                <span className="text-xs text-muted-foreground">{article.site_name}</span>
              )}
            </div>
            <CardTitle className="line-clamp-2 text-base">
              {article.title || "Untitled"}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {article.excerpt && (
          <p className="line-clamp-2 text-sm text-muted-foreground mb-2">
            {article.excerpt}
          </p>
        )}
        <div className="relative z-10 flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => { e.preventDefault(); toggleArchive(slug, article.id); }}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => { e.preventDefault(); deleteArticle(slug, article.id); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(article.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
