"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pin, Trash2, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { useInstance } from "@/lib/instance/context";
import { useDeleteNote, useTogglePin } from "../lib/hooks";
import type { Note, SyncState } from "../lib/types";

const AUTOSAVE_DELAY_MS = 5000;

function SyncIndicator({ state }: { state: SyncState }) {
  if (state === "idle") return null;
  if (state === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving...
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-green-500" />
        Saved
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="h-3 w-3" />
      Error saving
    </span>
  );
}

interface NoteEditorPanelProps {
  note: Note | null;
  onBack: () => void;
  onNoteDeleted: (id: string) => void;
  onNoteUpdated: (id: string, title: string, content: string) => void;
}

export function NoteEditorPanel({ note, onBack, onNoteDeleted, onNoteUpdated }: NoteEditorPanelProps) {
  const { instance } = useInstance();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const deleteNote = useDeleteNote();
  const togglePin = useTogglePin();

  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [syncState, setSyncState] = useState<SyncState>("idle");

  // Refs for closing over current values in async callbacks
  const noteIdRef = useRef<string | null>(note?.id ?? null);
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  titleRef.current = title;
  contentRef.current = content;

  const performSave = useCallback(async (id: string, t: string, c: string) => {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ title: t, content: c })
        .eq("id", id);

      if (error) {
        setSyncState("error");
        return;
      }

      setSyncState("saved");
      isDirtyRef.current = false;

      // Update React Query cache
      queryClient.setQueryData(
        queryKeys.notes.list(instance.id),
        (old: Note[] | undefined) =>
          old?.map((n) => n.id === id ? { ...n, title: t, content: c, updated_at: new Date().toISOString() } : n),
      );
      onNoteUpdated(id, t, c);

      // Auto-reset to idle after 2s
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSyncState("idle"), 2000);
    } catch {
      setSyncState("error");
    }
  }, [supabase, queryClient, instance.id, onNoteUpdated]);

  const scheduleSave = useCallback(() => {
    if (!noteIdRef.current) return;
    setSyncState("saving");
    isDirtyRef.current = true;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (noteIdRef.current) {
        performSave(noteIdRef.current, titleRef.current, contentRef.current);
      }
    }, AUTOSAVE_DELAY_MS);
  }, [performSave]);

  const flushSave = useCallback(() => {
    if (!isDirtyRef.current || !noteIdRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const id = noteIdRef.current;
    const t = titleRef.current;
    const c = contentRef.current;
    // Fire and forget
    performSave(id, t, c);
  }, [performSave]);

  // When note changes, flush save for old note, reset state for new
  useEffect(() => {
    const prevId = noteIdRef.current;
    const newId = note?.id ?? null;

    if (prevId !== newId) {
      if (prevId && isDirtyRef.current) {
        flushSave();
      }
      noteIdRef.current = newId;
      isDirtyRef.current = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      setSyncState("idle");
    }

    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      flushSave();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDelete() {
    if (!note) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    deleteNote.mutate(note.id, {
      onSuccess: () => onNoteDeleted(note.id),
    });
  }

  function handleTogglePin() {
    if (!note) return;
    togglePin.mutate(note.id);
  }

  if (!note) {
    return (
      <div className="hidden md:flex flex-1 min-w-0 items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">Select a note to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex-1 min-w-0 flex flex-col overflow-hidden",
        !note && "hidden md:flex"
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 md:hidden"
          onClick={onBack}
          title="Back to notes"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleTogglePin}
          title={note.is_pinned ? "Unpin" : "Pin"}
        >
          <Pin className={cn("h-4 w-4", note.is_pinned && "fill-current")} />
        </Button>
        <div className="flex-1" />
        <SyncIndicator state={syncState} />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={handleDelete}
          title="Delete note"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); scheduleSave(); }}
        placeholder="Note title"
        className="px-4 pt-4 pb-2 text-xl font-semibold bg-transparent outline-none border-none placeholder:text-muted-foreground/50 shrink-0"
      />

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); scheduleSave(); }}
        placeholder="Write your note..."
        className="flex-1 px-4 pb-4 bg-transparent outline-none border-none resize-none font-mono text-sm placeholder:text-muted-foreground/50"
      />
    </div>
  );
}
