import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { InstanceProvider } from "@/lib/instance/context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import type { InstanceFeatures } from "@/lib/instance/types";
import { PendingShareHandler } from "@/components/pwa/pending-share-handler";

export default async function InstanceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Parallelize all independent fetches. getSession() reads from cookie (no network call).
  // RLS on profiles and instance_memberships filters to the current user automatically.
  const [{ instance, role }, { data: { session } }, { data: profile }, { data: memberships }] =
    await Promise.all([
      resolveInstance(slug),
      supabase.auth.getSession(),
      supabase.from("profiles").select("full_name, avatar_url").single(),
      supabase.from("instance_memberships").select("role, instances(id, name, slug)"),
    ]);

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_url).data.publicUrl
    : undefined;

  const instances = (memberships || [])
    .map((m) => ({
      ...(m.instances as unknown as { id: string; name: string; slug: string }),
      role: m.role,
    }))
    .filter((i) => i.id);

  const features = (instance.settings as { features: InstanceFeatures }).features;

  return (
    <InstanceProvider instance={instance} role={role}>
      <SidebarProvider>
        <AppSidebar
          slug={slug}
          instanceName={instance.name}
          features={features}
          instances={instances}
          role={role}
        />
        <SidebarInset>
          <AppHeader
            email={session?.user?.email}
            fullName={profile?.full_name ?? undefined}
            avatarUrl={avatarUrl}
          />
          <PendingShareHandler slug={slug} />
          <main className="flex-1 p-4 pb-18 md:p-6 md:pb-6">{children}</main>
          <BottomNav slug={slug} features={features} />
        </SidebarInset>
      </SidebarProvider>
    </InstanceProvider>
  );
}
