import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { InstanceProvider } from "@/lib/instance/context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import type { InstanceFeatures } from "@/lib/instance/types";

export default async function InstanceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { instance, role } = await resolveInstance(slug);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user!.id)
    .single();

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_url).data.publicUrl
    : undefined;

  // Fetch all user memberships for instance switcher
  const { data: memberships } = await supabase
    .from("instance_memberships")
    .select("role, instances(id, name, slug)")
    .eq("user_id", user!.id);

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
            email={user!.email}
            fullName={profile?.full_name ?? undefined}
            avatarUrl={avatarUrl}
          />
          <main className="flex-1 p-4 pb-18 md:p-6 md:pb-6">{children}</main>
          <BottomNav slug={slug} features={features} />
        </SidebarInset>
      </SidebarProvider>
    </InstanceProvider>
  );
}
