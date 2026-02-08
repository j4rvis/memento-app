import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { TodoList } from "@/modules/todos/components/todo-list";
import { AddTodoForm } from "@/modules/todos/components/add-todo-form";
import { EmptyState } from "@/components/shared/empty-state";
import { CheckSquare } from "lucide-react";

export default async function TodosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { instance } = await resolveInstance(slug);
  const supabase = await createClient();

  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .eq("instance_id", instance.id)
    .order("is_completed", { ascending: true })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Todos</h1>
      <AddTodoForm slug={slug} />
      {todos && todos.length > 0 ? (
        <TodoList todos={todos} slug={slug} />
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="No todos yet"
          description="Add your first todo to get started."
        />
      )}
    </div>
  );
}
