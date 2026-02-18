"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { useInstance } from "@/lib/instance/context";
import { createNote } from "@/app/(app)/i/[slug]/notes/actions";
import { useNotes, useNoteFolders } from "../lib/hooks";
import { FolderPanel } from "./folder-panel";
import { NotesListPanel } from "./notes-list-panel";
import { NoteEditorPanel } from "./note-editor-panel";
import type { Note, NoteFolder } from "../lib/types";

interface NotesLayoutProps {
  initialNotes: Note[];
  initialFolders: NoteFolder[];
  initialNoteId: string | null;
  initialFolderId: string | null;
}

export function NotesLayout({
  initialNotes,
  initialFolders,
  initialNoteId,
  initialFolderId,
}: NotesLayoutProps) {
  const { instance, slug } = useInstance();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(initialNoteId);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId);

  // Reactive subscriptions so components re-render on cache updates
  const { data: notesData } = useNotes(initialNotes as unknown[]);
  const { data: foldersData } = useNoteFolders(initialFolders);
  const notes = (notesData ?? initialNotes) as Note[];
  const folders = (foldersData ?? initialFolders) as NoteFolder[];

  const selectedNote = selectedNoteId ? (notes.find((n) => n.id === selectedNoteId) ?? null) : null;

  // Keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedNoteId) params.set("note", selectedNoteId);
    if (selectedFolderId) params.set("folder", selectedFolderId);
    const query = params.toString();
    router.replace(`/i/${slug}/notes${query ? `?${query}` : ""}`);
  }, [selectedNoteId, selectedFolderId, slug, router]);

  const handleSelectNote = useCallback((id: string) => {
    setSelectedNoteId(id);
  }, []);

  const handleSelectFolder = useCallback((id: string | null) => {
    setSelectedFolderId(id);
    setSelectedNoteId(null);
  }, []);

  const handleCreateNote = useCallback(async () => {
    const id = await createNote(slug, selectedFolderId);
    // Invalidate to refetch latest
    await queryClient.invalidateQueries({ queryKey: queryKeys.notes.list(instance.id) });
    setSelectedNoteId(id);
  }, [slug, selectedFolderId, queryClient, instance.id]);

  const handleNoteDeleted = useCallback((id: string) => {
    // Find next note in current folder to select
    const remaining = notes.filter((n) => n.id !== id);
    const inFolder = selectedFolderId
      ? remaining.filter((n) => n.folder_id === selectedFolderId)
      : remaining;
    setSelectedNoteId(inFolder[0]?.id ?? null);
  }, [notes, selectedFolderId]);

  const handleNoteUpdated = useCallback((_id: string, _title: string, _content: string) => {
    // Cache is already updated in NoteEditorPanel's performSave
  }, []);

  // Listen for mobile folder changes from select element
  useEffect(() => {
    function onFolderChange(e: Event) {
      const id = (e as CustomEvent<string | null>).detail;
      handleSelectFolder(id);
    }
    document.addEventListener("folderChange", onFolderChange);
    return () => document.removeEventListener("folderChange", onFolderChange);
  }, [handleSelectFolder]);

  return (
    <div className="-m-4 -mb-18 md:-m-6 md:-mb-6 h-[calc(100vh-3.5rem)] flex overflow-hidden border-t">
      <FolderPanel
        initialFolders={initialFolders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={handleSelectFolder}
      />
      <NotesListPanel
        initialNotes={initialNotes}
        selectedNoteId={selectedNoteId}
        selectedFolderId={selectedFolderId}
        folders={folders}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
      />
      <NoteEditorPanel
        note={selectedNote}
        onBack={() => setSelectedNoteId(null)}
        onNoteDeleted={handleNoteDeleted}
        onNoteUpdated={handleNoteUpdated}
      />
    </div>
  );
}
