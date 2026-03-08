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

export const DAILY_NOTES_FOLDER_ID = "__daily__";

function todayTitle() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

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

  // ── Daily Notes: when this virtual folder is selected, auto-open today's note ──
  useEffect(() => {
    if (selectedFolderId !== DAILY_NOTES_FOLDER_ID) return;

    const title = todayTitle();
    const existing = notes.find((n) => n.title === title && n.folder_id === null);
    if (existing) {
      if (selectedNoteId !== existing.id) setSelectedNoteId(existing.id);
    } else {
      // Auto-create today's daily note
      (async () => {
        const id = await createNote(slug, null);
        // Set the title via a Supabase update — createNote creates "Untitled Note"
        // We'll rename it by updating the cache title and triggering a save
        await queryClient.invalidateQueries({ queryKey: queryKeys.notes.list(instance.id) });
        setSelectedNoteId(id);
        // The editor will get "Untitled Note" — the user needs to confirm or we can
        // pre-set the title. We'll update the record directly.
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.from("notes").update({ title }).eq("id", id);
        await queryClient.invalidateQueries({ queryKey: queryKeys.notes.list(instance.id) });
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderId, notes.length]);

  const handleSelectNote = useCallback((id: string) => {
    setSelectedNoteId(id);
  }, []);

  const handleSelectFolder = useCallback((id: string | null) => {
    setSelectedFolderId(id);
    setSelectedNoteId(null);
  }, []);

  const handleCreateNote = useCallback(async () => {
    const folderId = selectedFolderId === DAILY_NOTES_FOLDER_ID ? null : selectedFolderId;
    const id = await createNote(slug, folderId);
    await queryClient.invalidateQueries({ queryKey: queryKeys.notes.list(instance.id) });
    setSelectedNoteId(id);
  }, [slug, selectedFolderId, queryClient, instance.id]);

  const handleNoteDeleted = useCallback((id: string) => {
    const remaining = notes.filter((n) => n.id !== id);
    const inFolder = selectedFolderId && selectedFolderId !== DAILY_NOTES_FOLDER_ID
      ? remaining.filter((n) => n.folder_id === selectedFolderId)
      : remaining;
    setSelectedNoteId(inFolder[0]?.id ?? null);
  }, [notes, selectedFolderId]);

  const handleNoteUpdated = useCallback((_id: string, _title: string, _content: string) => {
    // Cache is already updated in NoteEditorPanel's performSave
  }, []);

  // Navigate to note by title (from wiki links & backlinks)
  const handleNavigateToNote = useCallback((title: string) => {
    const target = notes.find((n) => n.title === title);
    if (target) {
      setSelectedNoteId(target.id);
      // Switch to the folder that contains the target note (or All Notes)
      setSelectedFolderId(target.folder_id ?? null);
    }
  }, [notes]);

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
        notes={notes}
        onBack={() => setSelectedNoteId(null)}
        onNoteDeleted={handleNoteDeleted}
        onNoteUpdated={handleNoteUpdated}
        onNavigateToNote={handleNavigateToNote}
      />
    </div>
  );
}
