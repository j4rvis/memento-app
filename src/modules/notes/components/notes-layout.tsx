"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { useInstance } from "@/lib/instance/context";
import { createNote } from "@/app/(app)/i/[slug]/notes/actions";
import { useNotes, useNoteFolders } from "../lib/hooks";
import { FolderPanel } from "./folder-panel";
import { NotesListPanel } from "./notes-list-panel";
import { NoteEditorPanel } from "./note-editor-panel";
import { fetchTodos } from "@/modules/todos/lib/queries";
import { fetchArticles } from "@/modules/articles/lib/queries";
import { fetchFeedsWithCounts } from "@/modules/feeds/lib/queries";
import type { Note, NoteFolder } from "../lib/types";
import type { WikiLinkResourceType, WikiLinkResource } from "./wiki-link-extension";

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

  // Fetch cross-resource data for wiki link autocomplete
  const { data: todos } = useQuery({
    queryKey: queryKeys.todos.list(instance.id),
    queryFn: () => fetchTodos(instance.id),
    staleTime: 60_000,
  });

  const { data: articles } = useQuery({
    queryKey: queryKeys.articles.list(instance.id),
    queryFn: () => fetchArticles(instance.id),
    staleTime: 60_000,
  });

  const { data: feeds } = useQuery({
    queryKey: queryKeys.feeds.list(instance.id),
    queryFn: () => fetchFeedsWithCounts(instance.id),
    staleTime: 60_000,
  });

  // Build unified resource list for wiki link autocomplete
  const resources = useMemo<WikiLinkResource[]>(() => {
    const result: WikiLinkResource[] = [];
    for (const n of notes) {
      result.push({ type: "note", id: n.id, title: n.title });
    }
    for (const t of todos ?? []) {
      result.push({ type: "todo", id: t.id, title: t.title });
    }
    for (const a of articles ?? []) {
      if (a.title) result.push({ type: "article", id: a.id, title: a.title });
    }
    for (const f of feeds ?? []) {
      if (f.title) result.push({ type: "feed", id: f.id, title: f.title });
    }
    return result;
  }, [notes, todos, articles, feeds]);

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
        await queryClient.invalidateQueries({ queryKey: queryKeys.notes.list(instance.id) });
        setSelectedNoteId(id);
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

  // Navigate to a wiki-linked resource
  const handleNavigate = useCallback((type: WikiLinkResourceType, title: string) => {
    if (type === "note") {
      const target = notes.find((n) => n.title === title);
      if (target) {
        setSelectedNoteId(target.id);
        setSelectedFolderId(target.folder_id ?? null);
      }
      return;
    }
    if (type === "todo") {
      router.push(`/i/${slug}/todos`);
      return;
    }
    if (type === "article") {
      const target = (articles ?? []).find((a) => a.title === title);
      if (target) {
        router.push(`/i/${slug}/articles/${target.id}`);
      } else {
        router.push(`/i/${slug}/articles`);
      }
      return;
    }
    if (type === "feed") {
      const target = (feeds ?? []).find((f) => f.title === title);
      if (target) {
        router.push(`/i/${slug}/feeds/${target.id}`);
      } else {
        router.push(`/i/${slug}/feeds`);
      }
      return;
    }
  }, [notes, articles, feeds, slug, router]);

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
        resources={resources}
        onBack={() => setSelectedNoteId(null)}
        onNoteDeleted={handleNoteDeleted}
        onNoteUpdated={handleNoteUpdated}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
