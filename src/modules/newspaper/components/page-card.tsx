"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnDropzone } from "./column-dropzone";
import type { Block, Page } from "@/modules/newspaper/lib/types";

interface Props {
  page: Page;
  pageIndex: number;
  pageCount: number;
  onUpdateLayout: (layout: Page["layout"]) => void;
  onUpdateBlock: (columnIndex: number, blockIndex: number, block: Block) => void;
  onDeleteBlock: (columnIndex: number, blockIndex: number) => void;
  onMoveBlockUp: (columnIndex: number, blockIndex: number) => void;
  onMoveBlockDown: (columnIndex: number, blockIndex: number) => void;
  onDeletePage: () => void;
}

const LAYOUT_LABELS: Record<Page["layout"], string> = {
  single: "Single column",
  "two-column": "Two columns",
  "three-column": "Three columns",
};

function getColumns(page: Page): Block[][] {
  if (page.layout === "single") {
    return [page.blocks ?? []];
  }
  const count = page.layout === "two-column" ? 2 : 3;
  const cols = page.columns ?? [];
  return Array.from({ length: count }, (_, i) => cols[i] ?? []);
}

export function PageCard({
  page,
  pageIndex,
  pageCount,
  onUpdateLayout,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlockUp,
  onMoveBlockDown,
  onDeletePage,
}: Props) {
  const columns = getColumns(page);

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Page {pageIndex + 1}
        </span>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border bg-background px-2 py-1 text-xs"
            value={page.layout}
            onChange={(e) => onUpdateLayout(e.target.value as Page["layout"])}
          >
            {Object.entries(LAYOUT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {pageCount > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:bg-destructive/10"
              onClick={onDeletePage}
              title="Delete page"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex gap-2 p-3">
        {columns.map((colBlocks, columnIndex) => (
          <ColumnDropzone
            key={columnIndex}
            pageIndex={pageIndex}
            columnIndex={columnIndex}
            blocks={colBlocks}
            onUpdateBlock={(blockIndex, block) => onUpdateBlock(columnIndex, blockIndex, block)}
            onDeleteBlock={(blockIndex) => onDeleteBlock(columnIndex, blockIndex)}
            onMoveUp={(blockIndex) => onMoveBlockUp(columnIndex, blockIndex)}
            onMoveDown={(blockIndex) => onMoveBlockDown(columnIndex, blockIndex)}
          />
        ))}
      </div>
    </div>
  );
}
