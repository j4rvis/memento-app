"use client";

import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/format";

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

interface WeatherCurrent {
  temperature: number;
  apparent_temperature: number;
  condition: string;
  wind_speed: number;
}

interface WeatherForecastDay {
  date: string;
  condition: string;
  max: number;
  min: number;
}

interface WeatherData {
  location: string;
  error?: string;
  current?: WeatherCurrent;
  forecast?: WeatherForecastDay[];
}

function WeatherBlock({ block }: { block: EditionBlock }) {
  const data = block.data as WeatherData | null;

  if (!data) {
    return (
      <div className="text-center py-4">
        <h3 className="font-semibold">{block.title}</h3>
        <p className="text-muted-foreground text-sm">Weather data unavailable</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="text-center py-4">
        <h3 className="font-semibold">{block.title}</h3>
        <p className="text-muted-foreground text-sm">{data.location} — {data.error}</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <h3 className="font-semibold mb-2">{block.title}</h3>
      <p className="text-sm font-medium">{data.location}</p>
      {data.current && (
        <div className="mt-1">
          <span className="text-2xl font-bold">{Math.round(data.current.temperature)}°C</span>
          <span className="text-sm text-muted-foreground ml-2">{data.current.condition}</span>
          <p className="text-xs text-muted-foreground">
            Feels like {Math.round(data.current.apparent_temperature)}°C · Wind {Math.round(data.current.wind_speed)} km/h
          </p>
        </div>
      )}
      {data.forecast && data.forecast.length > 0 && (
        <div className="mt-2 flex gap-4">
          {data.forecast.map((day) => (
            <div key={day.date} className="text-xs">
              <p className="font-medium">{new Date(day.date).toLocaleDateString(undefined, { weekday: "short" })}</p>
              <p className="text-muted-foreground">{day.condition}</p>
              <p>{Math.round(day.max)}° / {Math.round(day.min)}°</p>
            </div>
          ))}
        </div>
      )}
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
                  (due {formatDate(todo.due_date)})
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

function TextBlock({ block }: { block: EditionBlock }) {
  const data = block.data as { body: string } | null;
  return (
    <div>
      <h3 className="font-semibold mb-2">{block.title}</h3>
      <p className="text-sm whitespace-pre-wrap">{data?.body || ""}</p>
    </div>
  );
}

function CalendarBlock({ block }: { block: EditionBlock }) {
  const todos = (block.data as Array<{
    title: string;
    due_date: string;
    priority: number;
    is_completed: boolean;
  }>) || [];

  // Group by date
  const grouped: Record<string, typeof todos> = {};
  for (const todo of todos) {
    const day = todo.due_date;
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(todo);
  }

  const days = Object.keys(grouped).sort();

  return (
    <div>
      <h3 className="font-semibold mb-2">{block.title}</h3>
      {days.length > 0 ? (
        <div className="space-y-3">
          {days.map((day) => (
            <div key={day}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {new Date(day).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </p>
              <ul className="space-y-0.5">
                {grouped[day].map((todo, i) => (
                  <li key={i} className="text-sm flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                    {todo.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No upcoming items</p>
      )}
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
  calendar: CalendarBlock,
};

const FONT_FAMILY_CLASS: Record<string, string> = {
  serif: "font-serif",
  sans: "font-sans",
  mono: "font-mono",
};

const FONT_SIZE_CLASS: Record<string, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const LINE_HEIGHT_CLASS: Record<string, string> = {
  normal: "leading-normal",
  relaxed: "leading-relaxed",
  loose: "leading-loose",
};

export function NewspaperPreview({
  edition,
  printConfig = {},
}: {
  edition: Edition;
  printConfig?: Record<string, string>;
}) {
  const fontClass = FONT_FAMILY_CLASS[printConfig.font_family ?? "serif"] ?? "font-serif";
  const sizeClass = FONT_SIZE_CLASS[printConfig.font_size ?? "md"] ?? "text-base";
  const leadingClass = LINE_HEIGHT_CLASS[printConfig.line_height ?? "relaxed"] ?? "leading-relaxed";
  const twoCol = (printConfig.columns ?? "1") === "2";

  return (
    <div className={`mx-auto max-w-2xl bg-white dark:bg-card print:bg-white print:text-black print:max-w-none ${fontClass} ${sizeClass} ${leadingClass}`}>
      <div className="border-b-4 border-double border-black dark:border-foreground py-6 text-center print:border-black">
        <h1 className="text-4xl font-bold font-serif">{edition.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground print:text-gray-600">
          {formatDate(edition.generated_at)}
        </p>
      </div>

      <div
        className="py-4"
        style={twoCol ? { columnCount: 2, columnGap: "2.5rem" } : undefined}
      >
        {edition.content.map((block, i) => {
          const Renderer = BLOCK_RENDERERS[block.type];
          if (!Renderer) return null;
          return (
            <div
              key={i}
              className={twoCol ? "pb-6 mb-4 break-inside-avoid" : "py-4 border-b"}
              style={twoCol ? { breakInside: "avoid", pageBreakInside: "avoid" } : undefined}
            >
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
