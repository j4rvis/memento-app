"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  StickyNote,
  Rss,
  BookOpen,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InstanceFeatures } from "@/lib/instance/types";

const moduleItems = [
  { key: "todos" as const, title: "Todos", path: "todos", icon: CheckSquare },
  { key: "notes" as const, title: "Notes", path: "notes", icon: StickyNote },
  { key: "feeds" as const, title: "Feeds", path: "feeds", icon: Rss },
  { key: "articles" as const, title: "Bookmarks", path: "articles", icon: BookOpen },
  { key: "newspaper" as const, title: "Newspaper", path: "newspaper", icon: Newspaper },
];

export function BottomNav({
  slug,
  features,
}: {
  slug: string;
  features: InstanceFeatures;
}) {
  const pathname = usePathname();

  const visibleModules = moduleItems.filter((item) => features[item.key]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background md:hidden">
      <div className="flex h-14 items-center justify-around">
        {visibleModules.map((item) => {
          const isActive = pathname.startsWith(`/i/${slug}/${item.path}`);
          return (
            <Link
              key={item.key}
              href={`/i/${slug}/${item.path}`}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground transition-colors",
                isActive && "text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
