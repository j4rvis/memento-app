import { createClient } from "@/lib/supabase/server";
import { TodoList } from "@/modules/todos/components/todo-list";
import { AddTodoForm } from "@/modules/todos/components/add-todo-form";
import { EmptyState } from "@/components/shared/empty-state";
import { CheckSquare } from "lucide-react";

export default async function TodosPage() {
  const supabase = await createClient();

  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .order("is_completed", { ascending: true })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Todos</h1>
      <AddTodoForm />
      {todos && todos.length > 0 ? (
        <TodoList todos={todos} />
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
