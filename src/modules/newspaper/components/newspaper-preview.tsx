"use client";

import { Separator } from "@/components/ui/separator";

interface EditionBlock {
  type: string;
  title: string;
  config: Record<string, unknown>;
  data: unknown;
}

interface Edition {
  id: string;
  title: string;
  content: EditionBlock[];
  generated_at: string;
}

function WeatherBlock({ block }: { block: EditionBlock }) {
  const data = block.data as { location: string } | null;
  return (
    <div className="text-center py-4">
      <h3 className="font-semibold">{block.title}</h3>
      <p className="text-muted-foreground">
        {data?.location || "Weather data unavailable"}
      </p>
    </div>
  );
}

function TodosBlock({ block }: { block: EditionBlock }) {
  const todos = (block.data as Array<{
    title: string;
    is_completed: boolean;
    priority: number;
    due_date: string | null;
  }>) || [];

  return (
    <div>
      <h3 className="font-semibold mb-2">{block.title}</h3>
      {todos.length > 0 ? (
        <ul className="space-y-1">
          {todos.map((todo, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className={todo.is_completed ? "line-through" : ""}>{todo.title}</span>
              {todo.due_date && (
                <span className="text-xs text-muted-foreground">
                  (due {new Date(todo.due_date).toLocaleDateString()})
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No todos</p>
      )}
    </div>
  );
}

function NotesBlock({ block }: { block: EditionBlock }) {
  const notes = (block.data as Array<{
    title: string;
    content: string;
    is_pinned: boolean;
  }>) || [];

  return (
    <div>
      <h3 className="font-semibold mb-2">{block.title}</h3>
      {notes.length > 0 ? (
        <div className="space-y-2">
          {notes.map((note, i) => (
            <div key={i} className="text-sm">
              <p className="font-medium">{note.title}</p>
              <p className="text-muted-foreground line-clamp-2">{note.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No notes</p>
      )}
    </div>
  );
}

function RssBlock({ block }: { block: EditionBlock }) {
  const entries = (block.data as Array<{
    title: string;
    url: string;
    summary: string;
    published_at: string;
  }>) || [];

  return (
    <div>
      <h3 className="font-semibold mb-2">{block.title}</h3>
      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={i} className="text-sm">
              <p className="font-medium">{entry.title}</p>
              {entry.summary && (
                <p className="text-muted-foreground line-clamp-2">{entry.summary}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No entries</p>
      )}
    </div>
  );
}

function ArticlesBlock({ block }: { block: EditionBlock }) {
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

function TextBlock({ block }: { block: EditionBlock }) {
  const data = block.data as { body: string } | null;
  return (
    <div>
      <h3 className="font-semibold mb-2">{block.title}</h3>
      <p className="text-sm whitespace-pre-wrap">{data?.body || ""}</p>
    </div>
  );
}

const BLOCK_RENDERERS: Record<string, React.ComponentType<{ block: EditionBlock }>> = {
  weather: WeatherBlock,
  todos: TodosBlock,
  notes: NotesBlock,
  rss: RssBlock,
  articles: ArticlesBlock,
  text: TextBlock,
};

export function NewspaperPreview({ edition }: { edition: Edition }) {
  return (
    <div className="mx-auto max-w-2xl bg-white dark:bg-card print:bg-white print:text-black">
      <div className="border-b-4 border-double border-black dark:border-foreground py-6 text-center print:border-black">
        <h1 className="text-4xl font-bold font-serif">{edition.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground print:text-gray-600">
          {new Date(edition.generated_at).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="divide-y py-4">
        {edition.content.map((block, i) => {
          const Renderer = BLOCK_RENDERERS[block.type];
          if (!Renderer) return null;
          return (
            <div key={i} className="py-4">
              <Renderer block={block} />
            </div>
          );
        })}
      </div>

      {edition.content.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          This edition has no content blocks.
        </p>
      )}

      <Separator />
      <p className="py-4 text-center text-xs text-muted-foreground">
        Generated by Memento
      </p>
    </div>
  );
}
