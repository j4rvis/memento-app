"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { BlockCard } from "./block-card";
import type { Block } from "@/modules/newspaper/lib/types";

interface Props {
  pageIndex: number;
  columnIndex: number;
  blocks: Block[];
  onUpdateBlock: (blockIndex: number, block: Block) => void;
  onDeleteBlock: (blockIndex: number) => void;
  onMoveUp: (blockIndex: number) => void;
  onMoveDown: (blockIndex: number) => void;
}

export function ColumnDropzone({
  pageIndex,
  columnIndex,
  blocks,
  onUpdateBlock,
  onDeleteBlock,
  onMoveUp,
  onMoveDown,
}: Props) {
  const dropId = `col-${pageIndex}-${columnIndex}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { pageIndex, columnIndex },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-[80px] rounded-md border-2 border-dashed p-2 space-y-1.5 transition-colors ${
        isOver ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      {blocks.map((block, blockIndex) => (
        <BlockCard
          key={`${pageIndex}-${columnIndex}-${blockIndex}`}
          block={block}
          pageIndex={pageIndex}
          columnIndex={columnIndex}
          blockIndex={blockIndex}
          isFirst={blockIndex === 0}
          isLast={blockIndex === blocks.length - 1}
          onUpdate={(b) => onUpdateBlock(blockIndex, b)}
          onDelete={() => onDeleteBlock(blockIndex)}
          onMoveUp={() => onMoveUp(blockIndex)}
          onMoveDown={() => onMoveDown(blockIndex)}
        />
      ))}
      {blocks.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-1 py-4 text-muted-foreground">
          <Plus className="h-4 w-4 opacity-40" />
          <span className="text-[10px]">Drop block here</span>
        </div>
      )}
    </div>
  );
}
