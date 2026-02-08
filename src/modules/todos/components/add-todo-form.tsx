"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { addTodo } from "@/app/(app)/i/[slug]/todos/actions";
import { Plus } from "lucide-react";

interface Project {
  id: string;
  name: string;
  color: string;
}

export function AddTodoForm({
  slug,
  projects = [],
}: {
  slug: string;
  projects?: Project[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Todo
      </Button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await addTodo(slug, formData);
        setIsOpen(false);
      }}
      className="flex gap-2"
    >
      <Input
        name="title"
        placeholder="What needs to be done?"
        required
        autoFocus
      />
      <input type="hidden" name="priority" value="0" />
      {projects.length > 0 && (
        <select
          name="project_id"
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
          defaultValue=""
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      <SubmitButton>Add</SubmitButton>
      <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
