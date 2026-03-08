"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Note } from "../lib/types";

interface EmbedRendererProps {
  content: string;
  notes: Note[];
  onNavigate: (title: string) => void;
  /** Titles currently being rendered (recursion guard) */
  ancestorTitles?: string[];
}

function parseEmbeds(content: string): string[] {
  const matches = content.match(/!\[\[([^\[\]]+?)\]\]/g) ?? [];
  return matches.map((m) => m.slice(3, -2)); // strip ![[ and ]]
}

export function EmbedRenderer({
  content,
  notes,
  onNavigate,
  ancestorTitles = [],
}: EmbedRendererProps) {
  const embedTitles = parseEmbeds(content);
  if (embedTitles.length === 0) return null;

  return (
    <div className="border-t shrink-0">
      {embedTitles.map((title, i) => {
        if (ancestorTitles.includes(title)) {
          return (
            <div key={i} className="px-4 py-2 text-xs text-muted-foreground italic">
              ↩ Circular embed: <span className="font-mono">{`![[${title}]]`}</span>
            </div>
          );
        }

        const embedded = notes.find((n) => n.title === title);
        if (!embedded) {
          return (
            <div key={i} className="px-4 py-2 text-xs text-muted-foreground italic">
              ↩ Note not found: <span className="font-mono">{`![[${title}]]`}</span>
            </div>
          );
        }

        return (
          <div key={i} className="px-4 py-3 bg-muted/30 border-b last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => onNavigate(title)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {embedded.title}
              </button>
              <span className="text-xs text-muted-foreground">embedded</span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-xs opacity-80 pointer-events-none select-none line-clamp-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {embedded.content || "*Empty note*"}
              </ReactMarkdown>
            </div>
          </div>
        );
      })}
    </div>
  );
}
