"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderOpen, Folder, MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import { useNoteFolders, useCreateFolder, useRenameFolder, useDeleteFolder } from "../lib/hooks";
import type { NoteFolder } from "../lib/types";

interface FolderPanelProps {
  initialFolders: NoteFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}

export function FolderPanel({ initialFolders, selectedFolderId, onSelectFolder }: FolderPanelProps) {
  const { data: folders } = useNoteFolders(initialFolders);
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
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
    const name = newFolderName.trim();
    if (name) {
      createFolder.mutate(name);
    }
    setIsCreating(false);
    setNewFolderName("");
  }

  function startRename(folder: NoteFolder) {
    setRenamingId(folder.id);
    setRenameValue(folder.name);
  }

  function handleRenameSubmit() {
    const name = renameValue.trim();
    if (name && renamingId) {
      renameFolder.mutate({ id: renamingId, name });
    }
    setRenamingId(null);
    setRenameValue("");
  }

  function handleDeleteFolder(id: string) {
    if (selectedFolderId === id) onSelectFolder(null);
    deleteFolder.mutate(id);
  }

  return (
    <div className="hidden md:flex w-[200px] shrink-0 border-r flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Folders</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsCreating(true)}
          title="New folder"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {/* All Notes */}
        <button
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-none hover:bg-accent transition-colors text-left",
            selectedFolderId === null && "bg-accent font-medium"
          )}
          onClick={() => onSelectFolder(null)}
        >
          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">All Notes</span>
        </button>

        {/* User folders */}
        {(folders ?? []).map((folder) => (
          <div key={folder.id} className="group relative">
            {renamingId === folder.id ? (
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
              <button
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-none hover:bg-accent transition-colors text-left",
                  selectedFolderId === folder.id && "bg-accent font-medium"
                )}
                onClick={() => onSelectFolder(folder.id)}
              >
                <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{folder.name}</span>
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
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startRename(folder); }}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </button>
            )}
          </div>
        ))}

        {/* New folder input */}
        {isCreating && (
          <div className="px-3 py-1">
            <input
              ref={newInputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={handleCreateSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubmit();
                if (e.key === "Escape") { setIsCreating(false); setNewFolderName(""); }
              }}
              placeholder="Folder name"
              className="w-full text-sm bg-background border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        )}
      </div>
    </div>
  );
}
