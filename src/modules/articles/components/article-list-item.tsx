"use client";

import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { Article } from "../lib/types";

interface ArticleListItemProps {
  article: Article;
  tagName?: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ArticleListItem({ article, tagName, isSelected, onSelect }: ArticleListItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: article.id,
  });

  const contentLabel =
    article.content_type === "other" && article.site_name
      ? article.site_name
      : article.content_type;

  return (
    <button
      ref={setNodeRef}
      className={cn(
        "w-full text-left px-3 py-2.5 border-b hover:bg-accent transition-colors cursor-grab active:cursor-grabbing",
        !article.is_read && "border-l-2 border-l-primary",
        isSelected && "bg-accent",
        isDragging && "opacity-40",
      )}
      onClick={() => onSelect(article.id)}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className={cn("text-sm line-clamp-2 flex-1 leading-snug", !article.is_read && "font-semibold")}>
          {article.title || "Untitled"}
        </span>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
          {formatDate(article.created_at)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="text-[10px] leading-tight px-1.5 py-0 shrink-0">
          {contentLabel}
        </Badge>
        {tagName && (
          <Badge variant="outline" className="text-[10px] leading-tight px-1.5 py-0 shrink-0">
            {tagName}
          </Badge>
        )}
        {article.excerpt && (
          <span className="text-[10px] text-muted-foreground truncate">
            {article.excerpt}
          </span>
        )}
      </div>
    </button>
  );
}
