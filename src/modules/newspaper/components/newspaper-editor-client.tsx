"use client";

import { useState, useTransition, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import Link from "next/link";
import { ArrowLeft, Save, Eye, Plus, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlockPalette } from "./block-palette";
import { PageCard } from "./page-card";
import { CalendarEntryManager } from "./calendar-entry-manager";
import { GoogleCalendarSourcePicker } from "./google-calendar-source-picker";
import { ImportJsonDialog } from "./import-json-dialog";
import { updateTemplate, renameTemplate } from "@/app/(app)/i/[slug]/newspaper/actions";
import type { Block, CalendarEntry, GoogleCalendarSource, NewspaperConfig, Page } from "@/modules/newspaper/lib/types";

interface Props {
  slug: string;
  templateId: string;
  initialName: string;
  initialConfig: NewspaperConfig;
  initialAccounts: { id: string; google_email: string }[];
}

function defaultBlock(type: Block["type"]): Block {
  const today = new Date().toISOString().slice(0, 10);
  switch (type) {
    case "title": return { type: "title", text: "My Newspaper", style: "newspaper", border: "bottom" };
    case "markdown": return { type: "markdown", content: "## Section\n\nYour content here." };
    case "weather": return { type: "weather", location: "New York", unit: "celsius", display: "current" };
    case "writing-lines": return { type: "writing-lines", lines: 10, line_spacing_mm: 8 };
    case "calendar-week": return { type: "calendar-week", start_date: today, week_start: "monday", hours: [8, 20] };
    case "calendar-day": return { type: "calendar-day", date: today, hours: [7, 21] };
    case "divider": return { type: "divider", style: "solid" };
    case "spacer": return { type: "spacer", height_mm: 10 };
  }
}

function getBlocks(page: Page, columnIndex: number): Block[] {
  if (page.layout === "single") return page.blocks ?? [];
  return page.columns?.[columnIndex] ?? [];
}

function setBlocks(page: Page, columnIndex: number, blocks: Block[]): Page {
  if (page.layout === "single") {
    return { ...page, blocks };
  }
  const colCount = page.layout === "two-column" ? 2 : 3;
  const columns = Array.from({ length: colCount }, (_, i) =>
    i === columnIndex ? blocks : page.columns?.[i] ?? []
  );
  return { ...page, columns };
}

export function NewspaperEditorClient({
  slug,
  templateId,
  initialName,
  initialConfig,
  initialAccounts,
}: Props) {
  const [config, setConfig] = useState<NewspaperConfig>(initialConfig);
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const [draggedBlockType, setDraggedBlockType] = useState<Block["type"] | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ─── Import ───────────────────────────────────────────────────────────────

  function handleImport(imported: NewspaperConfig) {
    setConfig(imported);
    toast.success("Config imported — press Save to persist");
  }

  // ─── Export ───────────────────────────────────────────────────────────────

  function handleExport() {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  function handleSave() {
    startTransition(async () => {
      try {
        await updateTemplate(slug, templateId, config);
        toast.success("Saved");
      } catch {
        toast.error("Failed to save");
      }
    });
  }

  function handleRename(newName: string) {
    setName(newName);
    startTransition(async () => {
      try {
        await renameTemplate(slug, templateId, newName);
      } catch {
        toast.error("Failed to rename");
      }
    });
  }

  // ─── Config settings ──────────────────────────────────────────────────────

  // ─── Pages ────────────────────────────────────────────────────────────────

  function addPage() {
    setConfig((prev) => ({
      ...prev,
      pages: [...prev.pages, { layout: "single", blocks: [] }],
    }));
  }

  function deletePage(pageIndex: number) {
    setConfig((prev) => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== pageIndex),
    }));
  }

  function updatePageLayout(pageIndex: number, layout: Page["layout"]) {
    setConfig((prev) => {
      const pages = prev.pages.map((page, i) => {
        if (i !== pageIndex) return page;
        if (layout === "single") {
          const allBlocks = [
            ...(page.blocks ?? []),
            ...(page.columns?.flat() ?? []),
          ];
          return { layout, blocks: allBlocks } as Page;
        }
        const colCount = layout === "two-column" ? 2 : 3;
        const existing = page.columns ?? [];
        const single = page.blocks ?? [];
        // Distribute single-column blocks into first column when switching
        return {
          layout,
          columns: Array.from({ length: colCount }, (_, ci) =>
            existing[ci] ?? (ci === 0 && single.length ? single : [])
          ),
        } as Page;
      });
      return { ...prev, pages };
    });
  }

  // ─── Blocks ───────────────────────────────────────────────────────────────

  const updateBlock = useCallback(
    (pageIndex: number, columnIndex: number, blockIndex: number, block: Block) => {
      setConfig((prev) => {
        const pages = prev.pages.map((page, pi) => {
          if (pi !== pageIndex) return page;
          const blocks = getBlocks(page, columnIndex).map((b, bi) =>
            bi === blockIndex ? block : b
          );
          return setBlocks(page, columnIndex, blocks);
        });
        return { ...prev, pages };
      });
    },
    []
  );

  const deleteBlock = useCallback(
    (pageIndex: number, columnIndex: number, blockIndex: number) => {
      setConfig((prev) => {
        const pages = prev.pages.map((page, pi) => {
          if (pi !== pageIndex) return page;
          const blocks = getBlocks(page, columnIndex).filter((_, bi) => bi !== blockIndex);
          return setBlocks(page, columnIndex, blocks);
        });
        return { ...prev, pages };
      });
    },
    []
  );

  const moveBlock = useCallback(
    (pageIndex: number, columnIndex: number, blockIndex: number, direction: -1 | 1) => {
      setConfig((prev) => {
        const pages = prev.pages.map((page, pi) => {
          if (pi !== pageIndex) return page;
          const blocks = [...getBlocks(page, columnIndex)];
          const newIndex = blockIndex + direction;
          if (newIndex < 0 || newIndex >= blocks.length) return page;
          [blocks[blockIndex], blocks[newIndex]] = [blocks[newIndex], blocks[blockIndex]];
          return setBlocks(page, columnIndex, blocks);
        });
        return { ...prev, pages };
      });
    },
    []
  );

  // ─── Calendar entries ─────────────────────────────────────────────────────

  function setCalendarEntries(entries: CalendarEntry[]) {
    setConfig((prev) => ({ ...prev, calendar_entries: entries }));
  }

  function setGoogleCalendarSources(sources: GoogleCalendarSource[]) {
    setConfig((prev) => ({ ...prev, google_calendar_sources: sources }));
  }

  // ─── DnD ──────────────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const { data } = event.active;
    if (data.current?.source === "palette") {
      setDraggedBlockType(data.current.blockType as Block["type"]);
    } else if (data.current?.source === "canvas") {
      setDraggedBlockType(data.current.block.type as Block["type"]);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedBlockType(null);
    const { active, over } = event;
    console.log("[dnd]", { active: active.data.current, over: over?.id, overData: over?.data.current });
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    if (!overData) return;

    const isOverBlock = overData.source === "canvas";
    const targetPage: number = overData.pageIndex;
    const targetCol: number = overData.columnIndex;

    if (activeData?.source === "palette") {
      const newBlock = defaultBlock(activeData.blockType as Block["type"]);
      setConfig((prev) => {
        const pages = prev.pages.map((page, pi) => {
          if (pi !== targetPage) return page;
          const cols = getBlocks(page, targetCol);
          const insertAt = isOverBlock ? (overData.blockIndex as number) : cols.length;
          const updated = [...cols];
          updated.splice(insertAt, 0, newBlock);
          return setBlocks(page, targetCol, updated);
        });
        return { ...prev, pages };
      });
    } else if (activeData?.source === "canvas") {
      const srcPage: number = activeData.pageIndex;
      const srcCol: number = activeData.columnIndex;
      const srcIdx: number = activeData.blockIndex;
      const block: Block = activeData.block;

      if (srcPage === targetPage && srcCol === targetCol) {
        // Same column — reorder
        if (!isOverBlock) return;
        const targetIdx: number = overData.blockIndex;
        if (srcIdx === targetIdx) return;
        setConfig((prev) => {
          const pages = prev.pages.map((page, pi) => {
            if (pi !== srcPage) return page;
            return setBlocks(page, srcCol, arrayMove([...getBlocks(page, srcCol)], srcIdx, targetIdx));
          });
          return { ...prev, pages };
        });
      } else {
        // Cross-column / cross-page move
        const insertAt = isOverBlock ? (overData.blockIndex as number) : undefined;
        setConfig((prev) => {
          const pages = prev.pages.map((page, pi) => {
            if (pi === srcPage && pi === targetPage) {
              const fromBlocks = getBlocks(page, srcCol).filter((_, i) => i !== srcIdx);
              const toBlocks = [...getBlocks(page, targetCol)];
              toBlocks.splice(insertAt ?? toBlocks.length, 0, block);
              let updated = setBlocks(page, srcCol, fromBlocks);
              updated = setBlocks(updated, targetCol, toBlocks);
              return updated;
            }
            if (pi === srcPage) {
              return setBlocks(page, srcCol, getBlocks(page, srcCol).filter((_, i) => i !== srcIdx));
            }
            if (pi === targetPage) {
              const toBlocks = [...getBlocks(page, targetCol)];
              toBlocks.splice(insertAt ?? toBlocks.length, 0, block);
              return setBlocks(page, targetCol, toBlocks);
            }
            return page;
          });
          return { ...prev, pages };
        });
      }
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToWindowEdges]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-4 py-2 shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/i/${slug}/newspaper`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={(e) => handleRename(e.target.value.trim() || name)}
            className="h-7 w-56 text-sm font-semibold border-transparent bg-transparent px-1 focus-visible:border-border focus-visible:bg-background"
          />
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Theme</span>
              <select
                className="h-7 rounded-md border bg-background px-2 text-xs"
                value={config.theme ?? 'classic'}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, theme: e.target.value as NewspaperConfig['theme'] }))
                }
              >
                <option value="classic">Classic</option>
                <option value="broadsheet">Broadsheet</option>
                <option value="vintage">Vintage</option>
                <option value="elegant">Elegant</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            <CalendarEntryManager
              entries={config.calendar_entries ?? []}
              onChange={setCalendarEntries}
            />
            <GoogleCalendarSourcePicker
              slug={slug}
              sources={config.google_calendar_sources ?? []}
              onChange={setGoogleCalendarSources}
              initialAccounts={initialAccounts}
            />
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/i/${slug}/newspaper/${templateId}/preview`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Preview PDF
              </Link>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Palette */}
          <aside className="w-36 shrink-0 overflow-y-auto border-r p-3">
            <BlockPalette />
          </aside>

          {/* Canvas */}
          <main className="flex-1 overflow-y-auto p-4 space-y-4">
            {config.pages.map((page, pageIndex) => (
              <PageCard
                key={pageIndex}
                page={page}
                pageIndex={pageIndex}
                pageCount={config.pages.length}
                onUpdateLayout={(layout) => updatePageLayout(pageIndex, layout)}
                onUpdateBlock={(colIdx, blockIdx, block) =>
                  updateBlock(pageIndex, colIdx, blockIdx, block)
                }
                onDeleteBlock={(colIdx, blockIdx) =>
                  deleteBlock(pageIndex, colIdx, blockIdx)
                }
                onMoveBlockUp={(colIdx, blockIdx) =>
                  moveBlock(pageIndex, colIdx, blockIdx, -1)
                }
                onMoveBlockDown={(colIdx, blockIdx) =>
                  moveBlock(pageIndex, colIdx, blockIdx, 1)
                }
                onDeletePage={() => deletePage(pageIndex)}
              />
            ))}

            <Button variant="outline" onClick={addPage} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add page
            </Button>
          </main>
        </div>
      </div>

      <DragOverlay>
        {draggedBlockType && (
          <div className="rounded-md border bg-card px-3 py-1.5 text-xs font-medium shadow-lg opacity-90">
            {draggedBlockType}
          </div>
        )}
      </DragOverlay>

      <ImportJsonDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
      />
    </DndContext>
  );
}
