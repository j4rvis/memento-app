"use client";

import type { WeatherData } from "@/modules/newspaper/lib/widgets/weather/preview";
import type { EditionBlock } from "@/modules/newspaper/lib/widgets/types";

interface NewspaperHeaderProps {
  title: string;
  generatedAt: string;
  blocks?: EditionBlock[];
}

function formatHeaderDate(isoString: string) {
  const d = new Date(isoString);
  const day = d.toLocaleDateString(undefined, { weekday: "long" });
  const date = d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return { day, date };
}

function extractWeatherSummary(blocks: EditionBlock[]): string | null {
  const weatherBlock = blocks.find((b) => b.type === "weather");
  if (!weatherBlock) return null;
  const data = weatherBlock.data as WeatherData | null;
  if (!data || data.error || !data.current) return null;
  return `${data.location} · ${Math.round(data.current.temperature)}°C ${data.current.condition}`;
}

export function NewspaperHeader({ title, generatedAt, blocks = [] }: NewspaperHeaderProps) {
  const { day, date } = formatHeaderDate(generatedAt);
  const weatherSummary = extractWeatherSummary(blocks);

  return (
    <div className="border-b-4 border-double border-black dark:border-foreground print:border-black">
      {/* Dateline row */}
      <div className="flex items-center justify-between px-1 py-1 text-xs border-b border-black/20 dark:border-foreground/20 print:border-black/20">
        <span className="font-semibold uppercase tracking-widest">{day}</span>
        <span className="text-muted-foreground print:text-gray-600">{date}</span>
        {weatherSummary && (
          <span className="text-muted-foreground print:text-gray-600">{weatherSummary}</span>
        )}
      </div>

      {/* Masthead */}
      <div className="py-5 text-center">
        <h1 className="text-4xl font-bold font-serif tracking-tight">{title}</h1>
      </div>
    </div>
  );
}
