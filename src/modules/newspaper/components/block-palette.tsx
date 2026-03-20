"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Block } from "@/modules/newspaper/lib/types";

type BlockType = Block["type"];

const paletteItems: { type: BlockType; label: string; emoji: string }[] = [
  { type: "title", label: "Title", emoji: "📰" },
  { type: "markdown", label: "Markdown", emoji: "✍️" },
  { type: "weather", label: "Weather", emoji: "☁️" },
  { type: "writing-lines", label: "Writing Lines", emoji: "📝" },
  { type: "calendar-week", label: "Cal Week", emoji: "📅" },
  { type: "calendar-day", label: "Cal Day", emoji: "🗓️" },
  { type: "divider", label: "Divider", emoji: "—" },
  { type: "spacer", label: "Spacer", emoji: "↕️" },
];

export function BlockPalette() {
  return (
    <div className="w-32 shrink-0 space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
        Blocks
      </p>
      {paletteItems.map((item) => (
        <PaletteItem key={item.type} item={item} />
      ))}
    </div>
  );
}

function PaletteItem({
  item,
}: {
  item: { type: BlockType; label: string; emoji: string };
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { source: "palette", blockType: item.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex cursor-grab items-center gap-1.5 rounded-md border bg-card px-2 py-1.5 text-xs font-medium shadow-sm active:cursor-grabbing touch-none select-none transition-opacity ${isDragging ? "opacity-40" : "hover:bg-accent"}`}
    >
      <span>{item.emoji}</span>
      <span>{item.label}</span>
    </div>
  );
}
