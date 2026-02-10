import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminEnterButton } from "./enter-button";

export default async function AdminWorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const serviceClient = createServiceRoleClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: instance } = await serviceClient
    .from("instances")
    .select("*")
    .eq("id", id)
    .single();

  if (!instance) notFound();

  const { data: memberships } = await serviceClient
    .from("instance_memberships")
    .select("id, role, user_id, created_at")
    .eq("instance_id", id)
    .order("created_at");

  const members = await Promise.all(
    (memberships ?? []).map(async (m) => {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("full_name")
        .eq("id", m.user_id)
        .single();
      return { ...m, full_name: profile?.full_name ?? "Unknown" };
    })
  );

  // Check if admin is already a member
  const isAlreadyMember = members.some((m) => m.user_id === user!.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/workspaces">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{instance.name}</h1>
        <Badge variant="outline">{instance.slug}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">ID:</span> {instance.id}</div>
            <div><span className="text-muted-foreground">Created:</span> {formatDate(instance.created_at)}</div>
            <div><span className="text-muted-foreground">Settings:</span> <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-auto">{JSON.stringify(instance.settings, null, 2)}</pre></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAlreadyMember ? (
              <Button asChild>
                <Link href={`/i/${instance.slug}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Workspace
                </Link>
              </Button>
            ) : (
              <AdminEnterButton instanceId={instance.id} slug={instance.slug} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.full_name}</TableCell>
                  <TableCell>
                    <Badge variant={m.role === "owner" ? "default" : "secondary"}>
                      {m.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(m.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
