import { createClient } from "@/lib/supabase/server";
import { resolveInstance } from "@/lib/instance/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { removeMember } from "../actions";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { instance, role } = await resolveInstance(slug);

  if (role !== "owner" && role !== "admin") {
    redirect(`/i/${slug}`);
  }

  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("instance_memberships")
    .select("id, role, user_id, profiles(full_name)")
    .eq("instance_id", instance.id)
    .order("created_at");

  // Get emails from auth.users via the current user's context
  // We'll display user_id if we can't get more info
  const members = (memberships || []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    role: m.role,
    name: (m.profiles as unknown as { full_name: string | null })?.full_name || m.user_id.slice(0, 8),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/i/${slug}/settings`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Members</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <span className="font-medium">{member.name}</span>
                <Badge variant="secondary">{member.role}</Badge>
              </div>
              {member.role !== "owner" && role === "owner" && (
                <form action={async () => { "use server"; await removeMember(slug, member.id); }}>
                  <Button variant="ghost" size="icon" type="submit">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
