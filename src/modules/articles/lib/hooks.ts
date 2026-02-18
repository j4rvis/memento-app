"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInstance } from "@/lib/instance/context";
import { queryKeys } from "@/lib/query/keys";
import { fetchArticles, fetchArticleCounts } from "./queries";

export function useArticleCounts(initialData?: unknown[]) {
  const { instance } = useInstance();
  return useQuery({
    queryKey: queryKeys.articles.counts(instance.id),
    queryFn: () => fetchArticleCounts(instance.id),
    initialData: initialData as Awaited<ReturnType<typeof fetchArticleCounts>> | undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useArticles(category?: string, initialData?: unknown[]) {
  const { instance } = useInstance();
  return useQuery({
    queryKey: queryKeys.articles.list(instance.id, category),
    queryFn: () => fetchArticles(instance.id, category),
    initialData: initialData as Awaited<ReturnType<typeof fetchArticles>> | undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useInvalidateArticles() {
  const { instance } = useInstance();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.articles.all(instance.id) });
}
