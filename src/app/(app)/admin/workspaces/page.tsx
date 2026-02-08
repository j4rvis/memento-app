import { createServiceRoleClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export default async function AdminWorkspacesPage() {
  const supabase = createServiceRoleClient();

  const { data: instances } = await supabase
    .from("instances")
    .select("id, name, slug, created_at, owner_id")
    .order("created_at", { ascending: false });

  // Get member counts
  const instancesWithCounts = await Promise.all(
    (instances ?? []).map(async (inst) => {
      const { count } = await supabase
        .from("instance_memberships")
        .select("*", { count: "exact", head: true })
        .eq("instance_id", inst.id);

      const { data: owner } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", inst.owner_id)
        .single();

      return {
        ...inst,
        member_count: count ?? 0,
        owner_name: owner?.full_name ?? "Unknown",
      };
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Workspaces</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Created</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {instancesWithCounts.map((inst) => (
            <TableRow key={inst.id}>
              <TableCell className="font-medium">{inst.name}</TableCell>
              <TableCell className="text-muted-foreground">{inst.slug}</TableCell>
              <TableCell>{inst.owner_name}</TableCell>
              <TableCell>{inst.member_count}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(inst.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/workspaces/${inst.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
