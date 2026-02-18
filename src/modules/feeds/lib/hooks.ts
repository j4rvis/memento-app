"use client";

import { useQuery } from "@tanstack/react-query";
import { useInstance } from "@/lib/instance/context";
import { queryKeys } from "@/lib/query/keys";
import { fetchFeedsWithCounts, fetchFeedEntries } from "./queries";

export function useFeedsWithCounts(initialData?: unknown[]) {
  const { instance } = useInstance();
  return useQuery({
    queryKey: queryKeys.feeds.list(instance.id),
    queryFn: () => fetchFeedsWithCounts(instance.id),
    initialData: initialData as Awaited<ReturnType<typeof fetchFeedsWithCounts>> | undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useFeedEntries(initialData?: unknown[]) {
  const { instance } = useInstance();
  return useQuery({
    queryKey: queryKeys.feeds.entries(instance.id),
    queryFn: () => fetchFeedEntries(instance.id),
    initialData: initialData as Awaited<ReturnType<typeof fetchFeedEntries>> | undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}
