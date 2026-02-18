"use client";

import { useQuery } from "@tanstack/react-query";
import { useInstance } from "@/lib/instance/context";
import { queryKeys } from "@/lib/query/keys";
import { fetchNewspapers } from "./queries";

export function useNewspapers(initialData?: unknown[]) {
  const { instance } = useInstance();
  return useQuery({
    queryKey: queryKeys.newspapers.list(instance.id),
    queryFn: () => fetchNewspapers(instance.id),
    initialData: initialData as Awaited<ReturnType<typeof fetchNewspapers>> | undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}
