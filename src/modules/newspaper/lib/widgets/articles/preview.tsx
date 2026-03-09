"use client";

import type { WidgetPreviewProps } from "../types";

export function ArticlesPreview({ block }: WidgetPreviewProps) {
  const articles = (block.data as Array<{
    title: string;
    url: string;
    excerpt: string;
    site_name: string;
  }>) || [];

  return (
    <div>
      <h3 className="font-semibold mb-2">{block.title}</h3>
      {articles.length > 0 ? (
        <div className="space-y-2">
          {articles.map((article, i) => (
            <div key={i} className="text-sm">
              <p className="font-medium">{article.title}</p>
              {article.site_name && (
                <p className="text-xs text-muted-foreground">{article.site_name}</p>
              )}
              {article.excerpt && (
                <p className="text-muted-foreground line-clamp-2">{article.excerpt}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No articles</p>
      )}
    </div>
  );
}
