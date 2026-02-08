import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function InstancePickerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("instance_memberships")
    .select("role, instances(id, name, slug)")
    .eq("user_id", user.id);

  const instances = (memberships || [])
    .map((m) => ({
      ...(m.instances as unknown as { id: string; name: string; slug: string }),
      role: m.role,
    }))
    .filter((i) => i.id);

  // Auto-redirect if user has exactly one instance
  if (instances.length === 1) {
    redirect(`/i/${instances[0].slug}/todos`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Workspaces</h1>
        <Button asChild>
          <Link href="/i/new">
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </Link>
        </Button>
      </div>

      {instances.length > 0 ? (
        <div className="grid gap-4">
          {instances.map((instance) => (
            <Link key={instance.id} href={`/i/${instance.slug}/todos`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{instance.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Role: {instance.role}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No workspaces found.</p>
          <Button asChild>
            <Link href="/i/new">Create your first workspace</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
