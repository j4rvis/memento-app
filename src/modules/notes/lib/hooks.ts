"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInstance } from "@/lib/instance/context";
import { queryKeys } from "@/lib/query/keys";
import { fetchNotes } from "./queries";
import { togglePin, deleteNote } from "@/app/(app)/i/[slug]/notes/actions";

export function useNotes(initialData?: unknown[]) {
  const { instance } = useInstance();
  return useQuery({
    queryKey: queryKeys.notes.list(instance.id),
    queryFn: () => fetchNotes(instance.id),
    initialData: initialData as Awaited<ReturnType<typeof fetchNotes>> | undefined,
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
        (old: { id: string; is_pinned: boolean }[] | undefined) =>
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
        (old: { id: string }[] | undefined) => old?.filter((n) => n.id !== id),
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
