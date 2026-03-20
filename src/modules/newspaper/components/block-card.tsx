"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlockConfigPanel } from "./block-config-panel";
import type { Block } from "@/modules/newspaper/lib/types";

const BLOCK_LABELS: Record<Block["type"], string> = {
  title: "Title",
  markdown: "Markdown",
  weather: "Weather",
  "writing-lines": "Writing Lines",
  "calendar-week": "Calendar Week",
  "calendar-day": "Calendar Day",
  divider: "Divider",
  spacer: "Spacer",
};

interface Props {
  block: Block;
  pageIndex: number;
  columnIndex: number;
  blockIndex: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (block: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function BlockCard({
  block,
  pageIndex,
  columnIndex,
  blockIndex,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const [configOpen, setConfigOpen] = useState(false);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block-${pageIndex}-${columnIndex}-${blockIndex}`,
    data: {
      source: "canvas",
      block,
      pageIndex,
      columnIndex,
      blockIndex,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border bg-background transition-opacity ${isDragging ? "opacity-40" : ""}`}
    >
      <div
        className="flex items-center gap-1 px-2 py-1.5 cursor-pointer select-none"
        onClick={() => setConfigOpen((o) => !o)}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-0.5 text-muted-foreground hover:text-foreground touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <ChevronRight
          className={`h-3 w-3 text-muted-foreground transition-transform ${configOpen ? "rotate-90" : ""}`}
        />
        <span className="flex-1 text-xs font-medium">{BLOCK_LABELS[block.type]}</span>
        <BlockSummary block={block} />

        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move up"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onMoveDown}
            disabled={isLast}
            title="Move down"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            title="Delete block"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {configOpen && <BlockConfigPanel block={block} onChange={onUpdate} />}
    </div>
  );
}

function BlockSummary({ block }: { block: Block }) {
  let summary = "";
  if (block.type === "title") summary = block.text;
  else if (block.type === "markdown") summary = block.content.slice(0, 30) + (block.content.length > 30 ? "…" : "");
  else if (block.type === "weather") summary = block.location;
  else if (block.type === "writing-lines") summary = block.label ?? "";
  else if (block.type === "calendar-week") summary = block.start_date;
  else if (block.type === "calendar-day") summary = block.date;
  else if (block.type === "divider") summary = block.style ?? "solid";
  else if (block.type === "spacer") summary = `${block.height_mm ?? 10}mm`;

  if (!summary) return null;
  return <span className="truncate text-xs text-muted-foreground max-w-[100px]">{summary}</span>;
}
