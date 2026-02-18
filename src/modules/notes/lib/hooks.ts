"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInstance } from "@/lib/instance/context";
import { queryKeys } from "@/lib/query/keys";
import { fetchNotes, fetchNoteFolders } from "./queries";
import { togglePin, deleteNote, createFolder, renameFolder, deleteFolder } from "@/app/(app)/i/[slug]/notes/actions";
import type { Note, NoteFolder } from "./types";

export function useNotes(initialData?: unknown[]) {
  const { instance } = useInstance();
  return useQuery({
    queryKey: queryKeys.notes.list(instance.id),
    queryFn: () => fetchNotes(instance.id),
    initialData: initialData as Awaited<ReturnType<typeof fetchNotes>> | undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useNoteFolders(initialData?: NoteFolder[]) {
  const { instance } = useInstance();
  return useQuery({
    queryKey: queryKeys.notes.folders(instance.id),
    queryFn: () => fetchNoteFolders(instance.id),
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useTogglePin() {
  const { instance, slug } = useInstance();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => togglePin(slug, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.all(instance.id) });
      const previous = queryClient.getQueryData(queryKeys.notes.list(instance.id));
      queryClient.setQueryData(
        queryKeys.notes.list(instance.id),
        (old: Note[] | undefined) =>
          old?.map((n) => (n.id === id ? { ...n, is_pinned: !n.is_pinned } : n)),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(queryKeys.notes.list(instance.id), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all(instance.id) });
    },
  });
}

export function useDeleteNote() {
  const { instance, slug } = useInstance();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNote(slug, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.all(instance.id) });
      const previous = queryClient.getQueryData(queryKeys.notes.list(instance.id));
      queryClient.setQueryData(
        queryKeys.notes.list(instance.id),
        (old: Note[] | undefined) => old?.filter((n) => n.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(queryKeys.notes.list(instance.id), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all(instance.id) });
    },
  });
}

export function useCreateFolder() {
  const { instance, slug } = useInstance();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createFolder(slug, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.folders(instance.id) });
    },
  });
}

export function useRenameFolder() {
  const { instance, slug } = useInstance();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameFolder(slug, id, name),
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.folders(instance.id) });
      const previous = queryClient.getQueryData(queryKeys.notes.folders(instance.id));
      queryClient.setQueryData(
        queryKeys.notes.folders(instance.id),
        (old: NoteFolder[] | undefined) =>
          old?.map((f) => (f.id === id ? { ...f, name } : f)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKeys.notes.folders(instance.id), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.folders(instance.id) });
    },
  });
}

export function useDeleteFolder() {
  const { instance, slug } = useInstance();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFolder(slug, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.folders(instance.id) });
      const previous = queryClient.getQueryData(queryKeys.notes.folders(instance.id));
      queryClient.setQueryData(
        queryKeys.notes.folders(instance.id),
        (old: NoteFolder[] | undefined) => old?.filter((f) => f.id !== id),
      );
      // Also clear folder_id from notes in that folder
      queryClient.setQueryData(
        queryKeys.notes.list(instance.id),
        (old: Note[] | undefined) =>
          old?.map((n) => (n.folder_id === id ? { ...n, folder_id: null } : n)),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(queryKeys.notes.folders(instance.id), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.folders(instance.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.list(instance.id) });
    },
  });
}
