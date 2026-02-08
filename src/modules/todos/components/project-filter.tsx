"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  color: string;
}

export function ProjectFilter({
  projects,
  activeProject,
  slug,
}: {
  projects: Project[];
  activeProject?: string;
  slug: string;
}) {
  if (projects.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/i/${slug}/todos`}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
          !activeProject
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        All
      </Link>
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/i/${slug}/todos?project=${project.id}`}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            activeProject === project.id
              ? "text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
          style={activeProject === project.id ? { backgroundColor: project.color } : undefined}
        >
          {project.name}
        </Link>
      ))}
    </div>
  );
}
