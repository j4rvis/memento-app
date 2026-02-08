"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  StickyNote,
  Rss,
  BookOpen,
  Newspaper,
  User,
  Settings,
  ChevronsUpDown,
  Plus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InstanceFeatures, InstanceRole } from "@/lib/instance/types";

const moduleItems = [
  { key: "todos" as const, title: "Todos", path: "todos", icon: CheckSquare },
  { key: "notes" as const, title: "Notes", path: "notes", icon: StickyNote },
  { key: "feeds" as const, title: "Feeds", path: "feeds", icon: Rss },
  { key: "articles" as const, title: "Articles", path: "articles", icon: BookOpen },
  { key: "newspaper" as const, title: "Newspaper", path: "newspaper", icon: Newspaper },
];

interface AppSidebarProps {
  slug: string;
  instanceName: string;
  features: InstanceFeatures;
  instances: { id: string; name: string; slug: string; role: string }[];
  role: InstanceRole;
}

export function AppSidebar({
  slug,
  instanceName,
  features,
  instances,
  role,
}: AppSidebarProps) {
  const pathname = usePathname();

  const visibleModules = moduleItems.filter((item) => features[item.key]);

  return (
    <Sidebar>
      <SidebarHeader>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
            <span className="flex-1 text-left text-sm font-bold truncate">
              {instanceName}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {instances.map((inst) => (
              <DropdownMenuItem key={inst.id} asChild>
                <Link href={`/i/${inst.slug}`} className="flex items-center gap-2">
                  <span className="truncate">{inst.name}</span>
                  {inst.slug === slug && (
                    <span className="ml-auto text-xs text-muted-foreground">current</span>
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/i/new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Workspace
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleModules.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/i/${slug}/${item.path}`)}
                  >
                    <Link href={`/i/${slug}/${item.path}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/account"}>
                  <Link href="/account">
                    <User className="h-4 w-4" />
                    <span>Account</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {(role === "owner" || role === "admin") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/i/${slug}/settings`)}
                  >
                    <Link href={`/i/${slug}/settings`}>
                      <Settings className="h-4 w-4" />
                      <span>Workspace Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
