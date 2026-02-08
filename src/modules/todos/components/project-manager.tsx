"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProject, updateProject, deleteProject } from "@/app/(app)/i/[slug]/todos/actions";
import { FolderOpen, Plus, Trash2, Users } from "lucide-react";

interface Project {
  id: string;
  name: string;
  color: string;
  is_shared: boolean;
}

export function ProjectManager({
  projects,
  slug,
}: {
  projects: Project[];
  slug: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderOpen className="mr-2 h-4 w-4" />
          Projects
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Projects</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Create new project */}
          <form
            action={async (formData) => {
              await createProject(slug, formData);
            }}
            className="flex gap-2"
          >
            <Input name="name" placeholder="New project name" required className="flex-1" />
            <input type="hidden" name="color" value="#6b7280" />
            <SubmitButton size="sm">
              <Plus className="mr-1 h-3 w-3" />
              Add
            </SubmitButton>
          </form>

          {/* Existing projects */}
          {projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map((project) => (
                <ProjectRow key={project.id} project={project} slug={slug} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No projects yet. Create one above.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProjectRow({ project, slug }: { project: Project; slug: string }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <form
        action={async (formData) => {
          await updateProject(slug, project.id, formData);
          setIsEditing(false);
        }}
        className="space-y-2 rounded-lg border p-3"
      >
        <div className="flex gap-2">
          <Input name="name" defaultValue={project.name} required className="flex-1" />
          <input
            name="color"
            type="color"
            defaultValue={project.color}
            className="h-9 w-9 cursor-pointer rounded-md border p-0.5"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="flex items-center gap-2 text-sm">
            <input
              type="hidden"
              name="is_shared"
              value={String(project.is_shared)}
            />
            <button
              type="button"
              className="flex items-center gap-1"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                input.value = String(input.value !== "true");
                e.currentTarget.querySelector("span")!.textContent =
                  input.value === "true" ? "Shared" : "Private";
              }}
            >
              <Users className="h-3 w-3" />
              <span>{project.is_shared ? "Shared" : "Private"}</span>
            </button>
          </Label>
          <div className="flex-1" />
          <SubmitButton size="sm" variant="outline">Save</SubmitButton>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border p-3">
      <span
        className="h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: project.color }}
      />
      <span className="flex-1 text-sm font-medium">{project.name}</span>
      {project.is_shared && (
        <Users className="h-3 w-3 text-muted-foreground" />
      )}
      <Button size="icon-xs" variant="ghost" onClick={() => setIsEditing(true)}>
        <FolderOpen className="h-3 w-3" />
      </Button>
      <Button
        size="icon-xs"
        variant="ghost"
        onClick={() => deleteProject(slug, project.id)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
