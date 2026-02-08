import Link from "next/link";
import {
  CheckSquare,
  StickyNote,
  Rss,
  BookOpen,
  Newspaper,
} from "lucide-react";
import { resolveInstance } from "@/lib/instance/server";
import type { InstanceFeatures } from "@/lib/instance/types";

const modules = [
  {
    key: "todos" as const,
    title: "Todos",
    description: "Manage your tasks and to-dos",
    path: "todos",
    icon: CheckSquare,
  },
  {
    key: "notes" as const,
    title: "Notes",
    description: "Write and organize notes",
    path: "notes",
    icon: StickyNote,
  },
  {
    key: "feeds" as const,
    title: "Feeds",
    description: "Follow RSS and Atom feeds",
    path: "feeds",
    icon: Rss,
  },
  {
    key: "articles" as const,
    title: "Articles",
    description: "Save articles to read later",
    path: "articles",
    icon: BookOpen,
  },
  {
    key: "newspaper" as const,
    title: "Newspaper",
    description: "Build custom newspaper editions",
    path: "newspaper",
    icon: Newspaper,
  },
];

export default async function InstanceHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { instance } = await resolveInstance(slug);
  const features = (instance.settings as { features: InstanceFeatures })
    .features;

  const enabledModules = modules.filter((m) => features[m.key]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{instance.name}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enabledModules.map((m) => (
          <Link
            key={m.key}
            href={`/i/${slug}/${m.path}`}
            className="group flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <m.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
            <div>
              <p className="font-medium">{m.title}</p>
              <p className="text-sm text-muted-foreground">{m.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
