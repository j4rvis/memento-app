"use client";

import { useState, useEffect, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  GripVertical,
  Plus,
  Trash2,
  Settings2,
  Minus,
  ChevronsLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import { WIDGET_REGISTRY, WIDGET_LIST } from "@/modules/newspaper/lib/widgets/registry";
import type { FeedOption, ArticleOption } from "@/modules/newspaper/lib/widgets/types";
import {
  addBlock,
  deleteBlock,
  moveBlockToCell,
  updateBlock,
  updateBlockSpan,
} from "@/app/(app)/i/[slug]/newspaper/actions";
import { GRID_DIMENSIONS, type PaperFormat } from "@/modules/newspaper/lib/types";
import { buildCellMap } from "@/modules/newspaper/lib/grid";
import { cn } from "@/lib/utils";


type Block = {
  id: string;
  newspaper_id: string;
  block_type: string;
  title: string;
  config: Record<string, unknown>;
  sort_order: number;
  grid_col: number | null;
  grid_row: number | null;
  col_span: number;
  row_span: number;
};

type Newspaper = {
  id: string;
  layout_config: unknown;
};

// ---- DroppableCell ----

function DroppableCell({
  row,
  col,
  onClick,
}: {
  row: number;
  col: number;
  onClick: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `cell-${row}-${col}` });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors",
        isOver
          ? "border-primary bg-primary/10"
          : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
      )}
      style={{
        gridColumn: `${col + 1}`,
        gridRow: `${row + 1}`,
        minHeight: "120px",
      }}
    >
      <div className="flex flex-col items-center gap-1 text-muted-foreground pointer-events-none">
        <Plus className="h-5 w-5" />
        <span className="text-xs">Add block</span>
      </div>
    </div>
  );
}

// ---- DraggableBlockCard ----

function DraggableBlockCard({
  block,
  onEdit,
  onDelete,
  onIncRowSpan,
  onDecRowSpan,
  onToggleColSpan,
  canExpandCol,
}: {
  block: Block;
  onEdit: () => void;
  onDelete: () => void;
  onIncRowSpan: () => void;
  onDecRowSpan: () => void;
  onToggleColSpan: () => void;
  canExpandCol: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: block.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border bg-card flex flex-col gap-1 p-2 transition-opacity overflow-hidden",
        isDragging && "opacity-30"
      )}
      style={{
        gridColumn: `${block.grid_col! + 1} / span ${block.col_span}`,
        gridRow: `${block.grid_row! + 1} / span ${block.row_span}`,
        minHeight: "120px",
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-1 min-w-0">
        <button
          className="cursor-grab text-muted-foreground hover:text-foreground p-0.5 shrink-0 touch-none"
          {...attributes}
          {...listeners}
          type="button"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
          {block.block_type}
        </Badge>
        <span className="text-xs font-medium truncate flex-1 min-w-0">
          {block.title}
        </span>
        <button
          className="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
          onClick={onEdit}
          type="button"
          title="Edit block"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
        <button
          className="text-muted-foreground hover:text-destructive p-0.5 shrink-0"
          onClick={onDelete}
          type="button"
          title="Delete block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Thumbnail */}
      {(() => {
        const widget = WIDGET_REGISTRY[block.block_type];
        if (!widget) return null;
        const Thumb = widget.thumbnailComponent;
        return (
          <div className="flex-1 min-h-0 overflow-hidden text-muted-foreground">
            <Thumb title={block.title} config={block.config as Record<string, unknown>} />
          </div>
        );
      })()}

      {/* Span controls */}
      <div className="flex items-center gap-1 mt-auto pt-1 border-t border-dashed border-muted-foreground/20">
        {/* Col span toggle */}
        <button
          type="button"
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-0.5 transition-colors",
            block.col_span === 2
              ? "bg-primary text-primary-foreground border-primary"
              : canExpandCol
              ? "text-muted-foreground hover:text-foreground border-muted-foreground/30 hover:border-primary"
              : "text-muted-foreground/30 border-muted-foreground/10 cursor-not-allowed"
          )}
          onClick={onToggleColSpan}
          disabled={block.col_span === 1 && !canExpandCol}
          title={block.col_span === 2 ? "Shrink to 1 column" : "Expand to 2 columns"}
        >
          <ChevronsLeftRight className="h-3 w-3" />
          <span>{block.col_span === 2 ? "2 col" : "1 col"}</span>
        </button>

        {/* Row span controls */}
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground p-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={onDecRowSpan}
            disabled={block.row_span <= 1}
            title="Reduce height"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-[10px] text-muted-foreground w-5 text-center">
            {block.row_span}r
          </span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground p-0.5"
            onClick={onIncRowSpan}
            title="Increase height"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- AddBlockDialog ----

function AddBlockDialog({
  open,
  onOpenChange,
  position,
  newspaperId,
  slug,
  feeds,
  articles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: { col: number; row: number } | null;
  newspaperId: string;
  slug: string;
  feeds: FeedOption[];
  articles: ArticleOption[];
}) {
  const [blockType, setBlockType] = useState("text");
  const [title, setTitle] = useState("Static Text");

  function handleTypeChange(newType: string) {
    const found = WIDGET_REGISTRY[newType];
    setBlockType(newType);
    setTitle(found?.label ?? newType);
  }

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setBlockType("text");
      setTitle("Static Text");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add Block
            {position
              ? ` — row ${position.row + 1}, col ${position.col + 1}`
              : ""}
          </DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await addBlock(slug, newspaperId, formData);
            onOpenChange(false);
          }}
          className="space-y-4"
        >
          {position && (
            <>
              <input type="hidden" name="grid_col" value={position.col} />
              <input type="hidden" name="grid_row" value={position.row} />
            </>
          )}
          <input type="hidden" name="block_type" value={blockType} />

          <div className="space-y-2">
            <Label>Block Type</Label>
            <select
              value={blockType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {WIDGET_LIST.map((w) => (
                <option key={w.type} value={w.type}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {(() => {
            const widget = WIDGET_REGISTRY[blockType];
            if (!widget) return null;
            const Config = widget.configComponent;
            return <Config key={blockType} feeds={feeds} articles={articles} />;
          })()}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <SubmitButton>Add Block</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- EditBlockSheet ----

function EditBlockSheet({
  block,
  slug,
  feeds,
  articles,
  onClose,
}: {
  block: Block;
  slug: string;
  feeds: FeedOption[];
  articles: ArticleOption[];
  onClose: () => void;
}) {
  const [blockType, setBlockType] = useState(block.block_type);
  const [title, setTitle] = useState(block.title);
  const [configKey, setConfigKey] = useState(0);
  const [activeConfig, setActiveConfig] = useState(block.config);

  function handleTypeChange(newType: string) {
    const found = WIDGET_REGISTRY[newType];
    setBlockType(newType);
    setTitle(found?.label ?? newType);
    setActiveConfig({});
    setConfigKey((k) => k + 1);
  }

  return (
    <form
      action={async (formData) => {
        await updateBlock(slug, block.id, formData);
        onClose();
      }}
      className="space-y-4 pt-4"
    >
      <input type="hidden" name="block_type" value={blockType} />

      <div className="space-y-2">
        <Label>Type</Label>
        <select
          value={blockType}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {WIDGET_LIST.map((w) => (
            <option key={w.type} value={w.type}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {(() => {
        const widget = WIDGET_REGISTRY[blockType];
        if (!widget) return null;
        const Config = widget.configComponent;
        return <Config key={configKey} config={activeConfig} feeds={feeds} articles={articles} />;
      })()}

      <div className="flex gap-2 pt-2">
        <SubmitButton>Save</SubmitButton>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ---- GridPreview (read-only) ----

function GridPreview({
  blocks,
  cols,
  rows,
}: {
  blocks: Block[];
  cols: number;
  rows: number;
}) {
  const placedBlocks = blocks.filter(
    (b) => b.grid_col !== null && b.grid_row !== null
  );
  const cellMap = buildCellMap(placedBlocks, cols, rows);

  return (
    <div
      className="grid gap-2 h-full"
      style={{
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: `repeat(${rows}, minmax(80px, 1fr))`,
      }}
    >
      {placedBlocks.map((block) => (
        <div
          key={block.id}
          className="rounded-lg border bg-muted/30 p-2 flex flex-col gap-1 overflow-hidden"
          style={{
            gridColumn: `${block.grid_col! + 1} / span ${block.col_span}`,
            gridRow: `${block.grid_row! + 1} / span ${block.row_span}`,
          }}
        >
          <Badge variant="secondary" className="text-[10px] px-1 py-0 w-fit">
            {block.block_type}
          </Badge>
          <span className="text-xs font-medium truncate">{block.title}</span>
        </div>
      ))}
      {Array.from(cellMap.entries())
        .filter(([, status]) => status === "empty")
        .map(([key]) => {
          const [rowStr, colStr] = key.split("-");
          return (
            <div
              key={key}
              className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10"
              style={{
                gridColumn: `${parseInt(colStr) + 1}`,
                gridRow: `${parseInt(rowStr) + 1}`,
              }}
            />
          );
        })}
    </div>
  );
}

// ---- Main Component ----

export function NewspaperGridEditor({
  newspaper,
  blocks: initialBlocks,
  slug,
  feeds,
  articles,
}: {
  newspaper: Newspaper;
  blocks: Block[];
  slug: string;
  feeds: FeedOption[];
  articles: ArticleOption[];
}) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addPosition, setAddPosition] = useState<{
    col: number;
    row: number;
  } | null>(null);
  const [editBlock, setEditBlock] = useState<Block | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTrans] = useTransition();

  // Sync local state with server-rendered data after revalidation
  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const layoutCfg = (
    newspaper.layout_config as { format?: PaperFormat } | null
  ) ?? {};
  const format = layoutCfg.format ?? "A4";
  const { cols, rows } = GRID_DIMENSIONS[format];

  const placedBlocks = blocks.filter(
    (b) => b.grid_col !== null && b.grid_row !== null
  );
  const unplacedBlocks = blocks.filter(
    (b) => b.grid_col === null || b.grid_row === null
  );
  const cellMap = buildCellMap(placedBlocks, cols, rows);

  const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !String(over.id).startsWith("cell-")) return;

    const blockId = active.id as string;
    const parts = String(over.id).split("-");
    const row = parseInt(parts[1]);
    const col = parseInt(parts[2]);

    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    if (block.grid_col === col && block.grid_row === row) return;

    // Optimistic update
    const prevBlocks = blocks;
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, grid_col: col, grid_row: row } : b
      )
    );

    startTrans(async () => {
      try {
        await moveBlockToCell(slug, blockId, block.newspaper_id, col, row);
      } catch (e) {
        setBlocks(prevBlocks);
        toast.error(
          e instanceof Error ? e.message : "Failed to move block"
        );
      }
    });
  }

  function handleDelete(block: Block) {
    if (!confirm(`Delete block "${block.title}"?`)) return;
    const prevBlocks = blocks;
    setBlocks((prev) => prev.filter((b) => b.id !== block.id));
    startTrans(async () => {
      try {
        await deleteBlock(slug, block.id, block.newspaper_id);
      } catch {
        setBlocks(prevBlocks);
        toast.error("Failed to delete block");
      }
    });
  }

  function handleSpanChange(block: Block, colSpan: number, rowSpan: number) {
    const prevBlocks = blocks;
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === block.id ? { ...b, col_span: colSpan, row_span: rowSpan } : b
      )
    );
    startTrans(async () => {
      try {
        await updateBlockSpan(
          slug,
          block.id,
          block.newspaper_id,
          colSpan,
          rowSpan
        );
      } catch (e) {
        setBlocks(prevBlocks);
        toast.error(
          e instanceof Error ? e.message : "Failed to update span"
        );
      }
    });
  }

  function canExpandColSpan(block: Block): boolean {
    if (block.col_span === 2) return false;
    if (block.grid_col !== 0) return false;
    // Check that col 1 is free for all rows in this block
    for (let r = block.grid_row!; r < block.grid_row! + block.row_span; r++) {
      if (cellMap.get(`${r}-1`) !== "empty") return false;
    }
    return true;
  }

  return (
    <div className="space-y-4">
      {/* Two-panel layout: editor left, preview right on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Editor grid */}
        <div className="space-y-3">
          <DndContext
            sensors={sensors}
            modifiers={[restrictToWindowEdges]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: `repeat(${rows}, minmax(120px, auto))`,
              }}
            >
              {/* Placed blocks */}
              {placedBlocks.map((block) => (
                <DraggableBlockCard
                  key={block.id}
                  block={block}
                  onEdit={() => setEditBlock(block)}
                  onDelete={() => handleDelete(block)}
                  onIncRowSpan={() =>
                    handleSpanChange(block, block.col_span, block.row_span + 1)
                  }
                  onDecRowSpan={() =>
                    handleSpanChange(
                      block,
                      block.col_span,
                      Math.max(1, block.row_span - 1)
                    )
                  }
                  onToggleColSpan={() =>
                    handleSpanChange(
                      block,
                      block.col_span === 2 ? 1 : 2,
                      block.row_span
                    )
                  }
                  canExpandCol={canExpandColSpan(block)}
                />
              ))}

              {/* Empty cells */}
              {Array.from(cellMap.entries())
                .filter(([, status]) => status === "empty")
                .map(([key]) => {
                  const [rowStr, colStr] = key.split("-");
                  const r = parseInt(rowStr);
                  const c = parseInt(colStr);
                  return (
                    <DroppableCell
                      key={key}
                      row={r}
                      col={c}
                      onClick={() => {
                        setAddPosition({ col: c, row: r });
                        setAddDialogOpen(true);
                      }}
                    />
                  );
                })}
            </div>

            <DragOverlay modifiers={[restrictToWindowEdges]}>
              {activeBlock && (
                <div className="rounded-lg border bg-card p-2 shadow-xl opacity-90 flex items-center gap-2 max-w-[200px]">
                  <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                    {activeBlock.block_type}
                  </Badge>
                  <span className="text-xs font-medium truncate">
                    {activeBlock.title}
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Unplaced blocks */}
          {unplacedBlocks.length > 0 && (
            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Unplaced blocks (grid full)
              </p>
              {unplacedBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center gap-2 rounded border bg-card p-2"
                >
                  <Badge variant="outline" className="text-xs shrink-0">
                    {block.block_type}
                  </Badge>
                  <span className="text-sm flex-1 truncate">{block.title}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleDelete(block)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add block button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setAddPosition(null);
              setAddDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Block
          </Button>
        </div>

        {/* Preview panel (large screens only) */}
        <div className="hidden lg:block">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Layout Preview
          </p>
          <div className="rounded-lg border bg-muted/20 p-3">
            <GridPreview blocks={blocks} cols={cols} rows={rows} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {format} · {cols} col × {rows} row
          </p>
        </div>
      </div>

      {/* Add Block Dialog */}
      <AddBlockDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setAddPosition(null);
        }}
        position={addPosition}
        newspaperId={newspaper.id}
        slug={slug}
        feeds={feeds}
        articles={articles}
      />

      {/* Edit Block Sheet */}
      <Sheet open={!!editBlock} onOpenChange={(open) => !open && setEditBlock(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Block</SheetTitle>
          </SheetHeader>
          {editBlock && (
            <EditBlockSheet
              key={editBlock.id}
              block={editBlock}
              slug={slug}
              feeds={feeds}
              articles={articles}
              onClose={() => setEditBlock(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
