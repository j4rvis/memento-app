"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addTodo } from "@/app/(app)/i/[slug]/todos/actions";
import { Plus } from "lucide-react";

export function AddTodoForm({ slug }: { slug: string }) {
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
      <Button type="submit">Add</Button>
      <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
