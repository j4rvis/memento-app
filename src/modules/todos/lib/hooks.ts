"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInstance } from "@/lib/instance/context";
import { queryKeys } from "@/lib/query/keys";
import { fetchTodos, fetchTodoProjects } from "./queries";
import {
  toggleTodo,
  deleteTodo,
} from "@/app/(app)/i/[slug]/todos/actions";

export function useTodos(projectFilter?: string, initialData?: unknown[]) {
  const { instance } = useInstance();
  return useQuery({
    queryKey: queryKeys.todos.list(instance.id, projectFilter),
    queryFn: () => fetchTodos(instance.id, projectFilter),
    initialData: initialData as Awaited<ReturnType<typeof fetchTodos>> | undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useTodoProjects(initialData?: unknown[]) {
  const { instance } = useInstance();
  return useQuery({
    queryKey: queryKeys.todos.projects(instance.id),
    queryFn: () => fetchTodoProjects(instance.id),
    initialData: initialData as Awaited<ReturnType<typeof fetchTodoProjects>> | undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useToggleTodo() {
  const { instance, slug } = useInstance();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleTodo(slug, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.all(instance.id) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.todos.all(instance.id) });
      queryClient.setQueriesData(
        { queryKey: queryKeys.todos.all(instance.id) },
        (old: { id: string; is_completed: boolean }[] | undefined) =>
          old?.map((t) => (t.id === id ? { ...t, is_completed: !t.is_completed } : t)),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all(instance.id) });
    },
  });
}

export function useDeleteTodo() {
  const { instance, slug } = useInstance();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTodo(slug, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.all(instance.id) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.todos.all(instance.id) });
      queryClient.setQueriesData(
        { queryKey: queryKeys.todos.all(instance.id) },
        (old: { id: string }[] | undefined) => old?.filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all(instance.id) });
    },
  });
}
