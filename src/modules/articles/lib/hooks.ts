"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInstance } from "@/lib/instance/context";
import { queryKeys } from "@/lib/query/keys";
import { fetchArticles, fetchArticleTags } from "./queries";
import { createTag, renameTag, deleteTag } from "@/app/(app)/i/[slug]/articles/actions";
import type { Article, ArticleTag } from "./types";

export function useArticles(initialData?: unknown[]) {
  const { instance } = useInstance();
  return useQuery({
    queryKey: queryKeys.articles.list(instance.id),
    queryFn: () => fetchArticles(instance.id),
    initialData: initialData as Awaited<ReturnType<typeof fetchArticles>> | undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useArticleTags(initialData?: ArticleTag[]) {
  const { instance } = useInstance();
  return useQuery({
    queryKey: queryKeys.articles.tags(instance.id),
    queryFn: () => fetchArticleTags(instance.id),
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useInvalidateArticles() {
  const { instance } = useInstance();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.articles.all(instance.id) });
}

export function useCreateTag() {
  const { instance, slug } = useInstance();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createTag(slug, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.tags(instance.id) });
    },
  });
}

export function useRenameTag() {
  const { instance, slug } = useInstance();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameTag(slug, id, name),
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.articles.tags(instance.id) });
      const previous = queryClient.getQueryData(queryKeys.articles.tags(instance.id));
      queryClient.setQueryData(
        queryKeys.articles.tags(instance.id),
        (old: ArticleTag[] | undefined) =>
          old?.map((t) => (t.id === id ? { ...t, name } : t)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKeys.articles.tags(instance.id), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.tags(instance.id) });
    },
  });
}

export function useDeleteTag() {
  const { instance, slug } = useInstance();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTag(slug, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.articles.tags(instance.id) });
      const previous = queryClient.getQueryData(queryKeys.articles.tags(instance.id));
      queryClient.setQueryData(
        queryKeys.articles.tags(instance.id),
        (old: ArticleTag[] | undefined) => old?.filter((t) => t.id !== id),
      );
      // Clear tag_id from articles in that tag
      queryClient.setQueryData(
        queryKeys.articles.list(instance.id),
        (old: Article[] | undefined) =>
          old?.map((a) => (a.tag_id === id ? { ...a, tag_id: null } : a)),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(queryKeys.articles.tags(instance.id), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.tags(instance.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.list(instance.id) });
    },
  });
}
