"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Newspaper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteTemplate, createTemplate } from "@/app/(app)/i/[slug]/newspaper/actions";

interface Template {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  slug: string;
  templates: Template[];
}

export function NewspaperTemplateList({ slug, templates }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim() || "Untitled Newspaper";
    setCreating(true);
    startTransition(async () => {
      try {
        const id = await createTemplate(slug, name);
        router.push(`/i/${slug}/newspaper/${id}`);
      } catch {
        toast.error("Failed to create template");
        setCreating(false);
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteTemplate(slug, id);
        toast.success("Template deleted");
        router.refresh();
      } catch {
        toast.error("Failed to delete template");
      }
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Newspaper Templates</h1>
        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <Input
            placeholder="Template name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-48"
          />
          <Button type="submit" disabled={creating || isPending}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </form>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-muted-foreground">
          <Newspaper className="h-12 w-12 opacity-30" />
          <p>No templates yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="group relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(t.updated_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/i/${slug}/newspaper/${t.id}`}>
                      <Pencil className="mr-2 h-3 w-3" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDelete(t.id, t.name)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
