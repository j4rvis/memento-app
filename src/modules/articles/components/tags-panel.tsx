"use client";

import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tag, Tags, Inbox, MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import { useArticleTags, useCreateTag, useRenameTag, useDeleteTag } from "../lib/hooks";
import type { ArticleTag } from "../lib/types";

// Droppable wrapper for a tag row
function DroppableTagRow({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && "bg-primary/10 ring-1 ring-inset ring-primary/30 rounded-none")}
    >
      {children}
    </div>
  );
}

interface TagsPanelProps {
  initialTags: ArticleTag[];
  selectedTagId: string | null;
  onSelectTag: (id: string | null) => void;
}

export function TagsPanel({ initialTags, selectedTagId, onSelectTag }: TagsPanelProps) {
  const { data: tags } = useArticleTags(initialTags);
  const createTag = useCreateTag();
  const renameTag = useRenameTag();
  const deleteTag = useDeleteTag();

  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) newInputRef.current?.focus();
  }, [isCreating]);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  function handleCreateSubmit() {
    const name = newTagName.trim();
    if (name) createTag.mutate(name);
    setIsCreating(false);
    setNewTagName("");
  }

  function startRename(tag: ArticleTag) {
    setRenamingId(tag.id);
    setRenameValue(tag.name);
  }

  function handleRenameSubmit() {
    const name = renameValue.trim();
    if (name && renamingId) renameTag.mutate({ id: renamingId, name });
    setRenamingId(null);
    setRenameValue("");
  }

  function handleDeleteTag(id: string) {
    if (selectedTagId === id) onSelectTag(null);
    deleteTag.mutate(id);
  }

  return (
    <div className="hidden md:flex w-[200px] shrink-0 border-r flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tags</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsCreating(true)}
          title="New tag"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {/* Inbox — virtual tag showing untagged bookmarks, droppable to remove tag */}
        <DroppableTagRow id="inbox">
          <button
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-none hover:bg-accent transition-colors text-left",
              selectedTagId === "inbox" && "bg-accent font-medium"
            )}
            onClick={() => onSelectTag("inbox")}
          >
            <Inbox className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">Inbox</span>
          </button>
        </DroppableTagRow>

        {/* All Bookmarks — droppable to remove tag */}
        <DroppableTagRow id="remove-tag">
          <button
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-none hover:bg-accent transition-colors text-left",
              selectedTagId === null && "bg-accent font-medium"
            )}
            onClick={() => onSelectTag(null)}
          >
            <Tags className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">All Bookmarks</span>
          </button>
        </DroppableTagRow>

        {/* Divider */}
        <div className="mx-3 my-1 border-t" />

        {/* User tags */}
        {(tags ?? []).map((tag) => (
          <div key={tag.id} className="group relative">
            {renamingId === tag.id ? (
              <div className="px-3 py-1">
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit();
                    if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                  }}
                  className="w-full text-sm bg-background border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            ) : (
              <DroppableTagRow id={tag.id}>
                <button
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-none hover:bg-accent transition-colors text-left",
                    selectedTagId === tag.id && "bg-accent font-medium"
                  )}
                  onClick={() => onSelectTag(tag.id)}
                >
                  <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{tag.name}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <span
                        className="opacity-0 group-hover:opacity-100 h-5 w-5 inline-flex items-center justify-center rounded hover:bg-accent-foreground/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startRename(tag); }}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </button>
              </DroppableTagRow>
            )}
          </div>
        ))}

        {/* New tag input */}
        {isCreating && (
          <div className="px-3 py-1">
            <input
              ref={newInputRef}
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onBlur={handleCreateSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubmit();
                if (e.key === "Escape") { setIsCreating(false); setNewTagName(""); }
              }}
              placeholder="Tag name"
              className="w-full text-sm bg-background border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        )}
      </div>
    </div>
  );
}
